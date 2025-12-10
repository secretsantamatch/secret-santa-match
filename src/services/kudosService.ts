
import type { KudosBoard, KudosCard } from '../types';

export const createKudosBoard = async (data: any) => {
    const res = await fetch('/.netlify/functions/kudos-create', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create board');
    return res.json();
};

export const getKudosBoard = async (id: string): Promise<KudosBoard> => {
    const res = await fetch(`/.netlify/functions/kudos-get?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch board');
    return res.json();
};

export const addKudosCard = async (publicId: string, card: Partial<KudosCard>): Promise<KudosCard> => {
    const res = await fetch('/.netlify/functions/kudos-add-card', {
        method: 'POST',
        body: JSON.stringify({ publicId, card })
    });
    if (!res.ok) throw new Error('Failed to add card');
    return res.json();
};

export const reactToCard = async (publicId: string, cardId: string, emoji: string) => {
    const res = await fetch('/.netlify/functions/kudos-react', {
        method: 'POST',
        body: JSON.stringify({ publicId, cardId, emoji })
    });
    if (!res.ok) throw new Error('Failed to react');
    return res.json();
};