export interface EnvConfig {
    PORT: number;
    HOST: string;
    MAX_FILE_SIZE: number;
    REQUEST_TIMEOUT: number;
    URL_CHECK_TIMEOUT: number;
    LOG_LEVEL: string;
}

function parseIntEnv(key: string, fallback: number): number {
    const val = process.env[key];
    if (!val) return fallback;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid integer for env var ${key}: "${val}"`);
    }
    return parsed;
}

export function loadConfig(): EnvConfig {
    return {
        PORT: parseIntEnv('PORT', 3000),
        HOST: process.env.HOST || '0.0.0.0',
        MAX_FILE_SIZE: parseIntEnv('MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB
        REQUEST_TIMEOUT: parseIntEnv('REQUEST_TIMEOUT', 30000), // 30s
        URL_CHECK_TIMEOUT: parseIntEnv('URL_CHECK_TIMEOUT', 15000), // 15s
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    };
}

export const config = loadConfig();
