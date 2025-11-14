import React, { useState } from 'react';
import type { Participant } from '../types';
import { trackEvent } from '../services/analyticsService';
import { Save, X, Loader2 } from 'lucide-react';

interface WishlistEditorModalProps {
  participant: Participant;
  exchangeId: string;
  onClose: () => void;
  onSave: (updatedParticipant: Participant) => void; // For optimistic UI update
}

const WishlistEditorModal: React.FC<WishlistEditorModalProps> = ({ participant, exchangeId, onClose, onSave }) => {
    const [wishlist, setWishlist] = useState({
        interests: participant.interests || '',
        likes: participant.likes || '',
        dislikes: participant.dislikes || '',
        links: Array.isArray(participant.links) ? participant.links : Array(5).fill(''),
        budget: participant.budget || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: keyof Omit<typeof wishlist, 'links'>, value: string) => {
        setWishlist(prev => ({ ...prev, [field]: value }));
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...wishlist.links];
        newLinks[index] = value;
        setWishlist(prev => ({ ...prev, links: newLinks }));
    };

    const handleSave = async () => {
        trackEvent('wishlist_save_attempt');
        setIsSaving(true);
        setError(null);
        
        try {
            const response = await fetch('/.netlify/functions/update-wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exchangeId,
                    participantId: participant.id,
                    wishlistData: wishlist,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save wishlist. Please try again.');
            }
            
            // Optimistically update the UI
            onSave({ ...participant, ...wishlist });
            trackEvent('wishlist_save_success');
            onClose();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            trackEvent('wishlist_save_fail', { error: err instanceof Error ? err.message : 'unknown' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-6 flex justify-between items-center border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 font-serif">Edit My Wishlist</h2>
                        <p className="text-sm text-slate-500 mt-1">Your Santa will see these updates automatically!</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                </header>
                
                <main className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Interests & Hobbies</label>
                        <input
                            type="text"
                            placeholder="e.g., coffee, gardening, sci-fi books"
                            value={wishlist.interests}
                            onChange={(e) => handleChange('interests', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Likes</label>
                        <input
                            type="text"
                            placeholder="e.g., dark roast coffee, fuzzy socks"
                            value={wishlist.likes}
                            onChange={(e) => handleChange('likes', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Dislikes & No-Go's</label>
                        <textarea
                            placeholder="e.g., dislikes horror movies, allergic to wool..."
                            value={wishlist.dislikes}
                            onChange={(e) => handleChange('dislikes', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Top 5 Wishlist Links (for affiliates)</label>
                        <div className="space-y-2">
                            {wishlist.links.map((link, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    placeholder={`e.g., https://www.amazon.com/wishlist/...`}
                                    value={link}
                                    onChange={(e) => handleLinkChange(i, e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md"
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
                            value={wishlist.budget}
                            onChange={(e) => handleChange('budget', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                        />
                    </div>
                </main>

                <footer className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-6 rounded-lg">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default WishlistEditorModal;