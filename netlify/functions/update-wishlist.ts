import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
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

        console.log('[update-wishlist] Received request:');
        console.log('[update-wishlist] - exchangeId:', exchangeId);
        console.log('[update-wishlist] - participantId:', participantId);
        console.log('[update-wishlist] - wishlist:', JSON.stringify(wishlist));

        if (!exchangeId || !participantId || !wishlist) {
            console.log('[update-wishlist] ERROR: Missing required fields');
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers });
        }

        const store = getStore("wishlists");
        
        // 1. Get existing data
        const currentData: Record<string, any> = (await store.get(exchangeId, { type: 'json' })) || {};
        console.log('[update-wishlist] Current blob data BEFORE update:', JSON.stringify(currentData));
        
        // 2. Update the specific participant's data
        currentData[participantId] = wishlist;
        console.log('[update-wishlist] Data AFTER adding participant:', JSON.stringify(currentData));
        
        // 3. Save back to Blob storage
        await store.setJSON(exchangeId, currentData);
        console.log('[update-wishlist] setJSON completed for exchangeId:', exchangeId);
        
        // 4. VERIFY: Read it back immediately to confirm it saved
        const verifyData = await store.get(exchangeId, { type: 'json' });
        console.log('[update-wishlist] VERIFICATION read-back:', JSON.stringify(verifyData));
        
        const verified = verifyData && verifyData[participantId];
        console.log('[update-wishlist] Participant data verified?', !!verified);

        return new Response(JSON.stringify({ 
            success: true, 
            verified: !!verified,
            data: wishlist 
        }), { 
            status: 200, 
            headers 
        });

    } catch (error: any) {
        console.error("[update-wishlist] Error:", error);
        console.error("[update-wishlist] Error stack:", error.stack);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
            status: 500,
            headers
        });
    }
};