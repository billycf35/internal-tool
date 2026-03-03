import type { FastifyInstance } from 'fastify';
import { handleCheckSingle, handleCheckBulk } from '../controllers/urlController.js';

export async function urlCheckRoutes(app: FastifyInstance): Promise<void> {
    app.get('/check', handleCheckSingle);
    app.post('/check', handleCheckBulk);
}
