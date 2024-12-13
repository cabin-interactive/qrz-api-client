import { BaseQrzService } from "./base";
import { HttpService } from "./http";
import {
  QrzAdifFormatError,
  QrzQsoValidationError,
  QrzError,
  QrzQsoStationCallsignError
} from "../errors";
import type {
  QsoUploadOptions,
  QsoUploadResponse,
  QrzClientConfig,
  QrzResponse,
  QrzFailResponse
} from "../types";

export class QsoService extends BaseQrzService {
  constructor(
    config: QrzClientConfig,
    private readonly http: HttpService
  ) {
    super(config);
  }

  async uploadQso(adif: string, options: QsoUploadOptions = {}): Promise<QsoUploadResponse> {
    this.validateAdif(adif);

    const params = {
      action: 'INSERT',
      adif,
      ...(options.replace ? { option: 'REPLACE' } : {})
    };

    const response = await this.http.post(params);

    // Handle the two specific failure cases
    if (response.result === 'FAIL') {
      const errorMessage = response.reason;

      if (errorMessage?.includes('duplicate')) {
        throw new QrzError('QSO already exists in logbook');
      }

      if (errorMessage?.includes('station_callsign')) {
        throw new QrzQsoStationCallsignError(errorMessage);
      }
      throw new QrzError(errorMessage || 'Failed to upload QSO');
    }
    if (response.result != 'OK' && response.result != 'REPLACE') {
      throw new QrzError(response.result || 'Failed to upload QSO');
    }
    // Success case (COUNT=1&LOGID=1193649&RESULT=OK)
    return {
      logId: response.logId || '',
      status: response.result,
      count: response.count ? parseInt(response.count, 10) : 1
    };
  }

  private isFailResponse(response: QrzResponse): response is QrzFailResponse {
    return response.result === 'FAIL';
  }

  private validateAdif(adif: string): void {
    // Convert ADIF to uppercase once for all comparisons
    const upperAdif = adif.toUpperCase();

    if (!upperAdif.includes('<EOR>')) {
      throw new QrzAdifFormatError('Invalid ADIF format: missing <eor> tag');
    }

    const requiredFields = ['BAND', 'MODE', 'CALL', 'QSO_DATE', 'TIME_ON'];
    for (const field of requiredFields) {
      if (!upperAdif.includes(`<${field}:`)) {
        // Convert back to lowercase for the error message to match documentation
        const originalField = field.toLowerCase();
        throw new QrzQsoValidationError(
          `Missing required ADIF field: ${originalField}`,
          originalField
        );
      }
    }

    const stationIdentifiers = ['STATION_CALLSIGN', 'OPERATOR'];
    if (!stationIdentifiers.some(field => upperAdif.includes(`<${field}:`))) {
      throw new QrzQsoValidationError(
        'Missing station identification: either station_callsign or operator is required',
        'station_identification'
      );
    }
  }
}