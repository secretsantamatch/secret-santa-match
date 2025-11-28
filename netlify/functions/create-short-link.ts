import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";
import { createHash, randomBytes } from "crypto";

function generateCode(length = 10) {
  // Base56 chars (removed l, 1, I, O, 0 to avoid confusion)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    // Map random byte to character set
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export default async (req: Request, context: Context) => {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    try {
        const body = await req.json();
        const fullUrl = body.fullUrl;
        
        if (!fullUrl) return new Response("Missing URL", { status: 400 });

        // 1. Create a "fingerprint" (Hash) of the long URL
        // This ensures that the exact same URL always generates the exact same hash
        const urlHash = createHash('sha256').update(fullUrl).digest('hex');

        const shortStore = getStore("short-urls");
        const reverseStore = getStore("reverse-urls"); // New store for deduplication

        // 2. Check if we have already shortened this URL globally
        // We look up the hash to see if there is an existing code
        const existingCode = await reverseStore.get(urlHash);

        if (existingCode) {
            // Found it! Return the existing code.
            const origin = new URL(req.url).origin;
            return new Response(JSON.stringify({ shortUrl: `${origin}/s/${existingCode}` }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        // 3. Not found - Generate a new high-entropy code using Crypto
        let code = generateCode(10);
        let attempts = 0;

        // 4. Collision Check (Paranoia Mode)
        // Ensure this specific code hasn't been used before (extremely unlikely with 10 chars)
        while (await shortStore.get(code) && attempts < 3) {
            code = generateCode(10);
            attempts++;
        }
        
        // 5. Save the mapping (Code -> URL) so the redirect works
        await shortStore.set(code, fullUrl);

        // 6. Save the reverse mapping (Hash -> Code) so we don't generate duplicates next time
        await reverseStore.set(urlHash, code);

        // Construct the short URL using the request origin
        const origin = new URL(req.url).origin;
        return new Response(JSON.stringify({ shortUrl: `${origin}/s/${code}` }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Shortener Error:", error);
        return new Response(JSON.stringify({ error: "Failed to shorten link" }), { status: 500 });
    }
};