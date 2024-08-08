<template>
  <div>
    <input type="file" @change="handleFileChange" />
  </div>
</template>

<script>
import { ref } from 'vue';
import OSS from 'ali-oss';

export default {
  setup() {
    // 初始化 OSS 客户端
    const client = new OSS({
      region: '<你的区域>',
      accessKeyId: '<你的 Access Key ID>',
      accessKeySecret: '<你的 Access Key Secret>',
      bucket: '<你的 Bucket 名称>'
    });

    // 分片上传并限制速度的函数
    const uploadFile = async file => {
      try {
        // 获取上传的标记
        const result = await client.initMultipartUpload(file.name);

        // 分片上传
        const parts = [];
        const chunkSize = 5 * 1024 * 1024; // 每片 5MB
        let start = 0;
        let partNumber = 1;

        while (start < file.size) {
          const end = Math.min(file.size, start + chunkSize);
          const chunk = file.slice(start, end);
          const part = await client.multipartUpload(file.name, chunk, {
            partSize: chunkSize,
            parallel: 2, // 并发数
            headers: {
              'x-oss-traffic-limit': '1024kbps' // 限制上传速度为 1024kbps
            }
          });
          parts.push({
            partNumber,
            etag: part.res.headers['etag']
          });
          start = end;
          partNumber++;
        }

        // 完成上传
        await client.completeMultipartUpload(file.name, result.uploadId, parts);

        console.log('Upload complete!');
      } catch (error) {
        console.error('Upload failed:', error);
      }
    };

    // 文件选择处理函数
    const handleFileChange = event => {
      const file = event.target.files[0];
      if (file) {
        uploadFile(file);
      }
    };

    return {
      handleFileChange
    };
  }
};
</script>
