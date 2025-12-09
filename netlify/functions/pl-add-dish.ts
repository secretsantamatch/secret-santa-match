
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { publicId, categoryId, dish } = await req.json();
        
        const store = getStore({ name: 'potluck-events', consistency: 'strong' });
        const event: any = await store.get(publicId, { type: 'json' });

        if (!event) return new Response('Event not found', { status: 404 });

        // Validate Limits
        const categoryIndex = event.categories.findIndex((c: any) => c.id === categoryId);
        const category = event.categories[categoryIndex];

        if (category && category.limit > 0) {
            const currentCount = event.dishes.filter((d: any) => d.categoryId === categoryId).length;
            if (currentCount >= category.limit) {
                return new Response(JSON.stringify({ error: 'Category is full' }), { status: 400 });
            }
        }

        const editKey = crypto.randomUUID(); // Secret key for the creator to edit/delete later

        const newDish = {
            id: crypto.randomUUID(),
            categoryId,
            guestName: dish.name,
            dishName: dish.dish,
            dietary: dish.dietary || [],
            timestamp: Date.now(),
            fulfillmentId: dish.fulfillmentId, // Store reference
            editKey: editKey // Stored securely in database
        };

        // If this dish fulfills a request, mark it in the category structure
        if (dish.fulfillmentId && category && category.requestedItems) {
            const reqIndex = category.requestedItems.findIndex((r: any) => r.id === dish.fulfillmentId);
            if (reqIndex !== -1) {
                // Mark request as taken by this dish ID
                category.requestedItems[reqIndex].takenByDishId = newDish.id;
                event.categories[categoryIndex] = category; // Update event object
            }
        }

        event.dishes.push(newDish);
        await store.setJSON(publicId, event);

        // Return the dish AND the secret key (only once)
        return new Response(JSON.stringify({ ...newDish, editKey }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to add dish' }), { status: 500 });
    }
};
