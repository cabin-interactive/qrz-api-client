export interface QrzConfig {
  apiKey: string;
}

export default class QrzApiClient {
  private apiKey?: string;
  private readonly config: QrzConfig;

  constructor(config: QrzConfig) {
    this.config = config;
  }
}