
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { publicId, adminKey, updates } = await req.json();
        
        const store = getStore({ name: 'potluck-events', consistency: 'strong' });
        const event: any = await store.get(publicId, { type: 'json' });

        if (!event) return new Response('Event not found', { status: 404 });

        // Security Check
        if (event.adminKey !== adminKey) {
            return new Response('Unauthorized', { status: 403 });
        }

        // Apply updates (Only allow specific fields)
        const allowedFields = ['title', 'date', 'time', 'location', 'description', 'dietaryNotes', 'theme', 'allowGuestEditing', 'editLockDays', 'hideNamesFromGuests', 'votingEnabled'];
        
        let hasChanges = false;
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                event[field] = updates[field];
                hasChanges = true;
            }
        });

        if (hasChanges) {
            await store.setJSON(publicId, event);
        }

        // Return sanitized event
        const { adminKey: _, ...publicData } = event;

        return new Response(JSON.stringify(publicData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to update event' }), { status: 500 });
    }
};