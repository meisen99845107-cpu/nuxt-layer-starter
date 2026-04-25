import { HttpUtil } from '../../utils/http'

export interface ExampleHealthResponse {
  status?: string
}

export function getExampleHealth() {
  return HttpUtil.post<ExampleHealthResponse>('/health', {})
}
