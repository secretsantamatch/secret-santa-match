import React, { useState } from 'react';
import type { Participant } from '../types';

interface ParticipantManagerProps {
    participants: Participant[];
    setParticipants: (participants: Participant[]) => void;
    onBulkAddClick: () => void;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({ participants, setParticipants, onBulkAddClick }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const handleParticipantChange = (id: string, field: keyof Omit<Participant, 'id'>, value: string) => {
        const newParticipants = participants.map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        });
        setParticipants(newParticipants);
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

    const addParticipant = () => {
        setParticipants([...participants, { id: crypto.randomUUID(), name: '', notes: '', budget: '' }]);
    };

    const removeParticipant = (id: string) => {
        setParticipants(participants.filter(p => p.id !== id));
    };

    return (
        <div className="space-y-4">
            {participants.map((p, index) => (
                <div key={p.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex gap-2 items-center">
                        <span className="text-gray-500 font-semibold w-6 text-center">{index + 1}.</span>
                        <input 
                            type="text" 
                            placeholder="Participant's Name" 
                            value={p.name} 
                            onChange={e => handleParticipantChange(p.id, 'name', e.target.value)}
                            className="p-2 border border-slate-300 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            aria-label={`Participant ${index + 1} name`}
                        />
                        <button 
                            onClick={() => toggleDetails(p.id)} 
                            className="py-2 px-3 text-slate-600 hover:bg-slate-200 rounded-md transition text-sm font-semibold flex-shrink-0"
                            aria-expanded={expanded.has(p.id)}
                        >
                            Details
                        </button>
                        <button onClick={() => removeParticipant(p.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-md transition text-xl font-bold flex-shrink-0" aria-label={`Remove ${p.name || `participant ${index + 1}`}`}>&times;</button>
                    </div>
                    {expanded.has(p.id) && (
                        <div className="mt-4 pt-4 pl-8 border-t border-slate-200 space-y-3 animate-fade-in">
                            <div>
                                <label htmlFor={`notes-${p.id}`} className="block text-sm font-medium text-slate-600 mb-1">Gift Ideas / Notes (Optional)</label>
                                <textarea
                                    id={`notes-${p.id}`}
                                    placeholder="e.g., Loves coffee, books, board games..."
                                    value={p.notes}
                                    onChange={e => handleParticipantChange(p.id, 'notes', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label htmlFor={`budget-${p.id}`} className="block text-sm font-medium text-slate-600 mb-1">Spending Budget (Optional)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">$</span>
                                    <input 
                                        id={`budget-${p.id}`}
                                        type="number"
                                        placeholder="25"
                                        value={p.budget}
                                        onChange={e => handleParticipantChange(p.id, 'budget', e.target.value)}
                                        className="w-full max-w-xs p-2 pl-7 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <div className="flex gap-4 pt-2">
                <button onClick={addParticipant} className="py-2 px-4 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-semibold rounded-lg transition-colors shadow">Add Person</button>
                <button onClick={onBulkAddClick} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors">Bulk Add from List</button>
            </div>
        </div>
    );
};

export default ParticipantManager;
