export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class UnsupportedFormatError extends AppError {
    constructor(format: string) {
        super(`Unsupported image format: ${format}`, 415);
    }
}

export class FileTooLargeError extends AppError {
    constructor(maxSize: number) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
        super(`File exceeds maximum size of ${maxMB}MB`, 413);
    }
}

export class NoFileUploadedError extends AppError {
    constructor() {
        super('No file uploaded. Send a file with field name "file"', 400);
    }
}
