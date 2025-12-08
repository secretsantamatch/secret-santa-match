
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const data = await req.json();
        
        // Validation
        if (!data.title || !data.hostName) return new Response('Missing fields', { status: 400 });

        const adminKey = crypto.randomUUID(); // Private key for host
        const publicId = crypto.randomUUID(); // Public ID for guests

        const newEvent = {
            id: adminKey, // Stored by adminKey for easy host retrieval, but we map publicId to it
            publicId,
            createdAt: new Date().toISOString(),
            title: data.title,
            hostName: data.hostName,
            date: data.date,
            description: data.description || '',
            categories: data.categories || [],
            dishes: []
        };

        const store = getStore({ name: 'potluck-events', consistency: 'strong' });
        
        // Save the event data under the PUBLIC ID for guest access
        await store.setJSON(publicId, newEvent);
        
        // Also save a mapping or just know that adminKey is secret.
        // Actually, to keep it simple: 
        // We store the main event object under `publicId`.
        // We add the `adminKey` INSIDE the object.
        // When guests fetch via `publicId`, we STRIP the `adminKey` before returning.
        // When host fetches, they need to provide `adminKey` to prove ownership? 
        // Simplified approach: The object contains `adminKey`. 
        // The API `pl-get` will remove `adminKey` if not requested with it.
        
        // Re-structure for security:
        const secureEvent = { ...newEvent, adminKey }; // Store adminKey inside
        await store.setJSON(publicId, secureEvent);

        return new Response(JSON.stringify({ publicId, adminKey }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to create event' }), { status: 500 });
    }
};
