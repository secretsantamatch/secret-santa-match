
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const url = new URL(req.url);
    const publicId = url.searchParams.get('id');
    
    if (!publicId) return new Response('Missing ID', { status: 400 });

    try {
        const store = getStore({ name: 'kudos-boards', consistency: 'strong' });
        const board: any = await store.get(publicId, { type: 'json' });

        if (!board) return new Response('Board not found', { status: 404 });

        // Strip adminKey for public view
        const { adminKey, ...publicData } = board;

        return new Response(JSON.stringify(publicData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch board' }), { status: 500 });
    }
};
