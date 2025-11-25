
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    console.log(`[update-wishlist] Function invoked. Method: ${req.method}`);

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (req.method !== 'POST') {
        return new Response("Method Not Allowed", { status: 405, headers });
    }

    try {
        const body = await req.json();
        const { exchangeId, participantId, wishlist } = body;

        if (!exchangeId || !participantId || !wishlist) {
             return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers });
        }

        // Use strong consistency to reduce race conditions
        const store = getStore({ name: "wishlists", consistency: "strong" });
        
        // 1. Fetch existing data
        // We use 'text' to handle raw JSON string manipulation safely
        const rawData = await store.get(exchangeId, { type: 'text' });
        
        let data: Record<string, any> = {};
        if (rawData) {
            try {
                data = JSON.parse(rawData);
            } catch (e) {
                console.warn("[update-wishlist] Failed to parse existing data, resetting:", e);
                data = {};
            }
        }
        
        // 2. Update the specific participant
        data[participantId] = wishlist;
        
        // 3. Serialize
        const stringifiedData = JSON.stringify(data);

        // 4. Save (Trust the operation if it resolves)
        await store.set(exchangeId, stringifiedData);
        
        console.log(`[update-wishlist] Successfully saved data for ${participantId} in exchange ${exchangeId}`);

        // Return the saved data back to the client so it can update immediately
        return new Response(JSON.stringify({ 
            success: true, 
            message: "Wishlist saved",
            data: wishlist 
        }), { 
            status: 200, 
            headers 
        });

    } catch (error: any) {
        console.error("[update-wishlist] CRITICAL ERROR:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
            status: 500,
            headers
        });
    }
};
