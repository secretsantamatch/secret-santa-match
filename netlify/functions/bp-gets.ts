
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const url = new URL(req.url);
    const poolId = url.searchParams.get('poolId');
    const adminKey = url.searchParams.get('adminKey');

    if (!poolId) return new Response('Missing poolId', { status: 400 });

    try {
        const store = getStore('baby-pools');
        const pool: any = await store.get(poolId, { type: 'json' });

        if (!pool) return new Response('Pool not found', { status: 404 });

        // If it's an admin request, return everything
        if (adminKey && pool.adminKey === adminKey) {
            return new Response(JSON.stringify(pool), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Public view: Strip sensitive admin data
        const { adminKey: _, ...publicData } = pool;
        return new Response(JSON.stringify(publicData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch pool' }), { status: 500 });
    }
};
