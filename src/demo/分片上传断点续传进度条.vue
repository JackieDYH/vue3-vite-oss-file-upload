<template>
  <div>
    <input type="file" @change="handleFileSelect" />
    <button @click="uploadFile">上传</button>
    <div v-if="progress > 0">上传进度: {{ progress }}%</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OSS from 'ali-oss';

const progress = ref(0); // 上传进度
const selectedFile = ref(null); // 选中的文件
const uploadId = ref(null); // 上传ID
const parts = ref([]); // 上传的分片信息

// 处理文件选择事件
const handleFileSelect = event => {
  selectedFile.value = event.target.files[0];
};

// 上传文件
const uploadFile = async () => {
  if (!selectedFile.value) return;

  // 从后端获取签名信息（这里假设你有一个后端API来获取这些信息）
  const response = await fetch('/api/get-oss-signature');
  const { accessKeyId, accessKeySecret, stsToken, bucket, region } = await response.json();

  // 创建OSS客户端实例
  const client = new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    stsToken,
    bucket
  });

  const file = selectedFile.value;
  const partSize = 5 * 1024 * 1024; // 每个分片5MB
  const totalParts = Math.ceil(file.size / partSize);

  // 检查是否有未完成的上传任务
  const savedUploadId = localStorage.getItem(`${file.name}-uploadId`);
  const savedParts = JSON.parse(localStorage.getItem(`${file.name}-parts`));

  if (savedUploadId && savedParts) {
    // 如果有保存的uploadId和parts信息，恢复上传进度
    uploadId.value = savedUploadId;
    parts.value = savedParts;
    progress.value = Math.round((parts.value.length / totalParts) * 100);
  } else {
    // 初始化一个新的上传任务
    uploadId.value = await client.initMultipartUpload(file.name);
    parts.value = [];
  }

  try {
    // 开始分片上传
    for (let i = parts.value.length; i < totalParts; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      // 上传当前分片
      const result = await client.uploadPart(file.name, uploadId.value, i + 1, blob);
      parts.value.push({ ETag: result.etag, PartNumber: i + 1 });

      // 更新上传进度
      progress.value = Math.round(((i + 1) / totalParts) * 100);

      // 保存上传进度到localStorage
      localStorage.setItem(`${file.name}-uploadId`, uploadId.value);
      localStorage.setItem(`${file.name}-parts`, JSON.stringify(parts.value));
    }

    // 完成分片上传
    await client.completeMultipartUpload(file.name, uploadId.value, parts.value);

    // 上传完成后清除localStorage中的记录
    localStorage.removeItem(`${file.name}-uploadId`);
    localStorage.removeItem(`${file.name}-parts`);

    alert('上传成功');
  } catch (err) {
    console.error(err);
    alert('上传失败，请稍后重试');
  }
};
</script>
