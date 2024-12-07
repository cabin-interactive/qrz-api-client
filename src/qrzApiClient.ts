// qrzApiClient.ts
import { parseQrzResponse } from "./parser";
import { QrzError, QrzAuthError, QrzNetworkError, QrzUnknownActionError } from "./errors";
import { QrzBaseParams, QrzConfig, QrzResponse } from "./types";


export default class QrzApiClient {
  private readonly config: QrzConfig;
  private readonly baseUrl = 'https://logbook.qrz.com/api';

  constructor(config: QrzConfig) {
    if (!config.apiKey) {
      throw new QrzError('API key is required');
    }
    this.config = config;
  }

  /**
   * Makes a request to the QRZ API
   * 
   * @param params - Request parameters
   * @param params.action - Type of request ('STATUS', 'INSERT', 'DELETE', 'FETCH')
   * @param params.adif - Optional ADIF formatted input data
   * @param params.option - Optional action-specific options
   * @param params.logIds - Optional comma separated list of integer logid values
   * 
   * @throws {QrzNetworkError} When the HTTP request fails
   * @throws {QrzUnknownActionError} When the action is not recognized by the API
   * @throws {QrzAuthError} When the API key is invalid or lacks privileges
   * @throws {QrzError} For other API-level errors
   */
  private async makeRequest(params: QrzBaseParams): Promise<QrzResponse> {
    const formData = new URLSearchParams({
      ...Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key.toUpperCase()] = value;
        }
        return acc;
      }, {} as Record<string, string>),
      KEY: this.config.apiKey,
    });

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new QrzNetworkError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const text = await response.text();
    const parsedResponse = parseQrzResponse(text);
    const result = parsedResponse.result;

    switch (result) {
      case 'AUTH':
        throw new QrzAuthError(parsedResponse.reason || 'Authentication failed');
      case 'FAIL':
        if (parsedResponse.reason === 'unrecognized command') {
          throw new QrzUnknownActionError(parsedResponse.reason, params.action);
        }
        throw new QrzError(parsedResponse.reason || 'Operation failed');
      case 'OK':
        return parsedResponse;
      default:
        throw new QrzError(`Unknown result type: ${result}`);
    }
  }
}