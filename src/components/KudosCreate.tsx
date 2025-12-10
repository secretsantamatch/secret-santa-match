
import React, { useState } from 'react';
import { Sparkles, Users, Briefcase, Heart, ArrowRight, Loader2, Shuffle, HelpCircle, CheckCircle, Monitor, Gift } from 'lucide-react';
import { createKudosBoard } from '../services/kudosService';
import type { KudosTheme, KudosMode } from '../types';
import { trackEvent } from '../services/analyticsService';

const THEMES: { id: KudosTheme; name: string; color: string; icon: any; bg: string; border: string; activeBorder: string; desc: string }[] = [
    { id: 'corporate', name: 'Corporate Clean', color: 'text-slate-800', icon: Briefcase, bg: 'bg-slate-50', border: 'border-slate-200', activeBorder: 'border-slate-800 ring-1 ring-slate-800', desc: 'Professional and polished.' },
    { id: 'celebration', name: 'Party & Celebration', color: 'text-pink-600', icon: Sparkles, bg: 'bg-pink-50', border: 'border-pink-200', activeBorder: 'border-pink-500 ring-1 ring-pink-500', desc: 'Fun, confetti, and energy.' },
    { id: 'zen', name: 'Wellness & Zen', color: 'text-emerald-800', icon: Heart, bg: 'bg-emerald-50', border: 'border-emerald-200', activeBorder: 'border-emerald-600 ring-1 ring-emerald-600', desc: 'Calming and thoughtful.' },
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
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full border border-slate-200 mb-12">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black font-serif text-slate-900 mb-2">Kudos Exchange</h1>
                    <p className="text-slate-500">Free, instant employee appreciation tool. No login required.</p>
                </div>

                <div className="space-y-8">
                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Board Title <span className="text-red-500">*</span></label>
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
                                className={`p-4 rounded-xl border-2 text-left transition-all opacity-60 cursor-not-allowed border-slate-200 bg-slate-50`}
                                disabled
                            >
                                <div className="flex items-center gap-2 font-bold text-slate-500 mb-1">
                                    <Shuffle size={18} /> Appreciation Shuffle
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">Coming Soon: Randomly assigns teammates to appreciate each other (Secret Santa style).</p>
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
                                    className={`p-3 rounded-xl border-2 transition-all text-left ${t.bg} ${theme === t.id ? t.activeBorder : `${t.border} opacity-70 hover:opacity-100 hover:border-slate-400`}`}
                                >
                                    <div className={`flex items-center gap-2 font-bold mb-1 ${t.color}`}>
                                        <t.icon size={16}/> {t.name}
                                    </div>
                                    <p className="text-[10px] text-slate-500">{t.desc}</p>
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

            {/* How It Works Section */}
            <div className="max-w-3xl w-full">
                <h2 className="text-2xl font-bold text-slate-800 text-center mb-8 font-serif">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">1</div>
                        <h3 className="font-bold text-slate-700 mb-2">Create & Share</h3>
                        <p className="text-sm text-slate-500">Name your board and get a shareable link. Send it to your team via Slack, Teams, or email.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">2</div>
                        <h3 className="font-bold text-slate-700 mb-2">Team Adds Kudos</h3>
                        <p className="text-sm text-slate-500">Colleagues visit the link to write appreciation notes. They can also attach digital gift cards!</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">3</div>
                        <h3 className="font-bold text-slate-700 mb-2">Present & Celebrate</h3>
                        <p className="text-sm text-slate-500">During your meeting, use "Slideshow Mode" to present the kudos with confetti effects.</p>
                    </div>
                </div>
                
                <div className="mt-12 bg-indigo-900 rounded-2xl p-8 text-white text-center">
                    <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
                        <Gift className="text-yellow-400" /> Perfect for HR & Managers
                    </h3>
                    <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
                        Unlike other tools, we don't require your employees to create accounts or give us their email addresses. 
                        It's the safest, fastest way to boost morale.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm font-bold">
                        <span className="flex items-center gap-2 bg-indigo-800 px-3 py-1 rounded-full"><CheckCircle size={14}/> No Login</span>
                        <span className="flex items-center gap-2 bg-indigo-800 px-3 py-1 rounded-full"><CheckCircle size={14}/> Mobile Friendly</span>
                        <span className="flex items-center gap-2 bg-indigo-800 px-3 py-1 rounded-full"><CheckCircle size={14}/> Totally Free</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KudosCreate;
