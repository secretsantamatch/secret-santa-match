import React, { useState } from 'react';
import type { Participant } from '../types';

interface ParticipantManagerProps {
    participants: Participant[];
    setParticipants: (participants: Participant[]) => void;
    onBulkAddClick: () => void;
    onClearClick: () => void;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({ participants, setParticipants, onBulkAddClick, onClearClick }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const handleParticipantChange = (id: string, field: keyof Omit<Participant, 'id'>, value: string) => {
        setParticipants(
            participants.map(p => (p.id === id ? { ...p, [field]: value } : p))
        );
    };
    
    const addParticipant = () => {
        const newParticipant = { id: crypto.randomUUID(), name: '', notes: '', budget: '' };
        setParticipants([...participants, newParticipant]);
        // Expand details for new participant for better UX
        toggleDetails(newParticipant.id);
    };

    const removeParticipant = (id: string) => {
        if (participants.length > 1) {
            setParticipants(participants.filter(p => p.id !== id));
        }
    };

    const toggleDetails = (id: string) => {
        setExpanded(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-4">
            {participants.map((participant, index) => (
                <div key={participant.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 transition-all">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="text-slate-500 font-semibold mr-1 w-6 text-center">{index + 1}.</span>
                        <input
                            type="text"
                            placeholder={`Participant #${index + 1}`}
                            value={participant.name}
                            onChange={(e) => handleParticipantChange(participant.id, 'name', e.target.value)}
                            className="flex-1 min-w-[120px] p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                        <button onClick={() => toggleDetails(participant.id)} className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold p-2 whitespace-nowrap ml-auto">
                            {expanded.has(participant.id) ? 'Hide Details' : 'Details'}
                        </button>
                        {participants.length > 1 && (
                             <button onClick={() => removeParticipant(participant.id)} className="text-red-500 hover:text-red-700 p-2" aria-label={`Remove ${participant.name || `participant ${index + 1}`}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        )}
                    </div>
                    {expanded.has(participant.id) && (
                        <div className="mt-4 pl-9 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Gift Ideas / Wishlist</label>
                                <textarea
                                    placeholder="e.g., Loves coffee, anything for the garden..."
                                    value={participant.notes}
                                    onChange={(e) => handleParticipantChange(participant.id, 'notes', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                    rows={2}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Spending Budget ($)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 25"
                                    value={participant.budget}
                                    onChange={(e) => handleParticipantChange(participant.id, 'budget', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <div className="flex flex-wrap gap-4 pt-2">
                <button onClick={addParticipant} className="py-2 px-4 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-semibold rounded-lg transition-colors shadow">Add Person</button>
                <button onClick={onBulkAddClick} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors">Bulk Add from List</button>
                <button onClick={onClearClick} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors">Clear</button>
            </div>
        </div>
    );
};

export default ParticipantManager;
