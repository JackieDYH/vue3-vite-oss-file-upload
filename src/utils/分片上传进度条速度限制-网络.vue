<!-- uploadSpeed: 定义为用户可调节的上传速度，单位为KB/s。用户可以通过输入框设置这个值。
options.headers: 在每次分片上传时，通过设置'x-oss-traffic-limit'头部来限制上传速度。
上传速度限制: 这个头部直接在服务器端生效，因此比浏览器端的延迟方法更加精确和高效。
 -->
<template>
  <div>
    <input type="file" @change="handleFileSelect" />
    <div>
      <label for="speed">上传速度限制（KB/s）：</label>
      <input type="number" id="speed" v-model.number="uploadSpeed" />
    </div>
    <button @click="uploadFile">上传</button>
    <div v-if="progress > 0">上传进度: {{ progress }}%</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OSS from 'ali-oss';

const progress = ref(0); // 上传进度
const selectedFile = ref(null); // 选中的文件
const uploadSpeed = ref(1024); // 用户可调节的上传速度（单位：KB/s）

// 处理文件选择
const handleFileSelect = event => {
  selectedFile.value = event.target.files[0];
};

// 上传文件
const uploadFile = async () => {
  if (!selectedFile.value) return;

  // 从后端获取签名信息
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

      // 设置上传速度限制的请求头
      const options = {
        headers: {
          'x-oss-traffic-limit': uploadSpeed.value.toString()
        }
      };

      // 上传当前分片
      const result = await client.uploadPart(file.name, uploadId, i + 1, blob, options);
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
