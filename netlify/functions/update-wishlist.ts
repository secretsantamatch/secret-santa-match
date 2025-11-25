import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

// Use a consistent store name across all deploy previews
// Production uses "wishlists", previews use "wishlists-preview"
const getStoreName = () => {
    const context = process.env.CONTEXT; // "production", "deploy-preview", "branch-deploy"
    console.log('[update-wishlist] Netlify context:', context);
    
    // Use same store for all previews so data persists across preview deploys
    if (context === 'deploy-preview' || context === 'branch-deploy') {
        return 'wishlists-preview';
    }
    return 'wishlists';
};

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

        const storeName = getStoreName();
        console.log('[update-wishlist] Using store:', storeName);

        // Get the store with STRONG consistency
        const store = getStore({
            name: storeName,
            consistency: "strong"
        });
        
        // 1. Get existing data
        let currentData: Record<string, any> = {};
        try {
            const existingData = await store.get(exchangeId, { type: 'json' });
            if (existingData) {
                currentData = existingData as Record<string, any>;
            }
        } catch (e) {
            console.log('[update-wishlist] No existing data found, starting fresh');
        }
        
        console.log('[update-wishlist] Current blob data BEFORE update:', JSON.stringify(currentData));
        
        // 2. Update the specific participant's data
        currentData[participantId] = wishlist;
        console.log('[update-wishlist] Data AFTER adding participant:', JSON.stringify(currentData));
        
        // 3. Save using set() with explicit JSON stringify
        const dataToSave = JSON.stringify(currentData);
        
        await store.set(exchangeId, dataToSave, {
            metadata: { 
                updatedAt: new Date().toISOString(),
                participantId: participantId
            }
        });
        
        console.log('[update-wishlist] set() completed for exchangeId:', exchangeId);
        
        // 4. VERIFY: Read it back to confirm
        let verifyData = null;
        try {
            verifyData = await store.get(exchangeId, { type: 'json' });
            console.log('[update-wishlist] VERIFICATION read-back:', JSON.stringify(verifyData));
        } catch (verifyError) {
            console.log('[update-wishlist] Verification read failed:', verifyError);
        }
        
        const verified = verifyData && (verifyData as Record<string, any>)[participantId];
        console.log('[update-wishlist] Participant data verified?', !!verified);

        return new Response(JSON.stringify({ 
            success: true, 
            verified: !!verified,
            storeName: storeName,
            data: wishlist 
        }), { 
            status: 200, 
            headers 
        });

    } catch (error: any) {
        console.error("[update-wishlist] Error:", error);
        console.error("[update-wishlist] Error message:", error.message);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
            status: 500,
            headers
        });
    }
};