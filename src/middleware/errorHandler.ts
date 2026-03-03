import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors.js';

export function registerErrorHandler(app: FastifyInstance): void {
    app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        const requestId = request.requestId || 'unknown';

        // Handle multipart file size limit
        if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
            request.log.warn({ requestId, err: error }, 'File too large');
            return reply.status(413).send({
                error: 'Payload Too Large',
                message: 'Uploaded file exceeds the maximum allowed size',
                statusCode: 413,
                requestId,
            });
        }

        // Handle known operational errors
        if (error instanceof AppError && error.isOperational) {
            request.log.warn({ requestId, err: error }, error.message);
            return reply.status(error.statusCode).send({
                error: error.constructor.name,
                message: error.message,
                statusCode: error.statusCode,
                requestId,
            });
        }

        // Handle Fastify validation errors
        if (error.validation) {
            request.log.warn({ requestId, err: error }, 'Validation error');
            return reply.status(400).send({
                error: 'ValidationError',
                message: error.message,
                statusCode: 400,
                requestId,
            });
        }

        // Handle non-multipart request errors
        if (error.code === 'FST_INVALID_MULTIPART_CONTENT_TYPE' || error.code === 'FST_ERR_NOT_MULTIPART') {
            request.log.warn({ requestId, err: error }, 'Not a multipart request');
            return reply.status(400).send({
                error: 'BadRequest',
                message: 'Request must be multipart/form-data with a file field named "file"',
                statusCode: 400,
                requestId,
            });
        }

        // Handle Sharp input errors (invalid/corrupt image)
        if (error.message && (
            error.message.includes('Input file is missing') ||
            error.message.includes('Input buffer contains unsupported image format') ||
            error.message.includes('Input file has an unsupported format') ||
            error.message.includes('input is missing')
        )) {
            request.log.warn({ requestId, err: error }, 'Invalid image input');
            return reply.status(415).send({
                error: 'UnsupportedFormat',
                message: 'The uploaded file is not a valid or supported image',
                statusCode: 415,
                requestId,
            });
        }

        // Unexpected errors
        request.log.error({ requestId, err: error }, 'Unexpected error');
        return reply.status(500).send({
            error: 'InternalServerError',
            message: 'An unexpected error occurred',
            statusCode: 500,
            requestId,
        });
    });
}
