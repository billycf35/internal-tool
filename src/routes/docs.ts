import type { FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function resolveDocsPath(): string {
    // In compiled output (dist/routes/), go up to dist/ then into public/
    // In dev (src/routes/), go up to src/ then into public/
    return join(__dirname, '..', 'public', 'docs.html');
}

let cachedHtml: string | null = null;

function getDocsHtml(): string {
    if (!cachedHtml || process.env.NODE_ENV !== 'production') {
        cachedHtml = readFileSync(resolveDocsPath(), 'utf-8');
    }
    return cachedHtml;
}

export async function docsRoutes(app: FastifyInstance): Promise<void> {
    app.get('/', async (_request, reply) => {
        return reply.type('text/html').send(getDocsHtml());
    });
}
