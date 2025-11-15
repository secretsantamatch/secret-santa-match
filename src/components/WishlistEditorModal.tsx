import React, { useState } from 'react';
import type { Participant } from '../types';
import { trackEvent } from '../services/analyticsService';
import { Save, X } from 'lucide-react';

interface WishlistEditorModalProps {
  participant: Participant;
  onClose: () => void;
  onSave: (updatedParticipant: Participant) => void;
}

const WishlistEditorModal: React.FC<WishlistEditorModalProps> = ({ participant, onClose, onSave }) => {
    const [wishlist, setWishlist] = useState({
        interests: participant.interests || '',
        likes: participant.likes || '',
        dislikes: participant.dislikes || '',
        links: Array.isArray(participant.links) ? participant.links : Array(5).fill(''),
    });

    const handleChange = (field: keyof Omit<typeof wishlist, 'links'>, value: string) => {
        setWishlist(prev => ({ ...prev, [field]: value }));
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...wishlist.links];
        newLinks[index] = value;
        setWishlist(prev => ({ ...prev, links: newLinks }));
    };

    const handleSave = () => {
        trackEvent('wishlist_save_attempt');
        
        const updatedParticipant: Participant = {
            ...participant,
            interests: wishlist.interests,
            likes: wishlist.likes,
            dislikes: wishlist.dislikes,
            links: wishlist.links.filter(link => link.trim() !== ''), // Clean up empty links
        };
        
        // Pad the links array to always have 5 elements for data structure consistency
        while (updatedParticipant.links.length < 5) {
            updatedParticipant.links.push('');
        }

        onSave(updatedParticipant);
        trackEvent('wishlist_save_success');
        onClose();
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
                            {Array.from({ length: 5 }).map((_, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    placeholder={`e.g., https://www.amazon.com/wishlist/...`}
                                    value={wishlist.links[i] || ''}
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
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2"
                    >
                        <Save size={20} />
                        Save Changes
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default WishlistEditorModal;