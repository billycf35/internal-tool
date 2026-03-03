import type { FastifyRequest, FastifyReply } from 'fastify';
import { compressImage, validateCompressOptions } from '../services/imageService.js';
import { NoFileUploadedError, FileTooLargeError } from '../utils/errors.js';

export async function handleCompress(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const file = await request.file();

    if (!file) {
        throw new NoFileUploadedError();
    }

    // Collect buffer from multipart stream
    const chunks: Buffer[] = [];
    for await (const chunk of file.file) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Check if file was truncated (exceeded size limit)
    if (file.file.truncated) {
        throw new FileTooLargeError(0);
    }

    // Merge query params as options
    const options = validateCompressOptions(request.query as Record<string, unknown>);

    const result = await compressImage(buffer, options);

    const outputFilename = `compressed.${result.format}`;

    reply
        .header('Content-Type', result.contentType)
        .header('Content-Length', result.buffer.length)
        .header('Content-Disposition', `inline; filename="${outputFilename}"`)
        .header('X-Output-Format', result.format)
        .header('X-Output-Size', result.buffer.length)
        .send(result.buffer);
}
