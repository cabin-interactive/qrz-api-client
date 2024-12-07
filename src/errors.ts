// Base error class for all Qrz-related errors
export class QrzError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QrzError'
    Object.setPrototypeOf(this, QrzError.prototype)
  }
}

// Authentication-related errors
export class QrzAuthError extends QrzError {
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'QrzAuthError'
    Object.setPrototypeOf(this, QrzAuthError.prototype)
  }
}

// Session-related errors
export class QrzSessionError extends QrzError {
  constructor(message: string = 'Invalid or expired session') {
    super(message)
    this.name = 'QrzSessionError'
    Object.setPrototypeOf(this, QrzSessionError.prototype)
  }
}

// Rate limiting errors
export class QrzRateLimitError extends QrzError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message)
    this.name = 'QrzRateLimitError'
    Object.setPrototypeOf(this, QrzRateLimitError.prototype)
  }
}

// Network-related errors
export class QrzNetworkError extends QrzError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'QrzNetworkError'
    Object.setPrototypeOf(this, QrzNetworkError.prototype)
  }
}

// Invalid input errors
export class QrzValidationError extends QrzError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message)
    this.name = 'QrzValidationError'
    Object.setPrototypeOf(this, QrzValidationError.prototype)
  }
}

// Not found errors
export class QrzNotFoundError extends QrzError {
  constructor(
    message: string = 'Resource not found',
    public readonly callsign?: string
  ) {
    super(message)
    this.name = 'QrzNotFoundError'
    Object.setPrototypeOf(this, QrzNotFoundError.prototype)
  }
}
// ACTION was not recognized by the QRZ API
export class QrzUnknownActionError extends QrzError {
  constructor(
    message: string,
    public readonly command?: string
  ) {
    super(message)
    this.name = 'QrzUnrecognizedCommandError'
    Object.setPrototypeOf(this, QrzUnknownActionError.prototype)
  }
}
