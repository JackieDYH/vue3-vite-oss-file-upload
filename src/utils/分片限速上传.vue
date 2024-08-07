<!-- 当你使用阿里云 OSS 的分片上传（Multipart Upload）功能时，确实可以通过一些策略来实现上传速度的限制。虽然阿里云 OSS SDK 本身没有直接提供上传速度限制的功能，但你可以通过一些额外的方式来实现这一目标。

实现上传速度限制的方法
使用定时器或 Promise 延迟:

在上传每个分片之后，可以添加一个延迟来控制上传的速度。
这种方法简单易实现，但可能会导致上传过程变得较为复杂。
使用第三方库:

有些第三方库提供了更高级的上传功能，比如速度限制。
例如，可以考虑使用 axios 结合 axios-multipart-formdata 或者 form-data 库来实现更复杂的上传逻辑。
自定义上传逻辑:

实现一个自定义的上传逻辑，比如使用一个队列来管理分片的上传，并控制每个分片上传的时间间隔。
示例代码
下面是一个使用定时器来实现上传速度限制的示例代码：

说明
上传速度限制:

在 uploadPartWithSpeedLimit 函数中，计算每个分片上传的实际速度，并根据限制速度计算需要等待的时间。
使用 setTimeout 添加延迟来控制上传速度。
计算延迟时间:

计算每个分片上传所需的时间，并与限制速度下的理想时间进行比较。
如果实际上传速度快于限制速度，则添加延迟。
异常处理:

通过捕获异常来处理可能发生的错误。
注意事项
性能影响:

使用定时器可能会对上传性能产生一定的影响，尤其是在网络条件较差的情况下。
用户体验:

限制上传速度可能会影响用户体验，尤其是对于较大的文件。
并发上传:

如果同时上传多个文件，需要考虑如何全局控制上传速度。
这种简单的上传速度限制方法适用于基本的需求。

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
    const uploadSpeedLimit = 500 * 1024; // 限制为 500 KB/s

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
          await uploadPartWithSpeedLimit(part, partNumber);
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

    async function uploadPartWithSpeedLimit(part: Blob, partNumber: number) {
      const startTime = Date.now();
      const result = await client.value.uploadPart({
        key: objectKey.value!,
        partNumber,
        uploadId: uploadId.value!,
        body: part
      });

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      const partSize = part.size;
      const bytesPerSecond = partSize / elapsedTime;
      const delayTime = Math.max(0, (partSize / uploadSpeedLimit) * 1000 - elapsedTime);

      if (delayTime > 0) {
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }

      uploadedParts.value.push({ partNumber, eTag: result.etag });
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
