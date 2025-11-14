import React, { useState } from 'react';
import type { Participant } from '../types';
import { Lightbulb } from 'lucide-react';

interface ParticipantManagerProps {
    participants: Participant[];
    setParticipants: (participants: Participant[]) => void;
    onBulkAddClick: () => void;
    onClearClick: () => void;
    setError: (error: string | null) => void;
}

const WISHLIST_CHAR_LIMIT = 100;

const CharacterCounter: React.FC<{ value: string, fieldName: string }> = ({ value, fieldName }) => {
    const length = value.length;
    const isOverLimit = length > WISHLIST_CHAR_LIMIT;
    const isLinks = fieldName === 'links';

    const linksHelperText = "e.g., Amazon wishlist, Pinterest board.";
    const defaultHelperText = "Separate with commas.";

    return (
        <div className="text-xs text-slate-400 mt-1">
            <div className="flex justify-between">
                <span>{isLinks ? linksHelperText : defaultHelperText}</span>
                <span className={isOverLimit ? 'text-red-500 font-bold' : ''}>
                    {length} / {WISHLIST_CHAR_LIMIT}
                </span>
            </div>
            {isOverLimit && (
                <p className="text-red-500 font-semibold">
                    Note: Long text may be cut off on printable cards.
                </p>
            )}
        </div>
    );
};


const ParticipantManager: React.FC<ParticipantManagerProps> = ({ participants, setParticipants, onBulkAddClick, onClearClick, setError }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const handleParticipantChange = (id: string, field: keyof Omit<Participant, 'id'>, value: string) => {
        if (field === 'name') {
            setError(null); // Clear previous errors
            const trimmedValue = value.trim().toLowerCase();
            if (trimmedValue) { // Only check for duplicates if the name is not empty
                const isDuplicate = participants.some(p => p.id !== id && p.name.trim().toLowerCase() === trimmedValue);
                if (isDuplicate) {
                    setError('Participant names must be unique.');
                    // To avoid confusion, we'll still update the input visually but the error will prevent generation.
                }
            }
        }
        
        const participantIndex = participants.findIndex(p => p.id === id);
        const isLastParticipant = participantIndex === participants.length - 1;
        const isNameField = field === 'name';
        const wasEmpty = participants[participantIndex]?.name.trim() === '';
        const isNowNotEmpty = value.trim() !== '';

        const updatedParticipants = participants.map(p => 
            p.id === id ? { ...p, [field]: value } : p
        );

        if (isLastParticipant && isNameField && wasEmpty && isNowNotEmpty) {
            updatedParticipants.push({ id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' });
        }
        
        setParticipants(updatedParticipants);
    };

    const handleLinkChange = (id: string, index: number, value: string) => {
        const updatedParticipants = participants.map(p => {
            if (p.id === id) {
                const links = p.links.split('\n');
                while (links.length < 5) links.push('');
                links[index] = value;
                const newLinksString = links.slice(0, 5).join('\n');
                return { ...p, links: newLinksString };
            }
            return p;
        });
        setParticipants(updatedParticipants);
    };
    
    const addParticipant = () => {
        const newParticipant = { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' };
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
                            {expanded.has(participant.id) ? 'Hide Details' : 'Add Details'}
                        </button>
                        {participants.length > 1 && (
                             <button onClick={() => removeParticipant(participant.id)} className="text-red-500 hover:text-red-700 p-2" aria-label={`Remove ${participant.name || `participant ${index + 1}`}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        )}
                    </div>
                    {expanded.has(participant.id) && (
                        <div className="mt-4 pl-9 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Interests & Hobbies</label>
                                <input
                                    type="text"
                                    placeholder="e.g., coffee, gardening, sci-fi books"
                                    value={participant.interests}
                                    onChange={(e) => handleParticipantChange(participant.id, 'interests', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                />
                                 <CharacterCounter value={participant.interests} fieldName="interests" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Likes</label>
                                <input
                                    type="text"
                                    placeholder="e.g., dark roast coffee, fuzzy socks"
                                    value={participant.likes}
                                    onChange={(e) => handleParticipantChange(participant.id, 'likes', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                />
                                <CharacterCounter value={participant.likes} fieldName="likes" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Dislikes & No-Go's</label>
                                <textarea
                                    placeholder="e.g., dislikes horror movies, allergic to wool..."
                                    value={participant.dislikes}
                                    onChange={(e) => handleParticipantChange(participant.id, 'dislikes', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                    rows={2}
                                />
                                <CharacterCounter value={participant.dislikes} fieldName="dislikes" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Top 5 Wishlist Links (Optional)</label>
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            placeholder={`e.g., https://www.amazon.com/wishlist/...`}
                                            value={(participant.links.split('\n')[i] || '')}
                                            onChange={(e) => handleLinkChange(participant.id, i, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                        />
                                    ))}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    <span>Paste one full link (starting with https://) per box.</span>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Spending Budget</label>
                                <input
                                    type="text"
                                    placeholder="e.g., $25, £20, or up to 30"
                                    value={participant.budget}
                                    onChange={(e) => handleParticipantChange(participant.id, 'budget', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <div className="mt-6 p-4 bg-sky-50 text-sky-900 rounded-lg border border-sky-200 flex items-start gap-4">
                <Lightbulb className="w-8 h-8 flex-shrink-0 text-sky-500 mt-1" />
                <div>
                    <h4 className="font-bold">Pro Tip: Let them update their own wishlists!</h4>
                    <p className="text-sm mt-1">After you generate matches, each person can use their private link to update their gift ideas and wishlists at any time. No more chasing people for updates!</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-6">
                <button onClick={addParticipant} className="py-2 px-4 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-semibold rounded-lg transition-colors shadow">Add Person</button>
                <button onClick={onBulkAddClick} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors">Bulk Add from List</button>
                <button onClick={onClearClick} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors">Clear</button>
            </div>
        </div>
    );
};

export default ParticipantManager;