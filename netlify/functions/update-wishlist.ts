
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    // Debug Log 1: Entry
    console.log(`[update-wishlist] Function invoked. Method: ${req.method}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }

    if (req.method !== 'POST') {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const body = await req.json();
        console.log("[update-wishlist] Body parsed:", JSON.stringify(body));

        const { exchangeId, participantId, wishlist } = body;

        if (!exchangeId || !participantId || !wishlist) {
             console.error("[update-wishlist] Missing fields:", { exchangeId, participantId, hasWishlist: !!wishlist });
             return new Response(JSON.stringify({ error: "Missing required fields" }), { 
                 status: 400,
                 headers: { 
                     "Content-Type": "application/json",
                     "Access-Control-Allow-Origin": "*"
                 } 
             });
        }

        // 1. Get the Store
        console.log(`[update-wishlist] Getting store 'wishlists' for exchangeId: ${exchangeId}`);
        const store = getStore("wishlists");
        
        // 2. Retrieve existing data. 
        console.log("[update-wishlist] Fetching existing data...");
        const existingData = await store.get(exchangeId, { type: 'json' });
        console.log(`[update-wishlist] Existing data found: ${!!existingData}`);

        const data: Record<string, any> = existingData || {};
        
        // 3. Update the specific participant's wishlist
        data[participantId] = wishlist;
        
        // 4. Save the updated object back to the blob store
        console.log("[update-wishlist] Writing updated data to Blob store...");
        await store.setJSON(exchangeId, data);
        console.log("[update-wishlist] Write successful.");

        return new Response(JSON.stringify({ success: true, message: "Wishlist saved successfully" }), { 
            status: 200, 
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            } 
        });

    } catch (error: any) {
        console.error("[update-wishlist] CRITICAL ERROR:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            } 
        });
    }
};
