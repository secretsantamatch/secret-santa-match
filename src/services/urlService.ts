import pako from 'pako';
import type { ExchangeData } from '../types';

const base64UrlEncode = (str: string): string => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const base64UrlDecode = (str: string): string => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
};

export const encodeData = (data: ExchangeData): string => {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = pako.deflate(jsonString);
    const binaryString = String.fromCharCode.apply(null, compressed as unknown as number[]);
    return base64UrlEncode(binaryString);
  } catch (error) {
    console.error("Encoding failed:", error);
    throw new Error("Could not encode event data.");
  }
};

export const decodeData = (encodedString: string): ExchangeData => {
  try {
    const compressedString = base64UrlDecode(encodedString);
    const uint8Array = new Uint8Array(compressedString.length);
    for (let i = 0; i < compressedString.length; i++) {
        uint8Array[i] = compressedString.charCodeAt(i);
    }
    const jsonString = pako.inflate(uint8Array, { to: 'string' });
    const data = JSON.parse(jsonString) as ExchangeData;
    if (!data.p || !data.m) {
        throw new Error("Decoded data is missing required fields.");
    }
    return data;
  } catch (error) {
    console.error("Decoding failed:", error);
    throw new Error("Could not decode event data.");
  }
};
