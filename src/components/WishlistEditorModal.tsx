import React, { useState } from 'react';
import type { Participant } from '../types';
import { trackEvent } from '../services/analyticsService';
import { Save, X, Loader2 } from 'lucide-react';

interface WishlistEditorModalProps {
  participant: Participant;
  exchangeId: string;
  onClose: () => void;
  onSave: (updatedParticipant: Participant) => void;
}

const WishlistEditorModal: React.FC<WishlistEditorModalProps> = ({ participant, exchangeId, onClose, onSave }) => {
    const [wishlist, setWishlist] = useState({
        interests: participant.interests || '',
        likes: participant.likes || '',
        dislikes: participant.dislikes || '',
        links: participant.links || '',
        budget: participant.budget || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: keyof typeof wishlist, value: string) => {
        setWishlist(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        trackEvent('wishlist_save_attempt');
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
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to save wishlist.');
            }
            onSave({ ...participant, ...wishlist });
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
                    <h2 className="text-2xl font-bold text-slate-800 font-serif">Edit My Wishlist</h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                </header>
                
                <main className="p-6 space-y-4">
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
                        <label className="block text-sm font-medium text-slate-600 mb-1">Specific Links (Optional)</label>
                        <textarea
                            placeholder="Paste one link per line"
                            value={wishlist.links}
                            onChange={(e) => handleChange('links', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                            rows={2}
                        />
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
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </main>

                <footer className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-6 rounded-lg">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default WishlistEditorModal;