
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

        // Strip sensitive data (adminKey and editKeys) before returning to public
        const { adminKey, ...publicData } = event;
        
        // Remove editKey from all dishes to prevent unauthorized deletions
        if (publicData.dishes) {
            publicData.dishes = publicData.dishes.map((d: any) => {
                const { editKey, ...safeDish } = d;
                return safeDish;
            });
        }

        return new Response(JSON.stringify(publicData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch event' }), { status: 500 });
    }
};
