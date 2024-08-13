import { servDefRequest } from './request';

export async function ossSTSToken() {
  return servDefRequest('get', '/app-api/infra/sts/get');
}
