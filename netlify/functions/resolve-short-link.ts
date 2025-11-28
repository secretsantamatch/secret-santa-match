
import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
    // 1. Rate Limiting Logic
    const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("client-ip") || "unknown";
    
    if (ip !== "unknown") {
        try {
            const rateStore = getStore("rate-limits");
            const now = Date.now();
            const WINDOW_MS = 60 * 1000; // 1 minute window
            const LIMIT = 20; // 20 requests per minute

            // Get current rate data for IP
            const rawData = await rateStore.get(ip, { type: 'json' });
            let data = rawData as { count: number, timestamp: number } | null;

            if (!data || (now - data.timestamp > WINDOW_MS)) {
                // Reset window or new user
                data = { count: 1, timestamp: now };
            } else {
                // Increment count within window
                data.count++;
            }

            // Write back state
            await rateStore.setJSON(ip, data);

            if (data.count > LIMIT) {
                return new Response("Too many requests. Please try again later.", { status: 429 });
            }
        } catch (err) {
            console.error("Rate limit check failed", err);
            // Proceed on error to avoid blocking legitimate traffic due to infrastructure issues
        }
    }

    // 2. URL Resolution Logic
    // URL structure: domain.com/s/CODE
    // We rewrite /s/* to this function, so we parse the code from the path.
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const code = pathParts[pathParts.length - 1];

    if (!code) return new Response("Invalid code", { status: 400 });

    try {
        const store = getStore("short-urls");
        // Explicitly request text to ensure return type is string
        const fullUrl = await store.get(code, { type: 'text' });

        if (fullUrl) {
            return Response.redirect(fullUrl, 302);
        } else {
            return new Response("Link not found or expired.", { status: 404 });
        }
    } catch (e) {
        return new Response("Server error", { status: 500 });
    }
};
