import { QrzError } from "./errors";
import type { QrzClientConfig } from "./types";

export function validateConfig(config: QrzClientConfig): void {
  if (!config.apiKey) {
    throw new QrzError('API key is required');
  }
  if (!config.userAgent?.trim()) {
    throw new QrzError('User agent is required. Please provide a unique identifier for your application.');
  }
  if (config.userAgent.length > 128) {
    throw new QrzError('User agent must be 128 characters or less');
  }
  if (config.proxyUrl) {
    validateProxyUrl(config.proxyUrl);
  }
}

function validateProxyUrl(url: string): void {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') {
      throw new QrzError('Proxy URL must use HTTPS');
    }
  } catch (e) {
    if (e instanceof QrzError) throw e;
    throw new QrzError('Invalid proxy URL provided');
  }
}
