
import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

function generateCode(length = 10) {
  // Base56 chars (removed l, 1, I, O, 0 to avoid confusion)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async (req: Request, context: Context) => {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    try {
        const body = await req.json();
        const fullUrl = body.fullUrl;
        
        if (!fullUrl) return new Response("Missing URL", { status: 400 });

        const store = getStore("short-urls");
        
        // Generate a high-entropy code (10 chars = ~263 quadrillion combinations)
        const code = generateCode(10); 
        
        await store.set(code, fullUrl);

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
