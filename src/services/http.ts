import { BaseQrzService } from "./base";
import { QrzNetworkError } from "../errors";
import type { QrzResponse } from "../types";
import { parseQrzResponse } from "../parser";

export class HttpService extends BaseQrzService {
  async post(params: Record<string, string | undefined>): Promise<QrzResponse> {
    const formData = this.createFormData(params);
    const response = await this.makeRequest(formData);
    return parseQrzResponse(response);
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

    if (!response.ok) {
      throw new QrzNetworkError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return response.text();
  }
}