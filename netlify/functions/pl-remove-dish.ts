
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        // We now accept `editKey` in addition to `adminKey`
        const { id, dishId, adminKey, editKey } = await req.json();
        
        const store = getStore({ name: 'potluck-events', consistency: 'strong' });
        const event: any = await store.get(id, { type: 'json' }); // id here is publicId

        if (!event) return new Response('Event not found', { status: 404 });

        const dishToDelete = event.dishes.find((d: any) => d.id === dishId);

        if (!dishToDelete) {
             return new Response(JSON.stringify({ success: true }), { status: 200 }); // Already gone
        }

        // Security Check: Authorized if Admin OR if provided Edit Key matches dish's Edit Key
        const isAdmin = event.adminKey === adminKey;
        const isOwner = editKey && dishToDelete.editKey === editKey;

        if (!isAdmin && !isOwner) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
        }

        // Remove the dish
        event.dishes = event.dishes.filter((d: any) => d.id !== dishId);
        
        // Also clear any "takenBy" status in requested items
        if (event.categories) {
            event.categories = event.categories.map((cat: any) => {
                if (cat.requestedItems) {
                    cat.requestedItems = cat.requestedItems.map((req: any) => {
                        if (req.takenByDishId === dishId) {
                            return { ...req, takenByDishId: undefined };
                        }
                        return req;
                    });
                }
                return cat;
            });
        }

        await store.setJSON(id, event);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to remove dish' }), { status: 500 });
    }
};
