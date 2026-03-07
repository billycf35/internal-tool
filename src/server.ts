import 'dotenv/config';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { config } from './config/env.js';
import { registerRequestId } from './middleware/requestId.js';
import { registerErrorHandler } from './middleware/errorHandler.js';
import { convertRoutes } from './routes/convert.js';
import { compressRoutes } from './routes/compress.js';
import { healthRoutes } from './routes/health.js';
import { urlCheckRoutes } from './routes/urlCheck.js';
import { docsRoutes } from './routes/docs.js';

async function buildApp() {
    const app = Fastify({
        logger: {
            level: config.LOG_LEVEL,
        },
        trustProxy: true,
        requestTimeout: config.REQUEST_TIMEOUT,
        bodyLimit: config.MAX_FILE_SIZE,
    });

    // Register multipart support
    await app.register(multipart, {
        limits: {
            fileSize: config.MAX_FILE_SIZE,
            files: 1,
        },
    });

    // Middleware
    registerRequestId(app);
    registerErrorHandler(app);

    // Routes
    await app.register(healthRoutes);
    await app.register(convertRoutes);
    await app.register(compressRoutes);
    await app.register(urlCheckRoutes);
    await app.register(docsRoutes);

    return app;
}

async function start() {
    const app = await buildApp();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        app.log.info(`Received ${signal}, shutting down gracefully...`);
        try {
            await app.close();
            process.exit(0);
        } catch (err) {
            app.log.error(err, 'Error during shutdown');
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    try {
        const address = await app.listen({
            port: config.PORT,
            host: config.HOST,
        });
        app.log.info(`🛠️  internal-tool server listening on ${address}`);
        app.log.info(`   GET  /health                — health check`);
        app.log.info(`   GET  /check?url=<url>       — check single URL`);
        app.log.info(`   POST /check                 — check multiple URLs`);
        app.log.info(`   POST /convert               — convert image format`);
        app.log.info(`   POST /compress              — compress image`);
    } catch (err) {
        app.log.error(err, 'Failed to start server');
        process.exit(1);
    }
}

start();
