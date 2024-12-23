import { BaseQrzService } from "./base";
import {
  QrzNetworkError,
  QrzAuthError,
  QrzUnknownActionError,
  QrzQsoValidationError,
  QrzDuplicateQsoError,
  QrzQsoStationCallsignError,
  QrzError
} from "../errors";
import type { QrzResponse } from "../types";
import { parseQrzResponse } from "../parser";
// STATUS=FAIL&RESULT=FAIL&REASON=Unable to add QSO to database: duplicate&EXTENDED=
// STATUS=FAIL&RESULT=FAIL&REASON=wrong station_callsign for this logbook KB0ICTS doesnt match book callsign KB0ICT&EXTENDED=
// COUNT=1&LOGID=1193542649&RESULT=OK
// STATUS=FAIL&RESULT=FAIL&REASON=Replace error on record: DXCC could not be determined for TEST2&EXTENDED=
// COUNT=1&RESULT=REPLACE&LOGID=1193504315

export const QRZ_ERROR_RESPONSES = {
  DUPLICATE_QSO: 'Unable to add QSO to database: duplicate',
  WRONG_STATION_CALLSIGN: 'wrong station_callsign for this logbook'
}

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
      if (response.reason?.includes(QRZ_ERROR_RESPONSES.DUPLICATE_QSO)) {
        throw new QrzDuplicateQsoError(response.reason);
      }
      if (response.reason?.includes(QRZ_ERROR_RESPONSES.WRONG_STATION_CALLSIGN)) {
        throw new QrzQsoStationCallsignError(response.reason)
      }
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