
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
        const category = event.categories.find((c: any) => c.id === categoryId);
        if (category && category.limit > 0) {
            const currentCount = event.dishes.filter((d: any) => d.categoryId === categoryId).length;
            if (currentCount >= category.limit) {
                return new Response(JSON.stringify({ error: 'Category is full' }), { status: 400 });
            }
        }

        const newDish = {
            id: crypto.randomUUID(),
            categoryId,
            guestName: dish.name,
            dishName: dish.dish,
            dietary: dish.dietary || [],
            timestamp: Date.now()
        };

        event.dishes.push(newDish);
        await store.setJSON(publicId, event);

        return new Response(JSON.stringify(newDish), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to add dish' }), { status: 500 });
    }
};
