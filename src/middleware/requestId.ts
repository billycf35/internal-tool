import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        requestId: string;
    }
}

export function registerRequestId(app: FastifyInstance): void {
    app.addHook('onRequest', async (request, reply) => {
        const id = (request.headers['x-request-id'] as string) || randomUUID();
        request.requestId = id;
        reply.header('X-Request-Id', id);
    });
}
