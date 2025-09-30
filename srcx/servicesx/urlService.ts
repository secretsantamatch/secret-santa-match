import pako from 'pako';
import type { ExchangeData } from '../types';

// Use URL-safe Base64 encoding
const base64UrlEncode = (data: Uint8Array): string => {
    return btoa(String.fromCharCode.apply(null, Array.from(data)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const base64UrlDecode = (str: string): Uint8Array => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    const decoded = atob(str);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
};

export const encodeData = (data: ExchangeData): string => {
    try {
        const jsonString = JSON.stringify(data);
        const compressed = pako.deflate(jsonString);
        return base64UrlEncode(compressed);
    } catch (error) {
        console.error("Failed to encode data:", error);
        return '';
    }
};

export const decodeData = (encodedString: string): ExchangeData | null => {
    try {
        const compressed = base64UrlDecode(encodedString);
        const jsonString = pako.inflate(compressed, { to: 'string' });
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to decode data:", error);
        return null;
    }
};
