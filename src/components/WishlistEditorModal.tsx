
import React, { useState } from 'react';
import type { Participant } from '../types';
import { trackEvent } from '../services/analyticsService';
import { Save, X, Loader2, CheckCircle } from 'lucide-react';

interface WishlistEditorModalProps {
  participant: Participant;
  exchangeId: string;
  onClose: () => void;
  onSaveSuccess: (newWishlist: any) => void; 
}

const WishlistEditorModal: React.FC<WishlistEditorModalProps> = ({ participant, exchangeId, onClose, onSaveSuccess }) => {
    // Initialize state ONCE from props. Do not use useEffect to sync prop changes to state
    // because that would overwrite user input if the background poller fetches new data while they are typing.
    const [wishlist, setWishlist] = useState(() => {
        const incomingLinks = participant.links || [];
        const paddedLinks = [...incomingLinks];
        while (paddedLinks.length < 5) {
            paddedLinks.push('');
        }
        return {
            interests: participant.interests || '',
            likes: participant.likes || '',
            dislikes: participant.dislikes || '',
            links: paddedLinks.slice(0, 5), // Ensure exactly 5
        };
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            
            // If successful, show success state then close
            trackEvent('wishlist_save_success');
            setShowSuccess(true);
            
            setTimeout(() => {
                onSaveSuccess(finalWishlistData); 
                onClose(); 
            }, 1500);

        } catch (err) {
            console.error("Save Error:", err);
            const message = err instanceof Error ? err.message : 'Connection failed. Please check your internet.';
            setError(message);
            trackEvent('wishlist_save_fail', { error: message });
            setIsLoading(false);
        }
    };

    // Render Success View
    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl animate-fade-in text-center max-w-sm w-full">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Wishlist Updated!</h3>
                    <p className="text-slate-600">Your changes have been saved.</p>
                </div>
                <style>{`
                    @keyframes fade-in {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.2s ease-out forwards;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-0 md:p-4" onClick={onClose}>
            <div 
                className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl shadow-2xl flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="p-6 flex justify-between items-center border-b md:rounded-t-2xl" style={{ backgroundColor: '#15803d' }}>
                    <div>
                        <h2 className="text-2xl font-bold text-white font-serif">Edit My Wishlist</h2>
                        <p className="text-sm text-white/90 mt-1">Enter your details below, then click 'Save Changes' so your Santa sees them!</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/70 hover:bg-white/20 rounded-full"><X size={24} /></button>
                </header>
                
                <main className="p-6 space-y-6 overflow-y-auto flex-grow">
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
                            value={wishlist.interests || ''}
                            onChange={(e) => handleChange('interests', e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My Likes</label>
                        <input
                            type="text"
                            placeholder="e.g., dark roast coffee, fuzzy socks"
                            value={wishlist.likes || ''}
                            onChange={(e) => handleChange('likes', e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">My Dislikes & No-Go's</label>
                        <textarea
                            placeholder="e.g., dislikes horror movies, allergic to wool..."
                            value={wishlist.dislikes || ''}
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
                                    value={link || ''}
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

                <footer className="p-4 bg-slate-50 border-t flex justify-end gap-3 md:rounded-b-2xl">
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
