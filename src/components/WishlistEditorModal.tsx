
import React, { useState, useEffect } from 'react';
import type { Participant } from '../types';
import { trackEvent } from '../services/analyticsService';
import { Save, X, Loader2 } from 'lucide-react';

interface WishlistEditorModalProps {
  participant: Participant;
  exchangeId: string;
  onClose: () => void;
  onSaveSuccess: (newWishlist: any) => void; 
}

const WishlistEditorModal: React.FC<WishlistEditorModalProps> = ({ participant, exchangeId, onClose, onSaveSuccess }) => {
    // Core State
    const [wishlist, setWishlist] = useState({
        interests: '',
        likes: '',
        dislikes: '',
        links: ['', '', '', '', ''], // Fixed 5 empty slots
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize on load
    useEffect(() => {
        if (participant) {
            // Pad the links array to ensure we always have 5 slots
            const incomingLinks = participant.links || [];
            const paddedLinks = [...incomingLinks];
            while (paddedLinks.length < 5) {
                paddedLinks.push('');
            }

            setWishlist({
                interests: participant.interests || '',
                likes: participant.likes || '',
                dislikes: participant.dislikes || '',
                links: paddedLinks.slice(0, 5), // Ensure exactly 5
            });
        }
    }, [participant]);

    const handleChange = (field: keyof Omit<typeof wishlist, 'links'>, value: string) => {
        setWishlist(prev => ({ ...prev, [field]: value }));
    };

    const handleLinkChange = (index: number, value: string) => {
        setWishlist(prev => {
            const newLinks = [...prev.links];
            newLinks[index] = value;
            return { ...prev, links: newLinks };
        });
    };

    const handleSave = async () => {
        trackEvent('wishlist_save_attempt');
        setIsLoading(true);
        setError(null);
        
        try {
            // Prepare clean data
            const cleanLinks = wishlist.links.filter(link => link && link.trim() !== '');
            
            const finalWishlistData = {
                interests: wishlist.interests,
                likes: wishlist.likes,
                dislikes: wishlist.dislikes,
                links: cleanLinks
            };

            const payload = {
                exchangeId: exchangeId,
                participantId: participant.id,
                wishlist: finalWishlistData
            };

            // Send to server
            const response = await fetch('/.netlify/functions/update-wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to save. Please try again.');
            }
            
            // If successful, update UI immediately (Optimistic Update)
            // We do NOT wait to read it back from the server, we trust the data we just sent.
            trackEvent('wishlist_save_success');
            onSaveSuccess(finalWishlistData); 
            onClose(); 

        } catch (err) {
            console.error("Save Error:", err);
            const message = err instanceof Error ? err.message : 'Connection failed. Please check your internet.';
            setError(message);
            trackEvent('wishlist_save_fail', { error: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-6 flex justify-between items-center border-b rounded-t-2xl" style={{ backgroundColor: '#15803d' }}>
                    <div>
                        <h2 className="text-2xl font-bold text-white font-serif">Edit My Wishlist</h2>
                        <p className="text-sm text-white/80 mt-1">Your Santa will see these updates automatically!</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/70 hover:bg-white/20 rounded-full"><X size={24} /></button>
                </header>
                
                <main className="p-6 space-y-6 overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-800 rounded-lg border border-red-200 text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My Interests & Hobbies</label>
                        <input
                            type="text"
                            placeholder="e.g., coffee, gardening, sci-fi books"
                            value={wishlist.interests}
                            onChange={(e) => handleChange('interests', e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My Likes</label>
                        <input
                            type="text"
                            placeholder="e.g., dark roast coffee, fuzzy socks"
                            value={wishlist.likes}
                            onChange={(e) => handleChange('likes', e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My Dislikes & No-Go's</label>
                        <textarea
                            placeholder="e.g., dislikes horror movies, allergic to wool..."
                            value={wishlist.dislikes}
                            onChange={(e) => handleChange('dislikes', e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My 5 Wishlist Links</label>
                        <div className="space-y-2">
                            {wishlist.links.map((link, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    placeholder={`Link #${i + 1} (e.g. Amazon)`}
                                    value={link}
                                    onChange={(e) => handleLinkChange(i, e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition text-sm"
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
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default WishlistEditorModal;
