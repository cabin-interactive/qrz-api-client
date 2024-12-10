export type QrzAction = 'STATUS' | 'INSERT' | 'DELETE' | 'FETCH';
export type QrzResultType = 'OK' | 'FAIL' | 'AUTH' | 'REPLACE';

export interface QrzAuthTestResult {
  isValid: boolean;
  error?: string;
}

export interface QrzClientConfig {
  apiKey: string;
  userAgent: string;
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
  result: 'OK' | 'REPLACE';
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

export interface QsoUploadOptions {
  /**
   * If true, automatically overwrites any existing duplicate QSOs.
   * WARNING: This WILL overwrite confirmed QSOs with unconfirmed ones
   * if they match the same QSO criteria.
   */
  replace?: boolean;
}

export interface QsoUploadResponse {
  /**
   * The unique ID of the uploaded QSO in the logbook
   */
  logId: string;
  /**
   * Whether the QSO was newly inserted or replaced an existing one
   */
  status: 'inserted' | 'replaced';
  /**
   * The number of QSOs affected (should always be 1)
   */
  count: number;
}