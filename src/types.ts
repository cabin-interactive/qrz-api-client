export type QrzAction = 'STATUS' | 'INSERT' | 'DELETE' | 'FETCH';
export type QrzResultType = 'OK' | 'FAIL' | 'AUTH';

export interface QrzAuthTestResult {
  isValid: boolean;
  error?: string;
}

export interface QrzConfig {
  apiKey: string;
  proxyUrl?: string;
}

export interface QrzBaseParams {
  action: QrzAction;
  adif?: string;
  option?: string;
  logIds?: string;
  [key: string]: string | undefined;
}

interface QrzBaseResponse {
  result: QrzResultType;
  reason?: string;
  [key: string]: string | undefined;
}

export interface QrzSuccessResponse extends QrzBaseResponse {
  result: 'OK';
  logIds?: string;
  logId?: string;
  count?: string;
  data?: string;
}

export interface QrzFailResponse extends QrzBaseResponse {
  result: 'FAIL';
  reason: string;
}

export interface QrzAuthResponse extends QrzBaseResponse {
  result: 'AUTH';
  reason: string;
}

export type QrzResponse = QrzSuccessResponse | QrzFailResponse | QrzAuthResponse;