
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const data = await req.json();
        
        if (!data.title) return new Response('Missing title', { status: 400 });

        const adminKey = crypto.randomUUID();
        const publicId = crypto.randomUUID();

        const newBoard = {
            id: publicId,
            adminKey,
            createdAt: new Date().toISOString(),
            title: data.title,
            mode: data.mode || 'open',
            theme: data.theme || 'corporate',
            scheduledReveal: data.scheduledReveal || null, // Allow scheduled unlock
            cards: []
        };

        const store = getStore({ name: 'kudos-boards', consistency: 'strong' });
        await store.setJSON(publicId, newBoard);

        return new Response(JSON.stringify({ publicId, adminKey }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to create board' }), { status: 500 });
    }
};