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
        links: ['', '', '', '', ''],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true); // NEW: Loading state for initial fetch
    const [error, setError] = useState<string | null>(null);

    // Helper to pad links array to 5 slots
    const padLinks = (links: string[] = []) => {
        const padded = [...links];
        while (padded.length < 5) padded.push('');
        return padded.slice(0, 5);
    };

    // NEW: Fetch saved wishlist data from blob on modal open
    useEffect(() => {
        const fetchSavedWishlist = async () => {
            setIsFetching(true);
            try {
                const response = await fetch(
                    `/.netlify/functions/get-wishlist?exchangeId=${encodeURIComponent(exchangeId)}`
                );
                
                if (response.ok) {
                    const allWishlists = await response.json();
                    const savedData = allWishlists[participant.id];
                    
                    if (savedData) {
                        // Use saved blob data (participant's own edits)
                        setWishlist({
                            interests: savedData.interests || '',
                            likes: savedData.likes || '',
                            dislikes: savedData.dislikes || '',
                            links: padLinks(savedData.links),
                        });
                    } else {
                        // No saved edits yet — fall back to original participant data
                        setWishlist({
                            interests: participant.interests || '',
                            likes: participant.likes || '',
                            dislikes: participant.dislikes || '',
                            links: padLinks(participant.links),
                        });
                    }
                } else {
                    // API error — fall back to participant prop
                    console.warn('[WishlistModal] Could not fetch saved data, using defaults');
                    setWishlist({
                        interests: participant.interests || '',
                        likes: participant.likes || '',
                        dislikes: participant.dislikes || '',
                        links: padLinks(participant.links),
                    });
                }
            } catch (err) {
                console.error('[WishlistModal] Fetch error:', err);
                // Network error — fall back to participant prop
                setWishlist({
                    interests: participant.interests || '',
                    likes: participant.likes || '',
                    dislikes: participant.dislikes || '',
                    links: padLinks(participant.links),
                });
            } finally {
                setIsFetching(false);
            }
        };

        if (participant && exchangeId) {
            fetchSavedWishlist();
        }
    }, [participant, exchangeId]);

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

            const response = await fetch('/.netlify/functions/update-wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to save. Please try again.');
            }
            
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
                    {/* Show loading spinner while fetching saved data */}
                    {isFetching ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-green-600" />
                            <span className="ml-3 text-slate-600">Loading your wishlist...</span>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="p-3 bg-red-100 text-red-800 rounded-lg border border-red-200 text-sm font-bold">
                                    {error}
                                </div>
                            )}

                            <p className="text-center text-slate-600 text-sm">
                                Help your Secret Santa find you the perfect gift! Fill out the details below.
                            </p>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">My Interests & Hobbies</label>
                                <input
                                    type="text"
                                    placeholder="e.g., coffee, gardening, sci-fi books"
                                    value={wishlist.interests}
                                    onChange={(e) => handleChange('interests', e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
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
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                                />
                                <p className="text-xs text-slate-500 mt-1">Separate items with a comma.</p>
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
                                <p className="text-xs text-slate-500 mt-1">Separate items with a comma.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">My 5 Wishlist Links</label>
                                <div className="space-y-2">
                                    {wishlist.links.map((link, i) => (
                                        <input
                                            key={i}
                                            type="url"
                                            placeholder="e.g., https://www.amazon.com/wishlist/..."
                                            value={link}
                                            onChange={(e) => handleLinkChange(i, e.target.value)}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition text-sm"
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Paste one full link (starting with https://) per box.</p>
                            </div>
                        </>
                    )}
                </main>

                <footer className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-6 rounded-lg">Cancel</button>
                    <button 
                        onClick={handleSave}
                        disabled={isLoading || isFetching}
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