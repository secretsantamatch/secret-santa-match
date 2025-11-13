import pako from 'pako';
import type { ExchangeData } from '../types';

// Function to convert Uint8Array to a Base64 string
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Function to convert a Base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

export const compressData = (data: Omit<ExchangeData, 'backgroundOptions'>): string => {
  try {
    // We don't need to store backgroundOptions in the URL, they are loaded client-side
    const dataToCompress = { ...data };
    delete (dataToCompress as any).backgroundOptions;
    
    const jsonString = JSON.stringify(dataToCompress);
    const compressed = pako.deflate(jsonString);
    // URL-safe Base64 encoding
    return uint8ArrayToBase64(compressed)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (e) {
    console.error("Compression failed:", e);
    return '';
  }
};

export const decompressData = (compressedString: string): Omit<ExchangeData, 'backgroundOptions'> | null => {
  try {
    // URL-safe Base64 decoding
    let base64 = compressedString.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    const compressed = base64ToUint8Array(base64);
    const jsonString = pako.inflate(compressed, { to: 'string' });
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Decompression failed:", e);
    return null;
  }
};