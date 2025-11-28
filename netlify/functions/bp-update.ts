
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { poolId, adminKey, action, payload } = await req.json();
        if (!poolId || !adminKey) return new Response('Missing credentials', { status: 400 });

        const store = getStore({ name: 'baby-pools', consistency: 'strong' });
        const pool: any = await store.get(poolId, { type: 'json' });

        if (!pool) return new Response('Pool not found', { status: 404 });
        if (pool.adminKey !== adminKey) return new Response('Unauthorized', { status: 403 });

        if (action === 'declare_birth') {
            pool.status = 'completed';
            pool.result = payload; // { date, time, weight, gender, actualName, photoLink }
        } else if (action === 'update_settings') {
            // Update basic info like registry link or baby name placeholder
            if (payload.babyName) pool.babyName = payload.babyName;
            if (payload.registryLink) pool.registryLink = payload.registryLink;
            if (payload.theme) pool.theme = payload.theme;
        }

        await store.setJSON(poolId, pool);

        return new Response(JSON.stringify({ success: true, pool }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to update pool' }), { status: 500 });
    }
};
