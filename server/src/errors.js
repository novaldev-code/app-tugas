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
