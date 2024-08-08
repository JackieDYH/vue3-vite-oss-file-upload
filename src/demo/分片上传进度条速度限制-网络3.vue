<template></template>

<script setup lang="ts">
import OSS from 'ali-oss';
// 初始化 OSS 客户端
const ossClient = new OSS({
  region: '<你的区域>',
  accessKeyId: '<你的 Access Key ID>',
  accessKeySecret: '<你的 Access Key Secret>',
  bucket: '<你的 Bucket 名称>'
});

async function multipartUpload(file) {
  if (!ossClient) {
    await initOSSClient();
  }

  const fileName = `${uuidv4()}-${file.name}`;
  const partSize = 5 * 1024 * 1024; // 每个分片的大小为 5MB
  const parallel = 4; // 并行上传的分片数
  const totalParts = Math.ceil(file.size / partSize); // 总分片数
  const parts = [];

  try {
    // 1. 初始化分片上传
    const initResult = await ossClient.initMultipartUpload(fileName);
    const uploadId = initResult.uploadId;

    // 2. 上传每个分片
    for (let i = 0; i < totalParts; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      const uploadPartResult = await ossClient.uploadPart(fileName, uploadId, i + 1, chunk, {
        headers: {
          'x-oss-traffic-limit': '1024kbps' // 限制上传速度为 1024kbps
        }
      });

      parts.push({
        partNumber: i + 1,
        etag: uploadPartResult.etag
      });

      // 更新上传进度
      const progress = Math.round(((i + 1) / totalParts) * 100);
      console.log(`Uploading part ${i + 1}/${totalParts}, progress: ${progress}%`);
    }

    // 3. 完成分片上传
    const completeResult = await ossClient.completeMultipartUpload(fileName, uploadId, parts);
    const url = `http://${bucket}.${region}.aliyuncs.com/${fileName}`;
    console.log(`Multipart upload ${file.name} succeeded, url === `, url);

    return completeResult;
  } catch (err) {
    console.log(`Multipart upload ${file.name} failed === `, err);
    // 如果上传失败，建议调用 abortMultipartUpload 以终止分片上传并清理已上传的分片
    if (uploadId) {
      await ossClient.abortMultipartUpload(fileName, uploadId);
    }
  }
}
</script>

<style scoped lang=""></style>
