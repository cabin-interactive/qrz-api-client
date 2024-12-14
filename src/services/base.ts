// base.ts
import { QrzClientConfig } from "../types";

export abstract class BaseQrzService {
  private readonly API_URL = 'https://logbook.qrz.com/api';

  constructor(protected readonly config: QrzClientConfig) {
  }

  protected get baseUrl(): string {
    if (!this.config.proxyUrl) {
      this.warnIfBrowser();
      return this.API_URL;
    }
    return this.config.proxyUrl;
  }

  protected createFormData(params: Record<string, string | undefined>): URLSearchParams {
    const upperCaseParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key.toUpperCase()] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    return new URLSearchParams({
      ...upperCaseParams,
      KEY: this.config.apiKey,
    });
  }

  private warnIfBrowser(): void {
    if (typeof window !== 'undefined') {
      console.warn(
        'Using QRZ API directly in a browser environment may fail due to CORS restrictions. Consider using a proxy.'
      );
    }
  }
}