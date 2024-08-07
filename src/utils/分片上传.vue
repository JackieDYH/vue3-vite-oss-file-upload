<!-- 
 你提到的 multipartUploadInit 属性在 OSS 类型上不存在的问题，是因为 ali-oss SDK 的 API 方法名称与你使用的名称不匹配。正确的 API 方法名称应该是 multipartUploadInit。

正确的方法
在 ali-oss SDK 中，初始化 multipart upload 的正确方法是 multipartUploadInit，而不是 multipartUploadInit。

示例代码
下面是使用正确方法的示例代码：
-->
<template>
  <div>
    <button @click="handleUpload">上传文件</button>
    <input type="file" ref="fileInput" @change="onFileChange" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import OSS from 'ali-oss';

export default defineComponent({
  setup() {
    const fileInput = ref<HTMLInputElement | null>(null);
    const client = ref<OSS.Wrapper>();
    const uploadId = ref<string | undefined>();
    const uploadedParts = ref<{ partNumber: number; eTag: string }[]>([]);

    async function initClient() {
      try {
        // 从后端获取临时访问凭证
        const { data } = await fetch('/api/get-sts-token');
        const token = await data.json();

        // 初始化 OSS 客户端
        client.value = new OSS({
          region: 'your-region',
          accessKeyId: token.AccessKeyId,
          accessKeySecret: token.AccessKeySecret,
          stsToken: token.SecurityToken,
          bucket: 'your-bucket-name',
          endpoint: 'oss-cn-hangzhou.aliyuncs.com'
        });
      } catch (error) {
        console.error('Failed to initialize OSS client:', error);
      }
    }

    function onFileChange(event: Event) {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    }

    async function handleUpload(file: File) {
      if (!client.value) {
        await initClient();
      }

      try {
        const objectKey = `path/to/your/${file.name}`;

        // 初始化 multipart upload
        const uploadResult = await client.value.multipartUploadInit(objectKey);
        uploadId.value = uploadResult.uploadId;

        // 分割文件
        const partSize = 5 * 1024 * 1024; // 每个分片的大小为 5 MB
        const parts = splitFileIntoChunks(file, partSize);

        // 上传分片
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const partNumber = i + 1;
          const result = await client.value.uploadPart({
            key: objectKey,
            partNumber,
            uploadId: uploadId.value!,
            body: part
          });

          uploadedParts.value.push({ partNumber, eTag: result.etag });
        }

        // 完成 multipart upload
        await client.value.completeMultipartUpload({
          key: objectKey,
          uploadId: uploadId.value!,
          parts: uploadedParts.value
        });

        console.log('Upload successful');
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    // 分割文件成多个分片
    function splitFileIntoChunks(file: File, chunkSize: number): Blob[] {
      const chunks: Blob[] = [];
      let start = 0;
      while (start < file.size) {
        chunks.push(file.slice(start, start + chunkSize));
        start += chunkSize;
      }
      return chunks;
    }

    return {
      fileInput,
      handleUpload,
      onFileChange
    };
  }
});
</script>
