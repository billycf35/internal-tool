import type { FastifyInstance } from 'fastify';
import { handleCompress } from '../controllers/compressController.js';

export async function compressRoutes(app: FastifyInstance): Promise<void> {
    app.post('/compress', handleCompress);
}
