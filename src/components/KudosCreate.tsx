
import React, { useState } from 'react';
import { Sparkles, Users, Briefcase, Heart, ArrowRight, Loader2, Shuffle, Gift, CheckCircle, Calendar, Clock, Plane } from 'lucide-react';
import { createKudosBoard } from '../services/kudosService';
import type { KudosTheme, KudosMode } from '../types';
import { trackEvent } from '../services/analyticsService';

const THEMES: { id: KudosTheme; name: string; color: string; icon: any; bg: string; border: string; activeBorder: string; desc: string }[] = [
    { id: 'corporate', name: 'Corporate Clean', color: 'text-slate-800', icon: Briefcase, bg: 'bg-slate-50', border: 'border-slate-200', activeBorder: 'border-slate-800 ring-1 ring-slate-800', desc: 'Professional and polished.' },
    { id: 'celebration', name: 'Party & Celebration', color: 'text-pink-600', icon: Sparkles, bg: 'bg-pink-50', border: 'border-pink-200', activeBorder: 'border-pink-500 ring-1 ring-pink-500', desc: 'Fun, confetti, and energy.' },
    { id: 'zen', name: 'Wellness & Zen', color: 'text-emerald-800', icon: Heart, bg: 'bg-emerald-50', border: 'border-emerald-200', activeBorder: 'border-emerald-600 ring-1 ring-emerald-600', desc: 'Calming and thoughtful.' },
    { id: 'farewell', name: 'Farewell / Retirement', color: 'text-blue-800', icon: Plane, bg: 'bg-sky-50', border: 'border-sky-200', activeBorder: 'border-blue-600 ring-1 ring-blue-600', desc: 'Bon voyage and good luck.' },
];

const KudosCreate: React.FC = () => {
    const [title, setTitle] = useState('');
    const [theme, setTheme] = useState<KudosTheme>('corporate');
    const [mode, setMode] = useState<KudosMode>('open');
    const [isCreating, setIsCreating] = useState(false);
    
    // Scheduled Unlock
    const [useSchedule, setUseSchedule] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    const handleCreate = async () => {
        if (!title.trim()) return;
        setIsCreating(true);
        try {
            let scheduledReveal = null;
            if (useSchedule && scheduledDate && scheduledTime) {
                scheduledReveal = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
            }

            const result = await createKudosBoard({ title, theme, mode, scheduledReveal });
            trackEvent('kudos_created', { theme, mode, has_schedule: !!scheduledReveal });
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
                                <p className="text-xs text-slate-500 leading-relaxed">Everyone can write cards for anyone. Best for general team morale.</p>
                            </button>
                            <button 
                                onClick={() => setMode('signed_card')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'signed_card' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                                    <Gift size={18} className="text-pink-600"/> Signed by Everyone
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">Perfect for Birthdays or Farewells. One giant card that everyone signs.</p>
                            </button>
                        </div>
                    </div>

                    {/* Theme Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Choose a Theme</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    {/* Scheduled Unlock */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                            <input 
                                type="checkbox" 
                                id="schedule" 
                                checked={useSchedule} 
                                onChange={(e) => setUseSchedule(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="schedule" className="text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
                                <Clock size={16} /> Schedule Reveal? (Optional)
                            </label>
                        </div>
                        {useSchedule && (
                            <div className="grid grid-cols-2 gap-3 animate-fade-in pl-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Date</label>
                                    <input 
                                        type="date" 
                                        value={scheduledDate} 
                                        onChange={e => setScheduledDate(e.target.value)}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Time</label>
                                    <input 
                                        type="time" 
                                        value={scheduledTime} 
                                        onChange={e => setScheduledTime(e.target.value)}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                                <p className="col-span-2 text-[10px] text-slate-400">Board content will be hidden from guests until this time.</p>
                            </div>
                        )}
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