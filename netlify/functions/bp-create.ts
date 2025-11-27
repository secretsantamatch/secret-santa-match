
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const data = await req.json();
        const poolId = crypto.randomUUID();
        const adminKey = crypto.randomUUID();

        const newPool = {
            poolId,
            adminKey,
            createdAt: new Date().toISOString(),
            babyName: data.babyName,
            dueDate: data.dueDate,
            theme: data.theme || 'sage',
            registryLink: data.registryLink || '',
            guesses: [],
            status: 'active', // 'active' or 'completed'
        };

        const store = getStore('baby-pools');
        await store.setJSON(poolId, newPool);

        return new Response(JSON.stringify({ poolId, adminKey }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to create pool' }), { status: 500 });
    }
};
