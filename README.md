# QRZ.com API Client

[![Tests](https://github.com/cabin-interactive/qrz-api-client/actions/workflows/test.yml/badge.svg)](https://github.com/cabin-interactive/qrz-api-client/actions)
![npm](https://img.shields.io/npm/v/@cabin-interactive/qrz-api-client)
![GitHub License](https://img.shields.io/github/license/cabin-interactive/qrz-api-client)

A TypeScript client for interacting with the QRZ.com Logbook API.

## Table of Contents
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration & Setup](#configuration--setup)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Requirements

- A QRZ.com account
- API key from QRZ.com (XML Subscription required for some features)
- Visit [QRZ.com](https://www.qrz.com/) for more information

## Installation

```bash
npm install @cabin-interactive/qrz-api-client
# or
yarn add @cabin-interactive/qrz-api-client
```

## Configuration & Setup

```typescript
import QrzApiClient from '@cabin-interactive/qrz-api-client';

// Basic setup
const client = new QrzApiClient({
  apiKey: 'your-api-key',
  userAgent: 'MyApp/1.0.0',  // Required, max 128 chars
  proxyUrl: 'https://your-proxy.url'  // Optional, HTTPS required
});

// User Agent Requirements:
// - Personal scripts: Include callsign, e.g. "MyScript/1.0.0 (AB5XS)"
// - Applications: Use format "AppName/Version"
// - Generic agents may be rate-limited

// Browser Usage:
// QRZ.com API doesn't support CORS, so browser apps should use a proxy
// e.g., proxyUrl: 'https://corsproxy.io/?url=https://logbook.qrz.com/api'
```

## Usage

```typescript
// Test Authentication
const authTest = await client.testAuth();
if (!authTest.isValid) {
  console.error('Auth failed:', authTest.error);
}

// Upload a QSO
const adif = `<band:3>20m<mode:3>SSB<call:5>W1ABC<qso_date:8>20240101
<time_on:4>1234<station_callsign:5>W2XYZ<eor>`;

try {
  const result = await client.uploadQso(adif);
  console.log(`QSO uploaded with ID: ${result.logId}`);
} catch (error) {
  if (error instanceof QrzQsoValidationError) {
    console.error(`Missing required field: ${error.field}`);
  }
}

// Raw API Access
await client.makeRequest({ 
  action: 'STATUS',  // Supports: STATUS, INSERT, DELETE, FETCH
  option: 'value'
});
```

Required ADIF fields for QSOs:
- `band`, `mode`, `call`, `qso_date`, `time_on`
- Either `station_callsign` or `operator`

## Development

```bash
# Install dependencies
yarn install

# Run tests
yarn test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

This package was created for HAMRS. If you'd like to talk about this package, [Join the HAMRS Discord Server](https://discord.gg/nngWMtXTqH)

## License

[ISC](https://choosealicense.com/licenses/isc/)