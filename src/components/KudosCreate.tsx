
import React, { useState } from 'react';
import { Sparkles, Users, Briefcase, Heart, ArrowRight, Loader2, Shuffle } from 'lucide-react';
import { createKudosBoard } from '../services/kudosService';
import type { KudosTheme, KudosMode } from '../types';
import { trackEvent } from '../services/analyticsService';

const THEMES: { id: KudosTheme; name: string; color: string; icon: any; bg: string; border: string; desc: string }[] = [
    { id: 'corporate', name: 'Corporate Clean', color: 'text-slate-800', icon: Briefcase, bg: 'bg-slate-100', border: 'border-slate-300', desc: 'Professional and polished.' },
    { id: 'celebration', name: 'Party & Celebration', color: 'text-pink-600', icon: Sparkles, bg: 'bg-pink-50', border: 'border-pink-200', desc: 'Fun, confetti, and energy.' },
    { id: 'zen', name: 'Wellness & Zen', color: 'text-emerald-800', icon: Heart, bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Calming and thoughtful.' },
];

const KudosCreate: React.FC = () => {
    const [title, setTitle] = useState('');
    const [theme, setTheme] = useState<KudosTheme>('corporate');
    const [mode, setMode] = useState<KudosMode>('open');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) return;
        setIsCreating(true);
        try {
            const result = await createKudosBoard({ title, theme, mode });
            trackEvent('kudos_created', { theme, mode });
            window.location.hash = `id=${result.publicId}&admin=${result.adminKey}`;
        } catch (error) {
            console.error(error);
            alert("Failed to create board. Please try again.");
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full border border-slate-200">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black font-serif text-slate-900 mb-2">Create a Kudos Board</h1>
                    <p className="text-slate-500">Free, instant, and perfect for team appreciation.</p>
                </div>

                <div className="space-y-8">
                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Board Title</label>
                        <input 
                            type="text" 
                            className="w-full p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                            placeholder="e.g. Q4 Marketing Team Appreciation"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Mode Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Exchange Style</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => setMode('open')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'open' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                                    <Users size={18} className="text-indigo-600"/> Open Board
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">Everyone can write cards for anyone. Best for general team morale and birthdays.</p>
                            </button>
                            <button 
                                onClick={() => setMode('shuffle')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'shuffle' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                                    <Shuffle size={18} className="text-indigo-600"/> Appreciation Shuffle
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">Like Secret Santa, but for nice notes. Each person gets assigned one teammate to appreciate.</p>
                            </button>
                        </div>
                    </div>

                    {/* Theme Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Choose a Theme</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {THEMES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`p-3 rounded-xl border-2 transition-all text-left ${t.bg} ${theme === t.id ? `border-slate-900 ring-2 ring-offset-1 ring-slate-900` : `${t.border} opacity-70 hover:opacity-100`}`}
                                >
                                    <div className={`flex items-center gap-2 font-bold mb-1 ${t.color}`}>
                                        <t.icon size={16}/> {t.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleCreate}
                        disabled={!title.trim() || isCreating}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? <Loader2 className="animate-spin" /> : 'Create Board'} <ArrowRight size={20} />
                    </button>
                    
                    <p className="text-center text-xs text-slate-400">
                        No email or sign-up required. Your board is private to the link you share.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KudosCreate;
