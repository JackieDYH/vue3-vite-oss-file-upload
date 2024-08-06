<template>
  <h1 class="text-xl font-bold underline cursor-pointer">Hello world! OSS file upload</h1>
  <input type="file" @change="uploadFile" />
</template>
<script setup lang="ts">
import OSS from 'ali-oss';
const client = new OSS({
  // 填写Bucket所在地域。oss-cn-hangzhou.aliyuncs.com以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
  region: import.meta.env.VITE_OSS_REGION,
  // 从环境变量中获取访问凭证。运行本代码示例之前，请确保已设置环境变量OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET。
  accessKeyId: import.meta.env.VITE_OSS_ACCESS_KEY_ID,
  accessKeySecret: import.meta.env.VITE_OSS_ACCESS_KEY_SECRET,
  // 填写存储空间名称。
  bucket: import.meta.env.VITE_OSS_BUCKET
});

console.log('client', client);
// console.log('client2', client.put, client.get);
// console.log('client3', client.putStream);

// 通过请求头设置限速。
const headers = {
  // 设置限速，最小为100 KB/s。
  'x-oss-traffic-limit': 8 * 1024 * 100
};

// 上传文件。
const uploadFile = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files[0];
  console.log('🚀 ~ uploadFile ~ file:', file);

  // 限速上传。
  await client.put(file.name, file, { headers });
  // await client.putStream(file.name, file, { headers, timeout: 60000 }); // 默认超时时长为60000 ms。超时直接报错，限速上传时注意修改超时时长。
  console.log('file', file);
  // 限速下载。
  // await client.get('miku_christmas.glb', { headers, timeout: 60000 });
};
</script>
