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

const progress = ref(0); // 用于保存上传进度
const selectedFile = ref(null); // 保存选中的文件

// 处理文件选择
const handleFileSelect = event => {
  selectedFile.value = event.target.files[0];
};

// 上传文件
const uploadFile = async () => {
  if (!selectedFile.value) return;

  // 从后端获取签名信息（假设你已经有后端API来提供这些信息）
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

  // 初始化分片上传
  const uploadId = await client.initMultipartUpload(file.name);

  try {
    const parts = [];

    // 开始分片上传
    for (let i = 0; i < totalParts; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      // 上传当前分片
      const result = await client.uploadPart(file.name, uploadId, i + 1, blob);
      parts.push({ ETag: result.etag, PartNumber: i + 1 });

      // 更新上传进度
      progress.value = Math.round(((i + 1) / totalParts) * 100);
    }

    // 完成分片上传
    await client.completeMultipartUpload(file.name, uploadId, parts);

    alert('上传成功');
  } catch (err) {
    console.error(err);
    alert('上传失败，请稍后重试');
  }
};
</script>
