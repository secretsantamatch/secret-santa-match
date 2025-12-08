
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        // Here `id` is the publicId of the event (since that's the key in the store)
        // `adminKey` is passed to verify ownership.
        const { id, dishId, adminKey } = await req.json();
        
        const store = getStore({ name: 'potluck-events', consistency: 'strong' });
        const event: any = await store.get(id, { type: 'json' }); // id here is publicId

        if (!event) return new Response('Event not found', { status: 404 });

        // Security Check
        if (event.adminKey !== adminKey) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
        }

        event.dishes = event.dishes.filter((d: any) => d.id !== dishId);
        await store.setJSON(id, event);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to remove dish' }), { status: 500 });
    }
};
