import { BaseQrzService } from "./base";
import {
  QrzNetworkError,
  QrzAuthError,
  QrzUnknownActionError,
  QrzQsoValidationError,
  QrzError
} from "../errors";
import type { QrzResponse } from "../types";
import { parseQrzResponse } from "../parser";

export class HttpService extends BaseQrzService {
  async post(params: Record<string, string | undefined>): Promise<QrzResponse> {
    const formData = this.createFormData(params);

    let rawResponse: string;
    try {
      rawResponse = await this.makeRequest(formData);
    } catch (error) {
      if (error instanceof Error) {
        throw new QrzNetworkError(
          'Failed to connect to QRZ API',
          undefined,
          error
        );
      }
      throw error;
    }

    const response = parseQrzResponse(rawResponse);
    // Handle various error responses from the API
    if (response.status === 'AUTH' || response.result === 'AUTH') {
      throw new QrzAuthError(response.reason || 'Authentication failed');
    }

    if (response.result === 'FAIL') {
      // Handle specific failure cases
      if (response.reason?.includes('unrecognized command')) {
        throw new QrzUnknownActionError(
          response.reason,
          params.action
        );
      }

      if (response.reason?.includes('missing required field')) {
        const field = response.reason.match(/field:\s*(\w+)/)?.[1];
        throw new QrzQsoValidationError(
          response.reason,
          field
        );
      }

      // Generic failure
      throw new QrzError(response.reason || 'Operation failed');
    }

    return response;
  }

  private async makeRequest(formData: URLSearchParams): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.config.userAgent,
      },
      body: formData.toString(),
    });

    // Handle non-200 HTTP responses
    if (!response.ok) {
      throw new QrzNetworkError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return response.text();
  }
}