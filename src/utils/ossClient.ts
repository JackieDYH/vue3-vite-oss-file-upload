/**
 * 阿里云 OSS 客户端 文件传输 工具
 */
import OSS from 'ali-oss';

// 模拟获取临时凭证
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
const getOssSTSToken = () => {
  return new Promise<OssStsResponse>(resolve => {
    const params = {
      // 认证凭据
      accessKeyId: import.meta.env.VITE_OSS_ACCESS_KEY_ID,
      accessKeySecret: import.meta.env.VITE_OSS_ACCESS_KEY_SECRET,
      // 临时安全令牌
      stsToken: import.meta.env.VITE_OSS_STS_TOKEN,
      // OSS服务所在的地域
      region: import.meta.env.VITE_OSS_REGION,
      // OSS中的存储空间名称
      bucket: import.meta.env.VITE_OSS_BUCKET,
      // 字段通常与STS Token相关联，表示临时凭证的有效期（单位：秒）
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

/**
 * 从OSS上传文件 普通
 * @param {DownloadOptions} options - 上传选项
 */
interface UploadOptions {
  name: string; // 文件名
  file: File; // 要上传的文件
  speedLimitKBps?: number; // 限速值（KB/s），可选
  timeoutMs?: number; // 超时时间（毫秒），可选
}
export const uploadClientFile = async (options: UploadOptions) => {
  const { name, file, speedLimitKBps, timeoutMs } = options;
  if (!file) {
    console.error('No file selected.');
    return;
  }

  if (speedLimitKBps !== undefined && (typeof speedLimitKBps !== 'number' || speedLimitKBps <= 0)) {
    console.error('Invalid speed limit value.');
    return;
  }

  if (timeoutMs !== undefined && (typeof timeoutMs !== 'number' || timeoutMs <= 0)) {
    console.error('Invalid timeout value.');
    return;
  }

  try {
    const client = await getOssClient();

    // 设置限速，单位为KB/s
    const headers = speedLimitKBps ? { 'x-oss-traffic-limit': `${speedLimitKBps * 1024}` } : {};
    const options = { headers, timeout: timeoutMs };
    // 上传文件 timeout 单位为毫秒
    await client.put(name, file, options);
    console.log('File uploaded successfully:', name, file, headers, timeoutMs);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

/**
 * 从OSS下载文件
 * @param {DownloadOptions} options - 下载选项
 */
interface DownloadOptions {
  objectKey: string; // OSS 上的文件路径
  localFilePath: string; // 本地保存路径
  speedLimitKBps?: number; // 限速值（KB/s），可选
  timeoutMs?: number; // 超时时间（毫秒），可选
}
export const downloadClientFile = async (options: DownloadOptions) => {
  const { objectKey, localFilePath, speedLimitKBps, timeoutMs } = options;

  if (!objectKey || !localFilePath) {
    console.error('Invalid object key or local file path.');
    return;
  }

  if (speedLimitKBps !== undefined && (typeof speedLimitKBps !== 'number' || speedLimitKBps <= 0)) {
    console.error('Invalid speed limit value.');
    return;
  }

  if (timeoutMs !== undefined && (typeof timeoutMs !== 'number' || timeoutMs <= 0)) {
    console.error('Invalid timeout value.');
    return;
  }

  try {
    const client = await getOssClient();
    const headers = speedLimitKBps ? { 'x-oss-traffic-limit': `${speedLimitKBps * 1024}` } : {};
    const options = { headers, timeout: timeoutMs };
    await client.get(objectKey, localFilePath, options);
    console.log('File downloaded successfully:', objectKey);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

/**
 * 使用 multipartUpload 方法上传文件到OSS 分片
 * @param {UploadOptions} options - 上传选项
 */
interface UploadOptions {
  name: string; // 文件名
  file: File; // 要上传的文件
  speedLimitKBps?: number; // 限速值（KB/s），可选
  timeoutMs?: number; // 超时时间（毫秒），可选
  partSize?: number; // 分块大小（字节），可选
}
export const multipartUploadClientFile = async (options: UploadOptions) => {
  const { name, file, speedLimitKBps, timeoutMs, partSize } = options;
  let checkpoint;

  if (!file) {
    console.error('No file selected.');
    return;
  }

  if (speedLimitKBps !== undefined && (typeof speedLimitKBps !== 'number' || speedLimitKBps <= 0)) {
    console.error('Invalid speed limit value.');
    return;
  }

  if (timeoutMs !== undefined && (typeof timeoutMs !== 'number' || timeoutMs <= 0)) {
    console.error('Invalid timeout value.');
    return;
  }

  if (partSize !== undefined && (typeof partSize !== 'number' || partSize <= 0)) {
    console.error('Invalid part size value.');
    return;
  }

  try {
    const client = await getOssClient();
    // 8 * 1024 * 100 等于 100 KB/s
    const headers = speedLimitKBps ? { 'x-oss-traffic-limit': `${speedLimitKBps * 1024 * 8}` } : {};
    const multipartOptions = {
      headers,
      parallel: 5,
      timeout: timeoutMs,
      partSize: partSize || 5 * 1024 * 1024, // 每个分片的大小为 5 MB
      checkpoint, //断点续传
      progress: (percentage, cpt) => {
        checkpoint = cpt;
        console.log(`Upload progress: ${percentage.toFixed(2)}%`);
      }
    };

    const result = await client.multipartUpload(name, file, multipartOptions);
    // const url = `http://${bucket}.${region}.aliyuncs.com/${name}`;
    /**
     * 上传参数
      const options = {
        partSize: 100 * 1024 * 1024, // 分片大小 100MB
      };

      // 执行分片上传
      const result = await client.multipartUpload(
        'your-directory/' + name, // 对象名称，前缀为目录,可不配置前缀
        File, // 本地文件
        options
      );
     * result示例
     {
        ETag: '从OSS返回的ETag值',
        Location: 'http://BucketName.oss-region.aliyuncs.com/your-directory/name', // 完整的文件访问URL
        Bucket: 'BucketName', // Bucket名称
        Key: 'your-directory/name' // 对象在OSS中的键名
      }
     */
    console.log('File uploaded successfully:', name, result);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};
