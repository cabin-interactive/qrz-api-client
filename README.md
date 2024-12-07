# QRZ API Client

[![Tests](https://github.com/cabin-interactive/qrz-api-client/actions/workflows/test.yml/badge.svg)](https://github.com/cabin-interactive/qrz-api-client/actions)
![GitHub License](https://img.shields.io/github/license/cabin-interactive/qrz-api-client)


A TypeScript client for interacting with the QRZ.com Logbook API.

## Installation

```bash
npm install qrz-api-client
# or
yarn add qrz-api-client
```

## Basic Usage

```typescript
import QrzApiClient from 'qrz-api-client';

const client = new QrzApiClient({
  apiKey: 'your-api-key'
});

// Example coming soon...
```

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
try {
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

[MIT](https://choosealicense.com/licenses/mit/)