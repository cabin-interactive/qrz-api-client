# QRZ.com API Client

[![Tests](https://github.com/cabin-interactive/qrz-api-client/actions/workflows/test.yml/badge.svg)](https://github.com/cabin-interactive/qrz-api-client/actions)
![npm](https://img.shields.io/npm/v/@cabin-interactive/qrz-api-client)
![GitHub License](https://img.shields.io/github/license/cabin-interactive/qrz-api-client)

A TypeScript client for interacting with the QRZ.com Logbook API.

## QRZ.com API

This client interacts with the [QRZ.com Logbook API](https://www.qrz.com/docs/logbook/QRZLogbookAPI.html). To use this client, you'll need:

1. A QRZ.com account
2. An XML Subscription in some cases (required for some API features)
3. An API key from QRZ.com

For more information about QRZ.com subscriptions and features, visit [QRZ.com](https://www.qrz.com/).

## Installation

```bash
npm install @cabin-interactive/qrz-api-client
# or
yarn add @cabin-interactive/qrz-api-client
```

## Basic Usage

```typescript
import QrzApiClient from '@cabin-interactive/qrz-api-client';

const client = new QrzApiClient({
  apiKey: 'your-api-key'
});

// Example: Get status
await client.makeRequest({ 
  action: 'STATUS'
});

// Example: With additional parameters
await client.makeRequest({ 
  action: 'STATUS',
  option: 'value',
  customParam: 'value'
});
```

## Authentication
Before making API requests, you can verify your API key is valid:

```typescript
const authTest = await client.testAuth();

if (authTest.isValid) {
  console.log('API key is valid');
} else {
  console.log('Authentication failed:', authTest.error);
  // Possible errors:
  // - 'invalid api key'
  // - 'Could not connect to QRZ.com API'
  // - 'Unknown error occurred while testing API key'
}
```
This test makes a simple STATUS request to verify your API key and connection to QRZ.com

## Supported Actions

The QRZ API supports the following actions:
- `STATUS`
- `INSERT`
- `DELETE`
- `FETCH`

Each action may accept different parameters. See the [QRZ API documentation](https://www.qrz.com/docs/logbook/QRZLogbookAPI.html) for details.

## Features

- Full TypeScript support
- Proper error handling with specific error types
- Automatic case conversion for API parameters
- Modern Promise-based API

## Error Handling

The client provides several error types for different situations:

- `QrzError`: Base error class for general errors
- `QrzAuthError`: Thrown when there are authentication issues
- `QrzNetworkError`: Thrown when network requests fail
- `QrzUnknownActionError`: Thrown when an invalid action is requested

```typescript
import { QrzAuthError } from '@cabin-interactive/qrz-api-client';

try {
  const client = new QrzApiClient({ apiKey: 'your-api-key' });
  await client.makeRequest({ action: 'STATUS' });
} catch (error) {
  if (error instanceof QrzAuthError) {
    // Handle authentication errors
  }
  // Handle other errors...
}
```

## Development

```bash
# Install dependencies
yarn install

# Run tests
yarn test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[ISC](https://choosealicense.com/licenses/isc/)