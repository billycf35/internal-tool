import type { FastifyInstance } from 'fastify';
import { handleConvert } from '../controllers/convertController.js';

export async function convertRoutes(app: FastifyInstance): Promise<void> {
    app.post('/convert', handleConvert);
}
