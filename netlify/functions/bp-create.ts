
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
            parentNames: data.parentNames || '',
            dueDate: data.dueDate,
            theme: data.theme || 'sage',
            registryLink: data.registryLink || '',
            diaperFundLink: data.diaperFundLink || '',
            // Default fields if not provided (backward compatibility)
            includeFields: data.includeFields || {
                time: true,
                weight: true,
                length: true,
                hair: true,
                eye: true,
                gender: true
            },
            customQuestions: Array.isArray(data.customQuestions) ? data.customQuestions.filter((q: string) => q.trim() !== '').slice(0, 3) : [],
            guesses: [],
            status: 'active', // 'active' or 'completed'
        };

        // Use strong consistency to ensure immediate availability
        const store = getStore({ name: 'baby-pools', consistency: 'strong' });
        await store.setJSON(poolId, newPool);

        // RETURN FULL POOL OBJECT FOR IMMEDIATE CLIENT-SIDE HYDRATION
        return new Response(JSON.stringify({ poolId, adminKey, pool: newPool }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to create pool' }), { status: 500 });
    }
};
