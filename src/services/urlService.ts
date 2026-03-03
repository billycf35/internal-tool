import { config } from '../config/env.js';

export interface CheckResult {
    url: string;
    status: number;
    ok: boolean;
    redirect: boolean;
    finalUrl: string;
    responseTime: number;
}

export async function checkUrl(url: string): Promise<CheckResult> {
    const start = performance.now();

    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: AbortSignal.timeout(config.URL_CHECK_TIMEOUT),
        });

        const responseTime = Math.round(performance.now() - start);
        const finalUrl = response.url || url;

        return {
            url,
            status: response.status,
            ok: response.ok,
            redirect: finalUrl !== url,
            finalUrl,
            responseTime,
        };
    } catch {
        const responseTime = Math.round(performance.now() - start);

        return {
            url,
            status: 0,
            ok: false,
            redirect: false,
            finalUrl: url,
            responseTime,
        };
    }
}
