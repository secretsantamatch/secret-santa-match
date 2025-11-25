
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
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
        const { exchangeId, participantId, wishlist } = body;

        if (!exchangeId || !participantId || !wishlist) {
             return new Response(JSON.stringify({ error: "Missing required fields" }), { 
                 status: 400,
                 headers: { 
                     "Content-Type": "application/json",
                     "Access-Control-Allow-Origin": "*"
                 } 
             });
        }

        // 1. Get the Store
        const store = getStore("wishlists");
        
        // 2. Retrieve existing data. 
        // We use { type: 'json' } to automatically parse the blob content.
        // If the key doesn't exist, store.get returns null, so we default to {}.
        const existingData = await store.get(exchangeId, { type: 'json' });
        const data: Record<string, any> = existingData || {};
        
        // 3. Update the specific participant's wishlist
        data[participantId] = wishlist;
        
        // 4. Save the updated object back to the blob store using setJSON
        await store.setJSON(exchangeId, data);

        return new Response(JSON.stringify({ success: true, message: "Wishlist saved successfully" }), { 
            status: 200, 
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            } 
        });

    } catch (error: any) {
        console.error("Update Wishlist Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            } 
        });
    }
};
