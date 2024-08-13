import axios from 'axios';
import type {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';

// 创建axios实例
const Service = axios.create({
  // baseURL: process.env.VUE_APP_URL_API, // 设置你的API基础URL
  timeout: 10000 // 请求超时时间
  // withCredentials: true, // 允许携带凭据
  // headers: {
  //   'Content-Type': 'application/json',
  // }
});

// 请求拦截器
Service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('请求拦截器-config', config);
    // 设置token
    const token = localStorage.getItem('token') || '';
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const filterEmptyValue = (options: Record<string, any> = {}) => {
      return Object.keys(options).reduce(
        (acc, cur) =>
          ['', null, undefined].includes(options[cur]) ? acc : { ...acc, [cur]: options[cur] },
        {}
      );
    };

    if (['POST', 'PUT'].includes(config.method?.toUpperCase() ?? '')) {
      config.data = filterEmptyValue(config.data);
    }
    if (['GET', 'DELETE'].includes(config.method?.toUpperCase() ?? '')) {
      config.params = filterEmptyValue(config.params);
    }

    const language = localStorage.getItem('language') || 'cn';
    config.headers['Accept-Language'] = language;
    config.headers['tenant-id'] = '1';

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
Service.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('响应拦截器-response', response);
    if (response.status === 200) {
      switch (response.data.code) {
        // Handle different response codes here
        default:
          break;
      }
      return Promise.resolve(response.data);
    } else {
      return Promise.reject(response);
    }
  },
  async (error: AxiosError) => {
    console.log(error.response);
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ data: { msg: 'http timeout', error } });
    }
    if (error.response) {
      switch (error.response.status) {
        case 403:
          console.log('没有权限');
          // Handle 403 status code
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

// 请求方法映射
const methodTypeMap = {
  POST: Service.post,
  PUT: Service.put,
  GET: Service.get,
  DELETE: Service.delete
};

/**
 * request封装
 * @param method
 * @param url
 * @param data
 * @param headers
 * @returns
 */
function request<T = any>(
  method: string,
  url: string,
  data?: any,
  headers?: Record<string, string>
): Promise<T> {
  method = method.toUpperCase();

  switch (method) {
    case 'POST':
    case 'PUT':
      return methodTypeMap[method](url, data, { headers });
    case 'GET':
    case 'DELETE':
      return methodTypeMap[method](url, {
        params: data,
        headers
      });
    default:
      console.log(`***不支持的请求方式***【${method}】`);
      return Promise.reject(new Error(`***不支持的请求方式***【${method}】`));
  }
}

/**
 * 统一请求方法
 * @param method
 * @param path
 * @param data
 * @param headers
 * @returns
 */
export async function servRequest<T = any>(
  method: string,
  path: string,
  data?: any,
  headers?: Record<string, string>
): Promise<T> {
  console.log(`${process.env.VUE_APP_URL_API}${path}`);
  try {
    const resp = await request<T>(method, `${process.env.VUE_APP_URL_API}${path}`, data, headers);
    return resp;
  } catch (err) {
    throw err;
  }
}

/**
 * 统一默认请求方法
 * @param method
 * @param path
 * @param data
 * @param headers
 * @returns
 */
export async function servDefRequest<T = any>(
  method: string,
  path: string,
  data?: any,
  headers?: Record<string, string>
): Promise<T> {
  console.log(`域名：${path}`);
  try {
    const resp = await request<T>(method, path, data, headers);
    return resp;
  } catch (err) {
    throw err;
  }
}
