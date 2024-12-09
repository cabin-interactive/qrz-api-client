// qrzApiClient.ts
import { parseQrzResponse } from "./parser";
import { QrzError, QrzAuthError, QrzNetworkError, QrzUnknownActionError } from "./errors";
import { QrzBaseParams, QrzConfig, QrzResponse, QrzAuthTestResult } from "./types";


export default class QrzApiClient {
  private readonly config: QrzConfig;

  constructor(config: QrzConfig) {
    if (!config.apiKey) {
      throw new QrzError('API key is required');
    }
    this.config = config;
  }

  private get baseUrl(): string {
    // Direct API URL
    if (!this.config.proxyUrl) {
      // Check if we're in a browser
      if (typeof window !== 'undefined') {
        console.warn('Using QRZ API directly in a browser environment may fail due to CORS restrictions. Consider using a proxy.');
      }
      return 'https://logbook.qrz.com/api';
    }
    // Use provided proxy
    return this.config.proxyUrl;
  }

  private createFormData(params: QrzBaseParams): URLSearchParams {
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
  private async fetchWithErrorHandling(formData: URLSearchParams): Promise<string> {
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

    return response.text();
  }

  private handleQrzResponse(parsedResponse: QrzResponse, action: string): QrzResponse {
    const result = parsedResponse.result;

    switch (result) {
      case 'AUTH':
        throw new QrzAuthError(parsedResponse.reason || 'Authentication failed');
      case 'FAIL':
        if (parsedResponse.reason === 'unrecognized command') {
          throw new QrzUnknownActionError(parsedResponse.reason, action);
        }
        throw new QrzError(parsedResponse.reason || 'Operation failed');
      case 'OK':
        return parsedResponse;
      default:
        throw new QrzError(`Unknown result type: ${result}`);
    }
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
  public async makeRequest(params: QrzBaseParams): Promise<QrzResponse> {
    const formData = this.createFormData(params);
    const responseText = await this.fetchWithErrorHandling(formData);
    const parsedResponse = parseQrzResponse(responseText);
    return this.handleQrzResponse(parsedResponse, params.action);
  }

  /**
   * Tests if the API key is valid by making a STATUS request
   * 
   * @returns Promise<AuthTestResult> Object containing test result
   * @example
   * const result = await client.testAuth();
   * if (result.isValid) {
   *   console.log('API key is valid');
   * } else {
   *   console.log('API key is invalid:', result.error);
   * }
   */
  public async testAuth(): Promise<QrzAuthTestResult> {
    try {
      await this.makeRequest({ action: 'STATUS' });
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