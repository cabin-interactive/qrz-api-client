// services/qso.ts
import { BaseQrzService } from "./base";
import { HttpService } from "./http";
import {
  QrzAdifFormatError,
  QrzQsoValidationError,
  QrzError
} from "../errors";
import type { QsoUploadOptions, QsoUploadResponse, QrzClientConfig } from "../types";

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

    // Verify the response format
    if (!response.logId || !response.count) {
      throw new QrzError('Unexpected API response format');
    }

    const count = parseInt(response.count, 10);
    if (count !== 1) {
      throw new QrzError(`Expected count of 1, got ${count}`);
    }

    return {
      logId: response.logId,
      status: response.result === 'REPLACE' ? 'replaced' : 'inserted',
      count
    };
  }

  private validateAdif(adif: string): void {
    if (!adif.includes('<eor>')) {
      throw new QrzAdifFormatError('Invalid ADIF format: missing <eor> tag');
    }

    const requiredFields = ['band', 'mode', 'call', 'qso_date', 'time_on'];
    for (const field of requiredFields) {
      if (!adif.includes(`<${field}:`)) {
        throw new QrzQsoValidationError(
          `Missing required ADIF field: ${field}`,
          field
        );
      }
    }

    const stationIdentifiers = ['station_callsign', 'operator'];
    if (!stationIdentifiers.some(field => adif.includes(`<${field}:`))) {
      throw new QrzQsoValidationError(
        'Missing station identification: either station_callsign or operator is required',
        'station_identification'
      );
    }
  }
}