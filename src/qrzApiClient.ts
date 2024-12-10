// qrzApiClient.ts
import type { QrzClientConfig, QrzResponse, QrzAuthTestResult, QsoUploadOptions, QsoUploadResponse } from "./types";
import { HttpService } from "./services/http";
import { AuthService } from "./services/auth";
import { QsoService } from "./services/qso";

export default class QrzApiClient {
  private readonly http: HttpService;
  private readonly auth: AuthService;
  private readonly qso: QsoService;

  constructor(config: QrzClientConfig) {
    this.http = new HttpService(config);
    this.auth = new AuthService(config, this.http);
    this.qso = new QsoService(config, this.http);
  }

  /**
   * Makes a raw request to the QRZ API
   */
  public async makeRequest(params: Record<string, string | undefined>): Promise<QrzResponse> {
    return this.http.post(params);
  }

  /**
   * Tests if the API key is valid
   */
  public async testAuth(): Promise<QrzAuthTestResult> {
    return this.auth.testAuth();
  }

  /**
   * Uploads a single QSO to the logbook
   */
  public async uploadQso(adif: string, options?: QsoUploadOptions): Promise<QsoUploadResponse> {
    return this.qso.uploadQso(adif, options);
  }
}