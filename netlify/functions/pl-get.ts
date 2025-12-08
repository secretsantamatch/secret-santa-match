
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const url = new URL(req.url);
    const publicId = url.searchParams.get('id');
    
    if (!publicId) return new Response('Missing ID', { status: 400 });

    try {
        const store = getStore({ name: 'potluck-events', consistency: 'strong' });
        const event: any = await store.get(publicId, { type: 'json' });

        if (!event) return new Response('Event not found', { status: 404 });

        // Strip sensitive data (adminKey) before returning to public
        // Unless we implement an admin fetch, but usually the frontend 
        // just needs the read/write public capabilities for dishes.
        // Delete functionality is the only thing needing adminKey verification.
        
        const { adminKey, ...publicData } = event;

        return new Response(JSON.stringify(publicData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch event' }), { status: 500 });
    }
};
