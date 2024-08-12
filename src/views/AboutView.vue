<template>
  <div class="about">
    <h1>This is an about page</h1>
    <input type="file" @change="uploadFile" />
    <button @click="downloadFile">下载</button>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import getOssClient, {
  uploadClientFile,
  multipartUploadClientFile,
  downloadClientFile
} from '@/utils/getOssClient';

// 通过请求头设置限速。
const headers = {
  // 设置限速，最小为100 KB/s。
  'x-oss-traffic-limit': 8 * 1024 * 100
};
const uploadFile = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files[0];
  console.log('🚀 ~ uploadFile ~ file:', file);

  const client = await getOssClient();
  console.log('🚀 ~ client:', client);
  // 限速上传。
  // await client.put(file.name, file, { headers });
  // await uploadClientFile({
  //   name: '20240810/' + file.name,
  //   file,
  //   speedLimitKBps: 800,
  //   timeoutMs: 120000
  // });
  // 分片上传 ok
  await multipartUploadClientFile({
    name: '20240810/' + file.name,
    file,
    speedLimitKBps: 100000, //30KB/s 100000 = 100MB/s
    timeoutMs: 120000,
    partSize: 100 * 1024 * 1024
  });
};

// 下载文件
const downloadFile = async () => {
  await downloadClientFile({
    name: '20240810/打印机.glb'
  });
};

// 使用
// async function uploadFileAction(file, client) {
//   let newClient = client;
//   // 伪代码：
//   // if (!newClient || token is expired) { // 如果是没有实例对象或者token过期了就要重新生成
//   //  newClient = await getOssClient(); // 调用上面我们封装好的一个方法
//   // }
//   const filePath = 'xxx/xxx/' // 最中在bucket中的存放的路径根据业务需要自行设置，文件名也是可以自行设置
//   const { res, name, url } = await newClient.put(`${filePath}${file.name}`, file);
//   if (res.status === 200) {
//     // 这里拿到上传成功的文件的url
//     return url
//   }
// }
</script>

<style scoped lang="scss">
/* @media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
} */
</style>
