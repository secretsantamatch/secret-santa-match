import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Gift, Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Wishlist } from '../types';
// FIX: Import FindWishlistModal to handle wishlist editing.
import FindWishlistModal from './FindWishlistModal';

const WishlistEditorPage: React.FC = () => {
    const [wishlist, setWishlist] = useState<Wishlist>({
        interests: '',
        likes: '',
        dislikes: '',
        links: '',
        budget: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');
    const [wishlistId, setWishlistId] = useState<string | null>(null);
    // FIX: Add state to control the visibility of the FindWishlistModal.
    const [showFindWishlistModal, setShowFindWishlistModal] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        setWishlistId(id);
        
        if (!id) {
            setError('No wishlist ID found. This link may be invalid or expired.');
            setStatus('error');
            return;
        }

        const fetchWishlist = async () => {
            setStatus('loading');
            try {
                const response = await fetch(`/.netlify/functions/get-wishlist?id=${id}`);
                if (!response.ok) {
                    throw new Error('Could not find your wishlist. Please check the link.');
                }
                const data: Wishlist = await response.json();
                setWishlist(data);
                setStatus('idle');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                setStatus('error');
            }
        };

        fetchWishlist();
    }, []);

    const handleSave = async () => {
        if (!wishlistId) return;
        setStatus('saving');
        try {
            const response = await fetch(`/.netlify/functions/update-wishlist?id=${wishlistId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(wishlist),
            });
            if (!response.ok) {
                throw new Error('Failed to save your wishlist. Please try again.');
            }
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while saving.');
            setStatus('error');
        }
    };

    const handleInputChange = (field: keyof Wishlist, value: string) => {
        setWishlist(prev => ({ ...prev, [field]: value }));
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-10 w-10 text-red-600 mx-auto" />
                    <p className="mt-4 text-slate-600 font-semibold">Loading Your Wishlist...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            {/* FIX: Pass the required onFindWishlistClick prop to the Header component. */}
            <Header onFindWishlistClick={() => setShowFindWishlistModal(true)} />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 max-w-2xl my-12">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                    <div className="text-center mb-8">
                        <Gift className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-slate-800 font-serif">Your Wishlist Editor</h1>
                        <p className="text-slate-600 mt-2">Help your Secret Santa out! Add some ideas to guide them. Your changes will be saved automatically for them to see.</p>
                    </div>

                     {status === 'error' && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                            <h2 className="font-bold text-red-800">Something went wrong</h2>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                        <div>
                            <label htmlFor="interests" className="block text-sm font-medium text-slate-700">Interests & Hobbies</label>
                            <input id="interests" type="text" value={wishlist.interests} onChange={e => handleInputChange('interests', e.target.value)} placeholder="e.g., coffee, gardening, sci-fi books" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                            <p className="text-xs text-slate-500 mt-1">Separate with commas.</p>
                        </div>
                        <div>
                            <label htmlFor="likes" className="block text-sm font-medium text-slate-700">Likes</label>
                            <input id="likes" type="text" value={wishlist.likes} onChange={e => handleInputChange('likes', e.target.value)} placeholder="e.g., dark roast coffee, fuzzy socks" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="dislikes" className="block text-sm font-medium text-slate-700">Dislikes & No-Go's</label>
                            <textarea id="dislikes" value={wishlist.dislikes} onChange={e => handleInputChange('dislikes', e.target.value)} placeholder="e.g., dislikes horror movies, allergic to wool..." className="mt-1 block w-full p-2 border border-slate-300 rounded-md" rows={2} />
                        </div>
                        <div>
                            <label htmlFor="links" className="block text-sm font-medium text-slate-700">Specific Links (Optional)</label>
                            <textarea id="links" value={wishlist.links} onChange={e => handleInputChange('links', e.target.value)} placeholder="Paste one link per line" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" rows={3} />
                        </div>
                        <div>
                            <label htmlFor="budget" className="block text-sm font-medium text-slate-700">Suggested Budget ($)</label>
                            <input id="budget" type="text" value={wishlist.budget} onChange={e => handleInputChange('budget', e.target.value)} placeholder="e.g., 25" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div className="text-right">
                             <button
                                type="button"
                                onClick={handleSave}
                                disabled={status === 'saving' || status === 'success'}
                                className={`inline-flex items-center gap-2 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-70
                                    ${status === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                            >
                                {status === 'saving' && <Loader2 className="animate-spin" size={20} />}
                                {status === 'success' ? <><CheckCircle size={20} /> Saved!</> : <><Save size={20} /> Save Wishlist</>}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
            {/* FIX: Render the FindWishlistModal when its state is true. */}
            {showFindWishlistModal && <FindWishlistModal onClose={() => setShowFindWishlistModal(false)} />}
        </div>
    );
};

export default WishlistEditorPage;