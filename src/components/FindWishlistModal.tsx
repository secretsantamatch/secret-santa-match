import React, { useState } from 'react';
import { Link, Search, X } from 'lucide-react';

interface FindWishlistModalProps {
    onClose: () => void;
}

const FindWishlistModal: React.FC<FindWishlistModalProps> = ({ onClose }) => {
    const [link, setLink] = useState('');
    const [error, setError] = useState('');

    const handleFind = () => {
        setError('');
        if (!link.trim()) {
            setError('Please paste your wishlist link.');
            return;
        }

        try {
            const url = new URL(link);
            const id = url.searchParams.get('id');
            
            if (url.pathname.includes('wishlist-editor.html') && id) {
                // It's a valid wishlist editor link, redirect!
                window.location.href = link;
            } else {
                setError('This does not look like a valid wishlist link. Please check the URL and try again.');
            }
        } catch (e) {
            setError('Invalid URL. Please paste the full link provided by your organizer.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 font-serif">Edit Your Wishlist</h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                </div>
                <p className="mb-4 text-gray-600">
                    Lost your editing page? Paste the unique wishlist link your organizer sent you below to get back to it.
                </p>
                
                <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="url"
                        className="w-full p-3 pl-10 border border-slate-300 rounded-lg"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="https://secretsantamatch.com/wishlist-editor.html?id=..."
                    />
                </div>
                
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button onClick={onClose} className="py-2 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg w-full sm:w-auto">Cancel</button>
                    <button onClick={handleFind} className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex-grow flex items-center justify-center gap-2">
                        <Search size={18} /> Find My Wishlist
                    </button>
                </div>
                 <p className="text-xs text-slate-500 mt-4 text-center">
                    <strong>Can't find your link?</strong> Please contact your event organizer. For privacy, we don't store links or emails.
                </p>
            </div>
        </div>
    );
};

export default FindWishlistModal;