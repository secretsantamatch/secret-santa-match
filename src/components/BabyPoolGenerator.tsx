
import React, { useState, useEffect } from 'react';
import { Calendar, Scale, Clock, User, Trophy, Share2, Copy, Baby, ExternalLink, PlusCircle, CheckCircle, Instagram, Palette, Gift, Loader2, Lock, AlertCircle, MessageCircle, Trash2, Link as LinkIcon } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { createPool, getPool, submitGuess, declareBirth } from '../services/babyPoolService';
import type { BabyPool, BabyGuess } from '../types';
import confetti from 'canvas-confetti';

type ThemeKey = 'sage' | 'ocean' | 'blush' | 'lavender';

const THEMES: Record<ThemeKey, { name: string, bg: string, primary: string, secondary: string, accent: string, text: string, border: string, gradient: string }> = {
    sage: { name: 'Sage & Sand', bg: 'bg-[#f0fdf4]', primary: 'bg-emerald-600', secondary: 'bg-emerald-100', accent: 'text-emerald-700', text: 'text-emerald-900', border: 'border-emerald-200', gradient: 'from-emerald-50 to-stone-50' },
    ocean: { name: 'Ocean Breeze', bg: 'bg-[#f0f9ff]', primary: 'bg-sky-600', secondary: 'bg-sky-100', accent: 'text-sky-700', text: 'text-sky-900', border: 'border-sky-200', gradient: 'from-sky-50 to-blue-50' },
    blush: { name: 'Sweet Blush', bg: 'bg-[#fff1f2]', primary: 'bg-rose-500', secondary: 'bg-rose-100', accent: 'text-rose-700', text: 'text-rose-900', border: 'border-rose-200', gradient: 'from-rose-50 to-pink-50' },
    lavender: { name: 'Lavender Dream', bg: 'bg-[#faf5ff]', primary: 'bg-violet-500', secondary: 'bg-violet-100', accent: 'text-violet-700', text: 'text-violet-900', border: 'border-violet-200', gradient: 'from-violet-50 to-purple-50' }
};

// Scoring: Date (50), Weight (50), Gender (15), Name (25)
const calculateScore = (guess: BabyGuess, actual: NonNullable<BabyPool['result']>) => {
    let score = 0;
    const gDate = new Date(guess.date).getTime();
    const aDate = new Date(actual.date).getTime();
    const daysDiff = Math.abs(gDate - aDate) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 50 - (daysDiff * 2)); 

    const gTotalOz = (guess.weightLbs * 16) + guess.weightOz;
    const aTotalOz = (actual.weightLbs * 16) + actual.weightOz;
    const ozDiff = Math.abs(gTotalOz - aTotalOz);
    score += Math.max(0, 50 - (ozDiff * 3)); 

    if (guess.gender === actual.gender) score += 15;
    if (actual.actualName && guess.suggestedName && actual.actualName.toLowerCase().trim() === guess.suggestedName.toLowerCase().trim()) score += 25;

    return Math.round(score);
};

interface Invitee {
    id: string;
    name: string;
}

