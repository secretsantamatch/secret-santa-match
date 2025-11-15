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
            const payload = {
                exchangeId,
                participantId: participant.id,
                wishlistData: { ...wishlist, budget: participant.budget || '' },
            };
            
            const response = await fetch('/.netlify/functions/update-wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorMsg = 'Failed to save wishlist. Please try again.';
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMsg = `Save failed: ${errorData.error}`;
                    }
                } catch (e) {
                    // Response was not JSON, use the default error message.
                }
                throw new Error(errorMsg);
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
                <header className="p-6 flex justify-between items-center border-b rounded-t-2xl" style={{ backgroundColor: '#15803d' }}>
                    <div>
                        <h2 className="text-2xl font-bold text-white font-serif">Edit My Wishlist</h2>
                        <p className="text-sm text-white/80 mt-1">Your Santa will see these updates automatically!</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/70 hover:bg-white/20 rounded-full"><X size={24} /></button>
                </header>
                
                <main className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <p className="text-center text-slate-600 text-base -mt-2">
                        Help your Secret Santa find you the perfect gift! Fill out the details below.
                    </p>

                    {error && <div className="text-red-800 bg-red-100 p-4 rounded-lg text-sm border border-red-200">{error}</div>}
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My Interests & Hobbies</label>
                        <input
                            type="text"
                            placeholder="e.g., coffee, gardening, sci-fi books"
                            value={wishlist.interests}
                            onChange={(e) => handleChange('interests', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                        />
                        <p className="text-xs text-slate-500 mt-1">Separate items with a comma.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My Likes</label>
                        <input
                            type="text"
                            placeholder="e.g., dark roast coffee, fuzzy socks"
                            value={wishlist.likes}
                            onChange={(e) => handleChange('likes', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                        />
                         <p className="text-xs text-slate-500 mt-1">Separate items with a comma.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My Dislikes & No-Go's</label>
                        <textarea
                            placeholder="e.g., dislikes horror movies, allergic to wool..."
                            value={wishlist.dislikes}
                            onChange={(e) => handleChange('dislikes', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md"
                            rows={2}
                        />
                         <p className="text-xs text-slate-500 mt-1">Separate items with a comma.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My 5 Wishlist Links</label>
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
                         <div className="text-xs text-slate-500 mt-1">
                            <span>Paste one full link (starting with https://) per box.</span>
                        </div>
                    </div>
                </main>

                <footer className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-6 rounded-lg">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
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