
import type { BabyPool, BabyGuess } from '../types';

export const createPool = async (data: { 
    babyName: string; 
    parentNames: string; 
    dueDate: string; 
    theme: string; 
    registryLink: string; 
    diaperFundLink: string;
    knowGender?: boolean;
    customQuestions?: string[];
}) => {
    const res = await fetch('/.netlify/functions/bp-create', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create pool');
    return res.json();
};

export const getPool = async (poolId: string, adminKey?: string | null): Promise<BabyPool> => {
    let url = `/.netlify/functions/bp-get?poolId=${poolId}`;
    if (adminKey) url += `&adminKey=${adminKey}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load pool');
    return res.json();
};

export const submitGuess = async (poolId: string, guess: Omit<BabyGuess, 'id' | 'score' | 'submittedAt'>) => {
    const res = await fetch('/.netlify/functions/bp-guess', {
        method: 'POST',
        body: JSON.stringify({ poolId, guess })
    });
    if (!res.ok) throw new Error('Failed to submit guess');
    return res.json();
};

export const declareBirth = async (poolId: string, adminKey: string, resultData: any) => {
    const res = await fetch('/.netlify/functions/bp-update', {
        method: 'POST',
        body: JSON.stringify({ 
            poolId, 
            adminKey, 
            action: 'declare_birth', 
            payload: resultData 
        })
    });
    if (!res.ok) throw new Error('Failed to update pool');
    return res.json();
};