const BabyPoolGenerator: React.FC = () => {
    const [pool, setPool] = useState<BabyPool | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Setup State
    const [setupData, setSetupData] = useState({ babyName: '', dueDate: '', theme: 'sage' as ThemeKey, registryLink: '' });
    const [isCreating, setIsCreating] = useState(false);

    // Guest State
    const [newGuess, setNewGuess] = useState({ guesserName: '', date: '', time: '', weightLbs: 7, weightOz: 0, gender: 'Surprise', suggestedName: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasGuessed, setHasGuessed] = useState(false);

    // Admin State
    const [adminMode, setAdminMode] = useState(false);
    const [birthData, setBirthData] = useState({ date: '', time: '', weightLbs: 7, weightOz: 5, gender: '', actualName: '', photoLink: '' });
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [invitees, setInvitees] = useState<Invitee[]>([]);
    const [newInviteeName, setNewInviteeName] = useState('');

    useEffect(() => {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const poolId = params.get('poolId');
        const adminKey = params.get('adminKey');
        const guestName = params.get('guestName');

        if (poolId) {
            loadPool(poolId, adminKey);
            if (adminKey) {
                setAdminMode(true);
                // Load saved invitees for this pool
                const savedInvitees = localStorage.getItem(`bp_invitees_${poolId}`);
                if (savedInvitees) {
                    try {
                        setInvitees(JSON.parse(savedInvitees));
                    } catch (e) { console.error("Failed to load invitees"); }
                }
            }
            if (guestName) {
                setNewGuess(prev => ({ ...prev, guesserName: decodeURIComponent(guestName) }));
            }
        } else {
            setLoading(false); // Show setup screen
        }
    }, []);

    // Save invitees when they change
    useEffect(() => {
        if (pool && adminMode) {
            localStorage.setItem(`bp_invitees_${pool.poolId}`, JSON.stringify(invitees));
        }
    }, [invitees, pool, adminMode]);

    const loadPool = async (id: string, key?: string | null) => {
        try {
            const data = await getPool(id, key);
            setPool(data);
            if (data.result) {
                // Trigger confetti if just loaded and completed
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#f59e0b', '#3b82f6'] });
            }
        } catch (err) {
            setError("Could not load baby pool. Check the link and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!setupData.babyName || !setupData.dueDate) return alert("Please enter a name and due date!");
        setIsCreating(true);
        try {
            const { poolId, adminKey } = await createPool(setupData);
            window.location.hash = `poolId=${poolId}&adminKey=${adminKey}`;
            window.location.reload();
        } catch (err) {
            alert("Failed to create pool. Please try again.");
            setIsCreating(false);
        }
    };

    const handleGuessSubmit = async () => {
        if (!pool || !newGuess.guesserName || !newGuess.date) return alert("Please fill in required fields!");
        setIsSubmitting(true);
        try {
            await submitGuess(pool.poolId, newGuess);
            await loadPool(pool.poolId); // Reload to see new guess
            setHasGuessed(true);
            setNewGuess({ guesserName: '', date: '', time: '', weightLbs: 7, weightOz: 0, gender: 'Surprise', suggestedName: '' });
        } catch (err) {
            alert("Failed to submit guess.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBirthDeclare = async () => {
        if (!pool || !pool.adminKey) return;
        setIsSubmitting(true);
        try {
            await declareBirth(pool.poolId, pool.adminKey, birthData);
            window.location.reload();
        } catch (err) {
            alert("Failed to update status.");
            setIsSubmitting(false);
        }
    };

    // Admin Invite Helpers
    const addInvitee = () => {
        if (!newInviteeName.trim()) return;
        setInvitees([...invitees, { id: crypto.randomUUID(), name: newInviteeName.trim() }]);
        setNewInviteeName('');
    };

    const removeInvitee = (id: string) => {
        setInvitees(invitees.filter(i => i.id !== id));
    };

    const getPersonalLink = (name: string) => {
        const baseUrl = window.location.href.split('#')[0];
        return `${baseUrl}#poolId=${pool?.poolId}&guestName=${encodeURIComponent(name)}`;
    };

    const copyLink = (text: string) => {
        navigator.clipboard.writeText(text).then(() => alert("Link copied to clipboard!"));
    };

    const shareWhatsApp = (name: string) => {
        const link = getPersonalLink(name);
        const text = `Hi ${name}! Join the Baby Pool for ${pool?.babyName}. Cast your vote here: ${link}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-emerald-600"/></div>;

    // -------------------- SETUP VIEW --------------------
    if (!pool) {
        return (
            <div className="min-h-screen bg-emerald-50 font-sans">
                <Header />
                <div className="max-w-2xl mx-auto p-4 py-12">
                    <div className="bg-white rounded-3xl shadow-xl p-8 border-b-8 border-emerald-200">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 font-serif mb-2">Create a Baby Pool</h1>
                            <p className="text-slate-500">Free, frictionless, and fun. No signup required.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="font-bold text-slate-700 block mb-2">Baby Name (or Placeholder)</label>
                                <input type="text" value={setupData.babyName} onChange={e => setSetupData({...setupData, babyName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-emerald-500 outline-none transition" placeholder="e.g. Baby Smith"/>
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-2">Due Date</label>
                                <input type="date" value={setupData.dueDate} onChange={e => setSetupData({...setupData, dueDate: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-emerald-500 outline-none transition"/>
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-2">Theme</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {Object.entries(THEMES).map(([k, v]) => (
                                        <button key={k} onClick={() => setSetupData({...setupData, theme: k as ThemeKey})} className={`p-2 rounded-xl border-2 transition text-left ${setupData.theme === k ? 'border-slate-800 ring-1 ring-slate-800' : 'border-transparent hover:bg-slate-50'}`}>
                                            <div className={`h-6 w-full ${v.primary} rounded mb-1`}></div>
                                            <span className="text-xs font-bold text-slate-600">{v.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-2">Registry Link (Optional)</label>
                                <input type="text" value={setupData.registryLink} onChange={e => setSetupData({...setupData, registryLink: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-emerald-500 outline-none transition" placeholder="https://www.amazon.com/..."/>
                            </div>

                            <button onClick={handleCreate} disabled={isCreating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center gap-2">
                                {isCreating ? <Loader2 className="animate-spin"/> : <PlusCircle />} Create Pool
                            </button>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // -------------------- POOL DASHBOARD --------------------
    const t = THEMES[pool.theme as ThemeKey] || THEMES.sage;
    const isCompleted = pool.status === 'completed';
    const sortedGuesses = isCompleted && pool.result 
        ? [...pool.guesses].map(g => ({ ...g, score: calculateScore(g, pool.result!) })).sort((a,b) => (b.score || 0) - (a.score || 0))
        : [...pool.guesses].reverse(); // Newest first if active

    return (
        <div className={`min-h-screen font-sans ${t.bg}`}>
            <Header />
            <div className="max-w-3xl mx-auto p-4 pb-20">
                
                {/* HERO HEADER */}
                <div className={`bg-white rounded-3xl shadow-xl overflow-hidden mb-6 border-b-8 ${t.border.replace('border', 'border-b')}`} style={{ borderColor: 'currentColor' }}>
                    <div className={`${t.primary} p-8 text-center text-white relative overflow-hidden`}>
                        <div className="relative z-10">
                            <h1 className="text-4xl md:text-6xl font-black font-serif mb-2 drop-shadow-md">{pool.babyName}</h1>
                            <div className="flex flex-wrap justify-center gap-3 mt-4">
                                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1 text-sm font-bold"><Calendar size={14}/> Due: {pool.dueDate}</span>
                                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1 text-sm font-bold"><User size={14}/> {pool.guesses.length} Guesses</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* ADMIN PANEL - GENERAL */}
                    {adminMode && !isCompleted && (
                        <div className="bg-amber-50 border-b border-amber-100 p-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                                    <Lock size={16}/> ADMIN MODE
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => {
                                        const url = window.location.href.split('&adminKey')[0];
                                        navigator.clipboard.writeText(url);
                                        alert("General guest link copied! Anyone can use this link.");
                                    }} className="flex-1 md:flex-none bg-white border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-100">
                                        Copy General Link
                                    </button>
                                    <button onClick={() => setShowAdminModal(true)} className="flex-1 md:flex-none bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 shadow-sm">
                                        Declare Birth
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ADMIN - PERSONAL LINKS GENERATOR */}
                {adminMode && !isCompleted && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 animate-fade-in">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Share2 size={20} className={t.accent}/> Invite Guests with Personal Links
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Want to make it easier for Grandma? Generate a unique link that pre-fills their name!
                        </p>
                        
                        <div className="flex gap-2 mb-6">
                            <input 
                                type="text" 
                                placeholder="Enter guest name (e.g. Grandma)" 
                                value={newInviteeName}
                                onChange={e => setNewInviteeName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addInvitee()}
                                className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={addInvitee} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-900">
                                Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            {invitees.map(invitee => (
                                <div key={invitee.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${t.primary}`}>
                                            {invitee.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-slate-700">{invitee.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => copyLink(getPersonalLink(invitee.name))} className="p-2 bg-white border hover:bg-slate-100 rounded text-slate-600" title="Copy Link">
                                            <Copy size={16} />
                                        </button>
                                        <button onClick={() => shareWhatsApp(invitee.name)} className="p-2 bg-green-500 hover:bg-green-600 rounded text-white" title="Send via WhatsApp">
                                            <MessageCircle size={16} />
                                        </button>
                                        <button onClick={() => removeInvitee(invitee.id)} className="p-2 text-slate-400 hover:text-red-500" title="Remove">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {invitees.length === 0 && (
                                <div className="text-center text-slate-400 text-sm py-2 italic">
                                    No personalized links generated yet. Add a name above!
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* RESULT CARD (IF BORN) */}
                {isCompleted && pool.result && (
                    <div className={`bg-white rounded-3xl p-8 shadow-lg border-4 ${t.border} mb-8 text-center relative overflow-hidden animate-fade-in`}>
                        <div className={`absolute top-0 left-0 w-full h-2 ${t.primary}`}></div>
                        <h2 className={`text-2xl font-bold ${t.text} font-serif mb-6`}>It's Official! Welcome {pool.result.actualName}!</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-400 uppercase font-bold">Date</div><div className="font-bold text-slate-700">{pool.result.date}</div></div>
                            <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-400 uppercase font-bold">Time</div><div className="font-bold text-slate-700">{pool.result.time}</div></div>
                            <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-400 uppercase font-bold">Weight</div><div className="font-bold text-slate-700">{pool.result.weightLbs}lb {pool.result.weightOz}oz</div></div>
                            <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-400 uppercase font-bold">Gender</div><div className="font-bold text-slate-700">{pool.result.gender}</div></div>
                        </div>
                        {pool.result.photoLink && (
                            <a href={pool.result.photoLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline bg-blue-50 px-4 py-2 rounded-full">
                                <Instagram size={18}/> See Baby Photos
                            </a>
                        )}
                    </div>
                )}

                {/* GUESS FORM (IF ACTIVE) */}
                {!isCompleted && !hasGuessed && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 animate-fade-in">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><PlusCircle size={20} className={t.accent}/> Cast Your Vote</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input type="text" placeholder="Your Name" value={newGuess.guesserName} onChange={e => setNewGuess({...newGuess, guesserName: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50"/>
                            <input type="date" value={newGuess.date} onChange={e => setNewGuess({...newGuess, date: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50"/>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="col-span-2 flex gap-2">
                                <div className="flex-1"><label className="text-xs font-bold text-slate-400">Lbs</label><input type="number" value={newGuess.weightLbs} onChange={e => setNewGuess({...newGuess, weightLbs: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl bg-slate-50"/></div>
                                <div className="flex-1"><label className="text-xs font-bold text-slate-400">Oz</label><input type="number" value={newGuess.weightOz} onChange={e => setNewGuess({...newGuess, weightOz: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl bg-slate-50"/></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400">Gender</label>
                                <select value={newGuess.gender} onChange={e => setNewGuess({...newGuess, gender: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50">
                                    <option>Boy</option><option>Girl</option><option>Surprise</option>
                                </select>
                            </div>
                        </div>
                        <input type="text" placeholder="Guess the Name (Optional)" value={newGuess.suggestedName} onChange={e => setNewGuess({...newGuess, suggestedName: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 mb-4"/>
                        <button onClick={handleGuessSubmit} disabled={isSubmitting} className={`w-full ${t.primary} hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-md`}>
                            {isSubmitting ? 'Submitting...' : 'Submit Guess'}
                        </button>
                    </div>
                )}

                {/* LEADERBOARD */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 px-2 flex items-center gap-2"><Trophy size={18}/> {isCompleted ? 'Final Results' : 'Recent Guesses'}</h3>
                    {sortedGuesses.map((g, i) => (
                        <div key={g.id} className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between ${isCompleted && i===0 ? 'border-yellow-400 bg-yellow-50' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-4">
                                {isCompleted && <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i===0?'bg-yellow-400 text-white':'bg-slate-100 text-slate-500'}`}>{i+1}</div>}
                                <div>
                                    <div className="font-bold text-slate-800">{g.guesserName}</div>
                                    <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{g.date}</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{g.weightLbs}lb {g.weightOz}oz</span>
                                        {g.suggestedName && <span className="bg-slate-100 px-2 py-0.5 rounded">"{g.suggestedName}"</span>}
                                    </div>
                                </div>
                            </div>
                            {isCompleted && <div className="font-bold text-xl text-slate-700">{g.score}pts</div>}
                        </div>
                    ))}
                    {sortedGuesses.length === 0 && <div className="text-center text-slate-400 py-8">No guesses yet. Be the first!</div>}
                </div>

                {/* AMAZON PROMO (Affiliate) */}
                <div className={`mt-12 p-6 bg-white rounded-2xl border-2 ${t.border} shadow-sm`}>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Gift size={20} className="text-orange-500"/> Registry & Gifts</h3>
                    <p className="text-slate-600 text-sm mb-4">Need a gift? Check their registry or grab a Prime perk.</p>
                    
                    {pool.registryLink && (
                        <a href={pool.registryLink} target="_blank" className="block w-full text-center bg-slate-800 text-white font-bold py-3 rounded-xl mb-3 hover:bg-slate-900">
                            View {pool.babyName}'s Registry
                        </a>
                    )}
                    
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <h4 className="font-bold text-orange-800 text-sm mb-1">Amazon Baby Registry Benefits</h4>
                        <ul className="text-xs text-orange-700 space-y-1 mb-3 list-disc pl-4">
                            <li>Free Welcome Box ($35 value)</li>
                            <li>15% Completion Discount</li>
                            <li>365-Day Returns</li>
                        </ul>
                        <a href="https://www.amazon.com/baby-reg?tag=secretsanmat-20" target="_blank" className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm">
                            Create Free Registry
                        </a>
                    </div>
                </div>

                <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />
            </div>

            {/* ADMIN MODAL */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="font-bold text-xl mb-4 text-slate-800">Baby has arrived!</h3>
                        <div className="space-y-3">
                            <input type="text" placeholder="Actual Name" value={birthData.actualName} onChange={e => setBirthData({...birthData, actualName: e.target.value})} className="w-full p-3 border rounded-xl"/>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" value={birthData.date} onChange={e => setBirthData({...birthData, date: e.target.value})} className="w-full p-3 border rounded-xl"/>
                                <input type="time" value={birthData.time} onChange={e => setBirthData({...birthData, time: e.target.value})} className="w-full p-3 border rounded-xl"/>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 flex gap-2">
                                    <input type="number" placeholder="Lbs" value={birthData.weightLbs} onChange={e => setBirthData({...birthData, weightLbs: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl"/>
                                    <input type="number" placeholder="Oz" value={birthData.weightOz} onChange={e => setBirthData({...birthData, weightOz: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl"/>
                                </div>
                                <select value={birthData.gender} onChange={e => setBirthData({...birthData, gender: e.target.value})} className="w-full p-3 border rounded-xl">
                                    <option value="">Gender</option><option>Boy</option><option>Girl</option>
                                </select>
                            </div>
                            <input type="text" placeholder="Photo Link (Instagram/FB/Google Photos)" value={birthData.photoLink} onChange={e => setBirthData({...birthData, photoLink: e.target.value})} className="w-full p-3 border rounded-xl"/>
                            
                            <button onClick={handleBirthDeclare} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl mt-2">
                                Finalize & Calculate Winner
                            </button>
                            <button onClick={() => setShowAdminModal(false)} className="w-full text-slate-500 py-2">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default BabyPoolGenerator;
