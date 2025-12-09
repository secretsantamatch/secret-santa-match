
import type { PotluckEvent, PotluckDish } from '../types';

export const createPotluck = async (data: any) => {
    const res = await fetch('/.netlify/functions/pl-create', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
};

export const getPotluck = async (id: string): Promise<PotluckEvent> => {
    const res = await fetch(`/.netlify/functions/pl-get?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch event');
    return res.json();
};

export const updatePotluckEvent = async (publicId: string, adminKey: string, updates: Partial<PotluckEvent>): Promise<PotluckEvent> => {
    const res = await fetch('/.netlify/functions/pl-update-event', {
        method: 'POST',
        body: JSON.stringify({ publicId, adminKey, updates })
    });
    if (!res.ok) throw new Error('Failed to update event');
    return res.json();
};

export const addDish = async (publicId: string, categoryId: string, dish: any): Promise<PotluckDish & { editKey?: string }> => {
    const res = await fetch('/.netlify/functions/pl-add-dish', {
        method: 'POST',
        body: JSON.stringify({ publicId, categoryId, dish })
    });
    if (!res.ok) throw new Error('Failed to add dish');
    return res.json();
};

export const removeDish = async (publicId: string, dishId: string, adminKey?: string | null, editKey?: string | null) => {
    const res = await fetch('/.netlify/functions/pl-remove-dish', {
        method: 'POST',
        body: JSON.stringify({ id: publicId, dishId, adminKey, editKey })
    });
    if (!res.ok) throw new Error('Failed to delete dish');
    return res.json();
};
