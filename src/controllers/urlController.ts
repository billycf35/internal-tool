import type { FastifyRequest, FastifyReply } from 'fastify';
import { checkUrl } from '../services/urlService.js';
import { ValidationError } from '../utils/errors.js';

export async function handleCheckSingle(
    request: FastifyRequest<{ Querystring: { url?: string } }>,
    reply: FastifyReply
): Promise<void> {
    const url = request.query.url;

    if (!url) {
        throw new ValidationError("Missing 'url' query parameter");
    }

    try {
        new URL(url);
    } catch {
        throw new ValidationError('Invalid URL format');
    }

    const result = await checkUrl(url);
    reply.send(result);
}

export async function handleCheckBulk(
    request: FastifyRequest<{ Body: { urls?: string[] } }>,
    reply: FastifyReply
): Promise<void> {
    const { urls } = request.body || {};

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        throw new ValidationError("Body must contain 'urls' array");
    }

    if (urls.length > 100) {
        throw new ValidationError('Maximum 100 URLs per request');
    }

    // Validate all URLs first
    for (const url of urls) {
        try {
            new URL(url);
        } catch {
            throw new ValidationError(`Invalid URL format: ${url}`);
        }
    }

    const results = await Promise.all(urls.map(checkUrl));
    reply.send(results);
}
