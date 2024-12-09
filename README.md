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

## Configuration

The client accepts the following configuration options:

| Option | Required | Description |
|--------|----------|-------------|
| apiKey | Yes | Your QRZ.com API key |
| userAgent | Yes | Unique identifier for your application (max 128 chars) |
| proxyUrl | No | URL of your CORS proxy (recommended for browser use) |

```typescript
// For personal scripts
const client = new QrzApiClient({
  apiKey: 'your-api-key',
  userAgent: 'AppName/Version'
});

// For applications
const client = new QrzApiClient({
  apiKey: 'your-api-key',
  userAgent: 'MyLogbookApp/1.2.0',
  proxyUrl: 'https://your-proxy.url'  // Optional
});
```

According to QRZ.com's requirements:
- For personal scripts: Must include your callsign, e.g. `"MyScript/1.0.0 (AB5XS)"`
- For applications: Use format `"AppName/Version"`, e.g. `"MyLogbookApp/1.2.0"`
- Must be 128 characters or less
- Generic user agents are not allowed and may be subject to rate limiting

## Basic Usage

```typescript
import QrzApiClient from '@cabin-interactive/qrz-api-client';

// Basic setup - will attempt direct API access
const client = new QrzApiClient({
  apiKey: 'your-api-key',
  userAgent: 'AppName/Version'
});

// For browser environments, use a proxy to handle CORS
const client = new QrzApiClient({
  apiKey: 'your-api-key',
  proxyUrl: 'your-proxy-url'  // Optional, but recommended for browsers
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

## CORS and Browser Usage
The QRZ.com API does not support CORS (Cross-Origin Resource Sharing), which means direct API access from browsers is restricted. When using this client in a browser environment, you have two options:

1. Direct access (may fail due to CORS)
2. Use a proxy (recommended for browser environments) 


If you need a proxy, there are free options like [https://corsproxy.io](corsproxy.io)

```typescript
// Using a proxy to handle CORS
const client = new QrzApiClient({
  apiKey: 'your-api-key',
  proxyUrl: 'your-proxy-url' // https://corsproxy.io/?url=https://logbook.qrz.com/api
});
```

If no proxy is specified in a browser environment, the client will warn you about potential CORS issues.

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
- Optional proxy support for browser environments

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