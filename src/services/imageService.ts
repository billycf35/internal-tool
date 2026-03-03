import sharp from 'sharp';
import { ValidationError, UnsupportedFormatError } from '../utils/errors.js';

const SUPPORTED_INPUT_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'tiff', 'avif']);
const SUPPORTED_OUTPUT_FORMATS = new Set(['webp', 'jpg', 'png']);
const SUPPORTED_FIT_VALUES = new Set(['cover', 'contain', 'inside', 'fill', 'outside']);

export interface ConvertOptions {
    format: 'webp' | 'jpg' | 'png';
    quality: number;
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
}

export interface CompressOptions {
    quality: number;
    lossless: boolean;
    effort: number;
    format?: 'webp' | 'jpg' | 'png';
}

export interface ProcessedImage {
    buffer: Buffer;
    contentType: string;
    format: string;
}

const FORMAT_TO_CONTENT_TYPE: Record<string, string> = {
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
};

export function validateConvertOptions(raw: Record<string, unknown>): ConvertOptions {
    const format = (raw.format as string) || 'webp';
    if (!SUPPORTED_OUTPUT_FORMATS.has(format)) {
        throw new ValidationError(
            `Invalid format "${format}". Supported: ${[...SUPPORTED_OUTPUT_FORMATS].join(', ')}`
        );
    }

    const quality = parseNumericOption(raw.quality, 'quality', 1, 100, 80);
    const width = raw.width ? parseNumericOption(raw.width, 'width', 1, 10000) : undefined;
    const height = raw.height ? parseNumericOption(raw.height, 'height', 1, 10000) : undefined;

    let fit: keyof sharp.FitEnum | undefined;
    if (raw.fit) {
        const fitStr = String(raw.fit);
        if (!SUPPORTED_FIT_VALUES.has(fitStr)) {
            throw new ValidationError(
                `Invalid fit "${fitStr}". Supported: ${[...SUPPORTED_FIT_VALUES].join(', ')}`
            );
        }
        fit = fitStr as keyof sharp.FitEnum;
    }

    return { format: format as ConvertOptions['format'], quality, width, height, fit };
}

export function validateCompressOptions(raw: Record<string, unknown>): CompressOptions {
    const quality = parseNumericOption(raw.quality, 'quality', 1, 100, 75);
    const effort = parseNumericOption(raw.effort, 'effort', 0, 6, 4);
    const lossless = raw.lossless === 'true' || raw.lossless === true;

    let format: CompressOptions['format'];
    if (raw.format) {
        const f = String(raw.format);
        if (!SUPPORTED_OUTPUT_FORMATS.has(f)) {
            throw new ValidationError(
                `Invalid format "${f}". Supported: ${[...SUPPORTED_OUTPUT_FORMATS].join(', ')}`
            );
        }
        format = f as CompressOptions['format'];
    }

    return { quality, lossless, effort, format };
}

function parseNumericOption(
    value: unknown,
    name: string,
    min: number,
    max: number,
    defaultVal?: number
): number {
    if (value === undefined || value === null || value === '') {
        if (defaultVal !== undefined) return defaultVal;
        throw new ValidationError(`${name} is required`);
    }
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) {
        throw new ValidationError(`${name} must be an integer`);
    }
    if (num < min || num > max) {
        throw new ValidationError(`${name} must be between ${min} and ${max}`);
    }
    return num;
}

async function validateInput(buffer: Buffer): Promise<sharp.Metadata> {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format || !SUPPORTED_INPUT_FORMATS.has(metadata.format)) {
        throw new UnsupportedFormatError(metadata.format || 'unknown');
    }
    return metadata;
}

export async function convertImage(
    buffer: Buffer,
    options: ConvertOptions
): Promise<ProcessedImage> {
    await validateInput(buffer);

    let pipeline = sharp(buffer);

    // Resize if requested
    if (options.width || options.height) {
        pipeline = pipeline.resize({
            width: options.width,
            height: options.height,
            fit: options.fit || 'cover',
            withoutEnlargement: true,
        });
    }

    // Convert format
    const outputFormat = options.format === 'jpg' ? 'jpeg' : options.format;
    switch (outputFormat) {
        case 'webp':
            pipeline = pipeline.webp({ quality: options.quality });
            break;
        case 'jpeg':
            pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true });
            break;
        case 'png':
            pipeline = pipeline.png({ quality: options.quality });
            break;
    }

    const outputBuffer = await pipeline.toBuffer();

    return {
        buffer: outputBuffer,
        contentType: FORMAT_TO_CONTENT_TYPE[options.format] || 'application/octet-stream',
        format: options.format,
    };
}

export async function compressImage(
    buffer: Buffer,
    options: CompressOptions
): Promise<ProcessedImage> {
    const metadata = await validateInput(buffer);

    let pipeline = sharp(buffer);

    // Determine output format: explicit option > original format
    const targetFormat = options.format
        ? options.format === 'jpg'
            ? 'jpeg'
            : options.format
        : metadata.format === 'jpeg' || metadata.format === 'png' || metadata.format === 'webp'
            ? metadata.format
            : 'webp'; // fallback for other formats

    switch (targetFormat) {
        case 'webp':
            pipeline = pipeline.webp({
                quality: options.quality,
                lossless: options.lossless,
                effort: options.effort,
            });
            break;
        case 'jpeg':
            pipeline = pipeline.jpeg({
                quality: options.quality,
                mozjpeg: true,
            });
            break;
        case 'png':
            pipeline = pipeline.png({
                quality: options.quality,
                effort: options.effort,
            });
            break;
    }

    const outputBuffer = await pipeline.toBuffer();

    const outputKey = targetFormat === 'jpeg' ? 'jpg' : targetFormat;

    return {
        buffer: outputBuffer,
        contentType: FORMAT_TO_CONTENT_TYPE[targetFormat] || 'application/octet-stream',
        format: outputKey,
    };
}
