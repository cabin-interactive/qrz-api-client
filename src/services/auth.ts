// services/auth.ts
import { BaseQrzService } from "./base";
import { HttpService } from "./http";
import { QrzAuthError, QrzNetworkError } from "../errors";
import type { QrzAuthTestResult, QrzClientConfig } from "../types";

export class AuthService extends BaseQrzService {
  constructor(
    config: QrzClientConfig,
    private readonly http: HttpService
  ) {
    super(config);
  }

  async testAuth(): Promise<QrzAuthTestResult> {
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
}