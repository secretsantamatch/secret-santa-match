
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

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (req.method !== 'POST') {
        return new Response("Method Not Allowed", { status: 405, headers });
    }

    try {
        // 0. Environment Check
        // Netlify Blobs requires specific environment variables to be set automatically by Netlify.
        // If these are missing, the store will fail silently or throw an error.
        const hasBlobContext = !!process.env.NETLIFY_BLOBS_CONTEXT;
        console.log(`[update-wishlist] Blob Context Present: ${hasBlobContext}`);
        
        if (!hasBlobContext) {
             console.warn("[update-wishlist] WARNING: NETLIFY_BLOBS_CONTEXT is missing. Ensure the Netlify Blobs addon is enabled for this site.");
        }

        const body = await req.json();
        // console.log("[update-wishlist] Body parsed:", JSON.stringify(body)); // Commented out to reduce log noise if body is huge

        const { exchangeId, participantId, wishlist } = body;

        if (!exchangeId || !participantId || !wishlist) {
             console.error("[update-wishlist] Missing fields:", { exchangeId, participantId, hasWishlist: !!wishlist });
             return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers });
        }

        // 1. Get the Store
        console.log(`[update-wishlist] Getting store 'wishlists' for exchangeId: ${exchangeId}`);
        const store = getStore("wishlists");
        
        // 2. Retrieve existing data as RAW TEXT
        // We avoid store.get(key, {type: 'json'}) to prevent any internal parsing issues.
        console.log("[update-wishlist] Fetching existing data (raw)...");
        const rawData = await store.get(exchangeId, { type: 'text' });
        console.log(`[update-wishlist] Existing data found: ${!!rawData}`);

        let data: Record<string, any> = {};
        if (rawData) {
            try {
                data = JSON.parse(rawData);
            } catch (e) {
                console.error("[update-wishlist] Error parsing existing JSON, starting fresh:", e);
                data = {};
            }
        }
        
        // 3. Update the specific participant's wishlist
        data[participantId] = wishlist;
        
        // 4. Serialize manually
        const stringifiedData = JSON.stringify(data);

        // 5. Save the updated object back to the blob store as raw string
        console.log("[update-wishlist] Writing updated data to Blob store...");
        await store.set(exchangeId, stringifiedData);
        console.log("[update-wishlist] Write command sent.");

        // 6. Verification Read (Debugging)
        // We wait 250ms to allow for eventual consistency before verifying
        await new Promise(resolve => setTimeout(resolve, 250));

        console.log("[update-wishlist] VERIFICATION READ: Checking if data persisted...");
        const verifyRawData = await store.get(exchangeId, { type: 'text' });
        
        let isPersisted = false;
        if (verifyRawData) {
            const verifyData = JSON.parse(verifyRawData);
            if (verifyData[participantId] && JSON.stringify(verifyData[participantId]) === JSON.stringify(wishlist)) {
                isPersisted = true;
            } else {
                console.log("[update-wishlist] Mismatch details - Wanted:", JSON.stringify(wishlist));
                console.log("[update-wishlist] Mismatch details - Got:", JSON.stringify(verifyData[participantId]));
            }
        } else {
             console.log("[update-wishlist] Verification failed: Read back null.");
        }
        
        if (isPersisted) {
            console.log("[update-wishlist] VERIFICATION SUCCESS: Data matches exactly.");
        } else {
            console.error("[update-wishlist] VERIFICATION FAILED: Data mismatch or not found.");
        }

        return new Response(JSON.stringify({ success: true, message: "Wishlist saved successfully", verified: isPersisted }), { 
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