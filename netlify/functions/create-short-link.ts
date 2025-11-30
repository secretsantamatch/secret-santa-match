
import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";
import { randomBytes } from "crypto";

function generateCode(length = 10) {
  // Base56 chars (removed l, 1, I, O, 0 to avoid confusion)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export default async (req: Request, context: Context) => {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    try {
        const body = await req.json();
        const { fullUrl, uniqueKey } = body;
        
        if (!fullUrl) return new Response("Missing URL", { status: 400 });

        const shortStore = getStore("short-urls");
        const reverseStore = getStore("reverse-lookup"); // Maps uniqueKey -> shortCode

        // 1. Stable Link Logic: If a uniqueKey is provided, check if we already have a code for it.
        if (uniqueKey) {
            const existingCode = await reverseStore.get(uniqueKey, { type: 'text' });
            
            if (existingCode) {
                // Found it! 
                // CRITICAL: Update the destination URL in short-urls to ensure the link points to the latest data.
                // This keeps the link "stable" (same short code) but "fresh" (newest hash).
                await shortStore.set(existingCode, fullUrl);

                const origin = new URL(req.url).origin;
                return new Response(JSON.stringify({ shortUrl: `${origin}/s/${existingCode}` }), {
                    headers: { "Content-Type": "application/json" }
                });
            }
        }

        // 2. New Link Logic: Generate a new high-entropy code
        let code = generateCode(10);
        let attempts = 0;

        // Collision Check (Paranoia Mode)
        while (await shortStore.get(code) && attempts < 3) {
            code = generateCode(10);
            attempts++;
        }
        
        // 3. Save the mapping (Code -> URL) so the redirect works
        await shortStore.set(code, fullUrl);

        // 4. If we have a uniqueKey, save the reverse mapping for next time
        if (uniqueKey) {
            await reverseStore.set(uniqueKey, code);
        }

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
