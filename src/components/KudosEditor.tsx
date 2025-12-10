
import React, { useState } from 'react';
import { X, Gift, Sparkles, Send, Loader2, Link as LinkIcon, Image as ImageIcon, Search } from 'lucide-react';
import { addKudosCard } from '../services/kudosService';
import type { KudosTheme } from '../types';
import { trackEvent } from '../services/analyticsService';

interface KudosEditorProps {
    boardId: string;
    onClose: () => void;
    theme: KudosTheme;
}

const PROMPTS = [
    "You saved the day when...",
    "I really appreciate how you...",
    "Your superpower is...",
    "Thank you for always...",
    "One thing I admire about you is..."
];

const GIFT_VENDORS = [
    { name: 'Starbucks', url: 'https://www.starbucks.com/card', icon: '☕' },
    { name: 'Amazon', url: 'https://www.amazon.com/gift-cards', icon: '📦' },
    { name: 'Visa', url: 'https://www.giftcards.com/visa-gift-cards', icon: '💳' },
];

const KudosEditor: React.FC<KudosEditorProps> = ({ boardId, onClose, theme }) => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Media & Gifts
    const [showGiftInput, setShowGiftInput] = useState(false);
    const [giftLink, setGiftLink] = useState('');
    const [activeTab, setActiveTab] = useState<'write' | 'gif'>('write');
    const [gifUrl, setGifUrl] = useState<string | undefined>(undefined);
    
    // Giphy State
    const [gifSearch, setGifSearch] = useState('');
    const [gifs, setGifs] = useState<any[]>([]);
    const [loadingGifs, setLoadingGifs] = useState(false);

    const handlePrompt = () => {
        const random = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
        setMessage(prev => prev ? prev + "\n" + random : random);
    };

    const searchGiphy = async () => {
        if (!gifSearch) return;
        setLoadingGifs(true);
        try {
            // Using public beta key for demo purposes. 
            // In a production app with high volume, this should be proxied through Netlify Functions with a real key.
            const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(gifSearch)}&limit=12&rating=g`);
            const data = await res.json();
            setGifs(data.data);
        } catch (e) {
            console.error("Giphy error", e);
        } finally {
            setLoadingGifs(false);
        }
    };

    const handleSubmit = async () => {
        if (!from || !to || !message) return;
        setIsSubmitting(true);
        try {
            await addKudosCard(boardId, {
                from,
                to,
                message,
                style: 'classic', 
                giftLink: giftLink.trim() || undefined,
                gifUrl: gifUrl
            });
            trackEvent('kudos_card_added', { has_gift: !!giftLink, has_gif: !!gifUrl });
            onClose();
        } catch (e) {
            alert("Failed to post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[95vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Add Kudos</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
                            <input type="text" className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white outline-none" placeholder="Name" value={to} onChange={e => setTo(e.target.value)} autoFocus />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From</label>
                            <input type="text" className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white outline-none" placeholder="Your Name" value={from} onChange={e => setFrom(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex gap-4 border-b border-slate-200">
                        <button onClick={() => setActiveTab('write')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'write' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Write Message</button>
                        <button onClick={() => setActiveTab('gif')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'gif' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Add GIF</button>
                    </div>

                    {activeTab === 'write' && (
                        <div className="relative">
                            <textarea 
                                className="w-full p-4 border rounded-xl h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition text-lg"
                                placeholder="Write your message of appreciation..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                            />
                            <button onClick={handlePrompt} className="absolute bottom-3 right-3 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                                <Sparkles size={12}/> Inspire Me
                            </button>
                        </div>
                    )}

                    {activeTab === 'gif' && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 p-2 border rounded-lg text-sm outline-none" 
                                    placeholder="Search Giphy (e.g. 'high five')" 
                                    value={gifSearch} 
                                    onChange={e => setGifSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchGiphy()}
                                />
                                <button onClick={searchGiphy} className="bg-indigo-600 text-white px-4 rounded-lg"><Search size={16}/></button>
                            </div>
                            <div className="h-48 overflow-y-auto grid grid-cols-3 gap-2 p-1 border rounded-lg bg-slate-50">
                                {loadingGifs ? <div className="col-span-3 text-center py-10"><Loader2 className="animate-spin mx-auto text-slate-400"/></div> : 
                                 gifs.map(g => (
                                     <div key={g.id} onClick={() => { setGifUrl(g.images.fixed_height.url); setActiveTab('write'); }} className="cursor-pointer hover:opacity-80">
                                         <img src={g.images.fixed_height_small.url} alt={g.title} className="w-full h-full object-cover rounded"/>
                                     </div>
                                 ))
                                }
                            </div>
                        </div>
                    )}
                    
                    {gifUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200">
                            <img src={gifUrl} alt="Selected GIF" className="w-full h-32 object-cover" />
                            <button onClick={() => setGifUrl(undefined)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={14}/></button>
                        </div>
                    )}

                    {/* GIFT MODULE */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-amber-900 flex items-center gap-2">
                                <Gift size={18} className="text-amber-600"/> Attach a Gift?
                            </span>
                            {!showGiftInput && (
                                <button onClick={() => setShowGiftInput(true)} className="text-xs font-bold bg-white border border-amber-200 text-amber-700 px-3 py-1 rounded-full shadow-sm hover:bg-amber-50 transition-colors">
                                    Add Gift Card
                                </button>
                            )}
                        </div>
                        
                        {showGiftInput && (
                            <div className="space-y-3 animate-fade-in">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {GIFT_VENDORS.map(v => (
                                        <a key={v.name} href={v.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:border-amber-400 hover:text-amber-800 transition-colors">
                                            {v.icon} Buy {v.name}
                                        </a>
                                    ))}
                                </div>
                                <div className="relative">
                                    <LinkIcon size={16} className="absolute left-3 top-3.5 text-amber-400" />
                                    <input type="text" placeholder="Paste the gift link here..." value={giftLink} onChange={e => setGiftLink(e.target.value)} className="w-full pl-9 p-3 rounded-lg border border-amber-200 focus:border-amber-400 outline-none text-sm"/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!from || !to || !message || isSubmitting} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Post Kudos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KudosEditor;