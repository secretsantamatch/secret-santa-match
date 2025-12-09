
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const data = await req.json();
        
        // Validation
        if (!data.title || !data.hostName) return new Response('Missing fields', { status: 400 });

        const adminKey = crypto.randomUUID(); // Private key for host
        const publicId = crypto.randomUUID(); // Public ID for guests

        const newEvent = {
            id: adminKey, 
            publicId,
            createdAt: new Date().toISOString(),
            title: data.title,
            hostName: data.hostName,
            date: data.date,
            time: data.time || '',
            location: data.location || '',
            description: data.description || '',
            theme: data.theme || 'classic',
            dietaryNotes: data.dietaryNotes || '',
            categories: data.categories || [],
            dishes: [],
            allowGuestEditing: data.allowGuestEditing !== false, // default true
            editLockDays: typeof data.editLockDays === 'number' ? data.editLockDays : 1,
            hideNamesFromGuests: !!data.hideNamesFromGuests // default false
        };

        const store = getStore({ name: 'potluck-events', consistency: 'strong' });
        
        // Secure structure
        const secureEvent = { ...newEvent, adminKey }; 
        await store.setJSON(publicId, secureEvent);

        return new Response(JSON.stringify({ publicId, adminKey }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to create event' }), { status: 500 });
    }
};
