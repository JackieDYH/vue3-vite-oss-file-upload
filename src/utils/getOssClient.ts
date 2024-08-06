import OSS from 'ali-oss';
interface OssStsResponse {
  code: number;
  data: {
    accessKeyId: string;
    accessKeySecret: string;
    stsToken: string;
    region: string;
    bucket: string;
    expiration: number;
  };
}

type OssStsType = {
  accessKeyId: string;
  accessKeySecret: string;
  stsToken: string;
  expiration: number; // 这个是前端计算出的还有多少秒token过期
  region: string;
  bucket: string;
};

const getOssSTSToken = () => {
  return new Promise<OssStsResponse>(resolve => {
    const params = {
      accessKeyId: import.meta.env.VITE_OSS_ACCESS_KEY_ID,
      accessKeySecret: import.meta.env.VITE_OSS_ACCESS_KEY_SECRET,
      stsToken: import.meta.env.VITE_OSS_STS_TOKEN,
      region: import.meta.env.VITE_OSS_REGION,
      bucket: import.meta.env.VITE_OSS_BUCKET,
      expiration: 0
    };
    resolve({ code: 200, data: params });
  });
};

/**
 * 获取OSSClient
 * @param accessKeyId AccessKey ID
 * @param accessKeySecret 从STS服务获取的临时访问密钥AccessKey Secret
 * @param stsToken 从STS服务获取的安全令牌（SecurityToken）
 * @param region Bucket所在地域
 * @param bucket Bucket名称
 */
export default async function getOssClient(): Promise<OSS> {
  const { code, data: params } = await getOssSTSToken();
  if (code !== 200) throw new Error('Failed to fetch OSS STS token.'); // 抛出错误而不是返回 false

  const client = new OSS({
    ...params,
    refreshSTSTokenInterval: params.expiration * 1000, // 注意这里转换为毫秒
    refreshSTSToken: async () => {
      const { code, data } = await getOssSTSToken(); // 过期后刷新token
      if (code === 200) {
        return data;
      }
      throw new Error('Failed to refresh OSS STS token.');
    }
  });

  return client;
}

export const uploadFile = async ({ name, file, speedLimitKBps, timeoutMs }) => {
  if (!file) {
    console.error('No file selected.');
    return;
  }
  try {
    const client = await getOssClient();

    // 设置限速，单位为KB/s
    const headers = speedLimitKBps ? { 'x-oss-traffic-limit': `${speedLimitKBps * 1024}` } : {};

    // 上传文件
    await client.put(file.name, file, { headers, timeout: timeoutMs });

    console.log('File uploaded successfully:', file.name);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};
