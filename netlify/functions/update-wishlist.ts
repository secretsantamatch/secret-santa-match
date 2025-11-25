
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // Handle Preflight
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

        // Connect to store
        const store = getStore("wishlists");
        
        // 1. Get existing data (or default to empty object if new)
        // getJSON returns the object directly, or null if not found.
        const currentData: Record<string, any> = (await store.get(exchangeId, { type: 'json' })) || {};
        
        // 2. Update the specific participant's data
        currentData[participantId] = wishlist;
        
        // 3. Save back to Blob storage
        // setJSON automatically stringifies the object
        await store.setJSON(exchangeId, currentData);
        
        console.log(`[update-wishlist] Saved data for ${participantId} in ${exchangeId}`);

        return new Response(JSON.stringify({ 
            success: true, 
            data: wishlist 
        }), { 
            status: 200, 
            headers 
        });

    } catch (error: any) {
        console.error("[update-wishlist] Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
            status: 500,
            headers
        });
    }
};
