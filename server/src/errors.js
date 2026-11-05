export class HttpError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.errors = errors;
  }
}

export class ValidationError extends HttpError {
  constructor(message, errors = {}) {
    super(400, message, errors);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message) {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HttpError {
  constructor(message, errors = {}) {
    super(409, message, errors);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Sesi tidak valid.', errors = {}) {
    super(401, message, errors);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Permintaan ditolak.', errors = {}) {
    super(403, message, errors);
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends HttpError {
  constructor(
    message = 'Terlalu banyak percobaan. Coba lagi nanti.',
    retryAfterSeconds = 60,
  ) {
    super(429, message);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
