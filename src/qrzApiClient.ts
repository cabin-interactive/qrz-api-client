// qrzApiClient.ts
import type { QrzClientConfig, QrzResponse, QrzAuthTestResult, QsoUploadOptions, QsoUploadResponse } from "./types";
import { HttpService } from "./services/http";
import { QsoService } from "./services/qso";
import { QrzAuthError, QrzNetworkError } from "./errors";
import { validateConfig } from "./config";

export default class QrzApiClient {
  private readonly http: HttpService;
  private readonly qso: QsoService;

  constructor(config: QrzClientConfig) {
    // Perform validation here instead of relying on BaseQrzService
    validateConfig(config);

    this.http = new HttpService(config);
    this.qso = new QsoService(config, this.http);
  }

  public async makeRequest(params: Record<string, string | undefined>): Promise<QrzResponse> {
    return this.http.post(params);
  }

  public async testAuth(): Promise<QrzAuthTestResult> {
    try {
      await this.http.post({ action: 'STATUS' });
      return { isValid: true };
    } catch (error) {
      if (error instanceof QrzAuthError) {
        return {
          isValid: false,
          error: error.message
        };
      }
      if (error instanceof QrzNetworkError) {
        return {
          isValid: false,
          error: 'Could not connect to QRZ.com API'
        };
      }
      return {
        isValid: false,
        error: 'Unknown error occurred while testing API key'
      };
    }
  }

  public async uploadQso(adif: string, options?: QsoUploadOptions): Promise<QsoUploadResponse> {
    return this.qso.uploadQso(adif, options);
  }
}