import { deflate, inflate } from 'pako';
import type { ExchangeData } from '../types';

export const serializeExchangeData = (data: Omit<ExchangeData, 'backgroundOptions'>): string => {
    const jsonString = JSON.stringify(data);
    const compressed = deflate(jsonString);
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    return encodeURIComponent(base64);
};

export const parseExchangeData = (dataString: string): Omit<ExchangeData, 'backgroundOptions'> | null => {
    try {
        const base64 = decodeURIComponent(dataString);
        const compressed = atob(base64);
        const uint8Array = new Uint8Array(compressed.split('').map(c => c.charCodeAt(0)));
        const jsonString = inflate(uint8Array, { to: 'string' });
        return JSON.parse(jsonString) as Omit<ExchangeData, 'backgroundOptions'>;
    } catch (e) {
        console.error("Failed to parse URL data:", e);
        return null;
    }
};