import pako from 'pako';
import type { ExchangeData } from '../types';

const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
};

export const encodeData = (data: ExchangeData): string => {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = pako.deflate(jsonString);
    return uint8ArrayToBase64(compressed);
  } catch (error) {
    console.error("Failed to encode data:", error);
    return '';
  }
};

export const decodeData = (encodedData: string): ExchangeData => {
  try {
    const compressed = base64ToUint8Array(encodedData);
    const jsonString = pako.inflate(compressed, { to: 'string' });
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to decode data:", error);
    throw new Error("Invalid or corrupted data in URL.");
  }
};
