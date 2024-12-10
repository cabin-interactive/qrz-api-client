import { QrzClientConfig } from "../types";
import { QrzError } from "../errors";

export abstract class BaseQrzService {
  constructor(protected readonly config: QrzClientConfig) {
    if (!config.apiKey) {
      throw new QrzError('API key is required');
    }
    if (!config.userAgent || config.userAgent.trim() === '') {
      throw new QrzError('User agent is required. Please provide a unique identifier for your application.');
    }
    if (config.userAgent.length > 128) {
      throw new QrzError('User agent must be 128 characters or less');
    }
  }

  protected get baseUrl(): string {
    if (!this.config.proxyUrl) {
      if (typeof window !== 'undefined') {
        console.warn('Using QRZ API directly in a browser environment may fail due to CORS restrictions. Consider using a proxy.');
      }
      return 'https://logbook.qrz.com/api';
    }
    try {
      new URL(this.config.proxyUrl);
    } catch (e) {
      throw new QrzError('Invalid proxy URL provided');
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
}