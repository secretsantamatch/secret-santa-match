
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { publicId, dishId } = await req.json();
        
        const store = getStore({ name: 'potluck-events', consistency: 'strong' });
        const event: any = await store.get(publicId, { type: 'json' });

        if (!event) return new Response('Event not found', { status: 404 });
        
        // Check if voting is actually enabled for this event
        if (!event.votingEnabled) {
             return new Response(JSON.stringify({ error: 'Voting is disabled for this event.' }), { status: 403 });
        }

        const dish = event.dishes.find((d: any) => d.id === dishId);
        if (!dish) return new Response('Dish not found', { status: 404 });

        // Increment votes
        dish.votes = (dish.votes || 0) + 1;

        await store.setJSON(publicId, event);

        return new Response(JSON.stringify({ success: true, votes: dish.votes }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to record vote' }), { status: 500 });
    }
};