
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Scale, Clock, User, Trophy, Share2, Copy, Baby, ExternalLink, PlusCircle, CheckCircle, Instagram, Palette, Gift, Loader2, Lock, AlertCircle, MessageCircle, Trash2, Link as LinkIcon, Heart, DollarSign, Ruler, Scissors, Eye, HelpCircle, List } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { createPool, getPool, submitGuess, declareBirth } from '../services/babyPoolService';
import type { BabyPool, BabyGuess } from '../types';
import confetti from 'canvas-confetti';

type ThemeKey = 'sage' | 'ocean' | 'blush' | 'lavender' | 'roseGold' | 'midnight' | 'teddy';

const THEMES: Record<ThemeKey, { name: string, bg: string, primary: string, secondary: string, accent: string, text: string, border: string, gradient: string, previewColor: string }> = {
    sage: { name: 'Sage & Sand', bg: 'bg-[#f0fdf4]', primary: 'bg-emerald-600', secondary: 'bg-emerald-100', accent: 'text-emerald-700', text: 'text-emerald-900', border: 'border-emerald-200', gradient: 'from-emerald-50 to-stone-50', previewColor: '#059669' },
    ocean: { name: 'Ocean Breeze', bg: 'bg-[#f0f9ff]', primary: 'bg-sky-600', secondary: 'bg-sky-100', accent: 'text-sky-700', text: 'text-sky-900', border: 'border-sky-200', gradient: 'from-sky-50 to-blue-50', previewColor: '#0284c7' },
    blush: { name: 'Sweet Blush', bg: 'bg-[#fff1f2]', primary: 'bg-rose-400', secondary: 'bg-rose-100', accent: 'text-rose-600', text: 'text-rose-900', border: 'border-rose-200', gradient: 'from-rose-50 to-pink-50', previewColor: '#fb7185' },
    lavender: { name: 'Lavender Dream', bg: 'bg-[#faf5ff]', primary: 'bg-violet-500', secondary: 'bg-violet-100', accent: 'text-violet-700', text: 'text-violet-900', border: 'border-violet-200', gradient: 'from-violet-50 to-purple-50', previewColor: '#8b5cf6' },
    roseGold: { name: 'Rose Gold', bg: 'bg-gradient-to-br from-rose-50 via-white to-orange-50', primary: 'bg-gradient-to-r from-rose-400 to-orange-300', secondary: 'bg-rose-50', accent: 'text-rose-500', text: 'text-slate-800', border: 'border-orange-100', gradient: 'from-rose-100 to-orange-50', previewColor: '#fb7185' },
    midnight: { name: 'Midnight Star', bg: 'bg-gradient-to-b from-slate-900 to-indigo-900', primary: 'bg-indigo-500', secondary: 'bg-indigo-800/50', accent: 'text-yellow-400', text: 'text-white', border: 'border-indigo-800', gradient: 'from-indigo-900 to-slate-900', previewColor: '#6366f1' },
    teddy: { name: 'Classic Teddy', bg: 'bg-[#fffbeb]', primary: 'bg-amber-700', secondary: 'bg-amber-100', accent: 'text-amber-800', text: 'text-amber-900', border: 'border-amber-200', gradient: 'from-amber-50 to-orange-50', previewColor: '#b45309' }
};

const HAIR_COLORS = ['Bald/None', 'Blonde', 'Brown', 'Black', 'Red', 'Strawberry Blonde'];
const EYE_COLORS = ['Blue', 'Brown', 'Green', 'Hazel', 'Grey', 'Violet'];

// Scoring logic
const calculateScore = (guess: BabyGuess, actual: NonNullable<BabyPool['result']>) => {
    let score = 0;
    // Date: 50 pts max, -2 per day off
    const gDate = new Date(guess.date).getTime();
    const aDate = new Date(actual.date).getTime();
    const daysDiff = Math.abs(gDate - aDate) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 50 - (daysDiff * 2)); 

    // Weight: 50 pts max, -3 per oz off
    const gTotalOz = (guess.weightLbs * 16) + guess.weightOz;
    const aTotalOz = (actual.weightLbs * 16) + actual.weightOz;
    const ozDiff = Math.abs(gTotalOz - aTotalOz);
    score += Math.max(0, 50 - (ozDiff * 3)); 

    // Time: 30 pts max, -1 per 10 mins off
    if (guess.time && actual.time) {
        const gTime = new Date(`2000-01-01T${guess.time}`).getTime();
        const aTime = new Date(`2000-01-01T${actual.time}`).getTime();
        const minsDiff = Math.abs(gTime - aTime) / (1000 * 60);
        score += Math.max(0, 30 - Math.floor(minsDiff / 10));
    }

    // Length: 30 pts max, -5 per inch off
    if (guess.length && actual.length) {
        score += Math.max(0, 30 - (Math.abs(guess.length - actual.length) * 5));
    }

    if (guess.gender === actual.gender) score += 15;
    if (guess.hairColor && actual.hairColor && guess.hairColor === actual.hairColor) score += 10;
    if (guess.eyeColor && actual.eyeColor && guess.eyeColor === actual.eyeColor) score += 10;
    
    // Name Match (Fuzzyish)
    if (actual.actualName && guess.suggestedName && actual.actualName.toLowerCase().trim() === guess.suggestedName.toLowerCase().trim()) score += 50;

    return Math.round(score);
};

interface Invitee {
    id: string;
    name: string;
}

// --- Countdown Component ---
const PoolCountdown: React.FC<{ dueDate: string, theme: any }> = ({ dueDate, theme }) => {
    const calculateTimeLeft = useCallback(() => {
        const diff = new Date(dueDate).getTime() - new Date().getTime();
        if (diff <= 0) return null;
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        };
    }, [dueDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    if (!timeLeft) return <div className="text-center font-bold text-slate-500 mb-6">Baby is overdue (or already here)!</div>;

    return (
        <div className={`mb-8 p-4 rounded-2xl ${theme.secondary} border ${theme.border} text-center shadow-sm`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.accent}`}>Baby Arrives In</p>
            <div className="flex justify-center gap-3 md:gap-6">
                {Object.entries(timeLeft).map(([unit, value]) => (
                    <div key={unit} className="flex flex-col">
                        <span className={`text-2xl md:text-4xl font-black ${theme.text}`}>{String(value).padStart(2, '0')}</span>
                        <span className="text-[10px] md:text-xs text-slate-500 uppercase">{unit}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BabyPoolGenerator: React.FC = () => {
    const [pool, setPool] = useState<BabyPool | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Setup State
    const [setupData, setSetupData] = useState({ 
        babyName: '', 
        parentNames: '',
        dueDate: '', 
        theme: 'sage' as ThemeKey, 
        registryLink: '',
        diaperFundLink: '',
        knowGender: false,
        customQuestions: ['', '', ''] 
    });
    const [activeTab, setActiveTab] = useState<'details' | 'style' | 'registry'>('details');
    const [isCreating, setIsCreating] = useState(false);

    // Guest State
    const [newGuess, setNewGuess] = useState({ 
        guesserName: '', 
        date: '', 
        time: '', 
        weightLbs: 7, 
        weightOz: 0, 
        length: 20,
        hairColor: 'Bald/None',
        eyeColor: 'Blue',
        gender: 'Surprise', 
        suggestedName: '',
        customAnswers: {} as Record<string, string>
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasGuessed, setHasGuessed] = useState(false);

    // Admin State
    const [adminMode, setAdminMode] = useState(false);
    const [birthData, setBirthData] = useState({ date: '', time: '', weightLbs: 7, weightOz: 5, length: 20, hairColor: '', eyeColor: '', gender: '', actualName: '', photoLink: '' });
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
            setLoading(false);
        }
    }, []);

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
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#f59e0b', '#3b82f6'] });
            }
        } catch (err) {
            setError("Could not load baby pool. Check the link and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!setupData.babyName || !setupData.dueDate) {
            alert("Please enter a name and due date in the Details tab!");
            setActiveTab('details');
            return;
        }
        setIsCreating(true);
        try {
            // Filter empty custom questions
            const cleanQuestions = setupData.customQuestions.filter(q => q.trim() !== '');
            const { poolId, adminKey } = await createPool({ ...setupData, customQuestions: cleanQuestions });
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
            // Filter gender if unknown
            const submission = { ...newGuess };
            if (pool.knowGender) {
                delete (submission as any).gender;
            }
            await submitGuess(pool.poolId, submission);
            await loadPool(pool.poolId);
            setHasGuessed(true);
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

    // -------------------- SETUP WIZARD VIEW --------------------
    if (!pool) {
        const previewTheme = THEMES[setupData.theme];
        
        return (
            <div className="min-h-screen bg-slate-50 font-sans">
                <Header />
                
                <div className="bg-white border-b border-slate-200 py-12 px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-800 font-serif mb-3">
                        The #1 Free Baby Pool Generator
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Host a stylish, fun, and private guessing game for your due date, weight, and more. 
                        <span className="block mt-1 font-semibold text-emerald-600">No apps to download, just a link to share.</span>
                    </p>
                </div>

                <div className="max-w-6xl mx-auto p-4 md:p-8">
                    <div className="grid lg:grid-cols-2 gap-8 items-start">
                        
                        {/* LEFT COLUMN: CONFIGURATION */}
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-slate-100 overflow-x-auto">
                                <button onClick={() => setActiveTab('details')} className={`flex-1 py-4 px-4 font-bold text-sm md:text-base whitespace-nowrap transition-colors ${activeTab === 'details' ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}>1. Details</button>
                                <button onClick={() => setActiveTab('style')} className={`flex-1 py-4 px-4 font-bold text-sm md:text-base whitespace-nowrap transition-colors ${activeTab === 'style' ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}>2. Style</button>
                                <button onClick={() => setActiveTab('registry')} className={`flex-1 py-4 px-4 font-bold text-sm md:text-base whitespace-nowrap transition-colors ${activeTab === 'registry' ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}>3. Registry & More</button>
                            </div>

                            <div className="p-6 md:p-8 min-h-[400px]">
                                {/* TAB 1: DETAILS */}
                                {activeTab === 'details' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div>
                                            <label className="font-bold text-slate-700 block mb-2">Baby Name (or Placeholder)</label>
                                            <input type="text" value={setupData.babyName} onChange={e => setSetupData({...setupData, babyName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition" placeholder="e.g. Baby Smith"/>
                                        </div>
                                        <div>
                                            <label className="font-bold text-slate-700 block mb-2">Parent Name(s)</label>
                                            <input type="text" value={setupData.parentNames} onChange={e => setSetupData({...setupData, parentNames: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition" placeholder="e.g. Mary & Joe"/>
                                            <p className="text-xs text-slate-400 mt-1">Shown on the invite link.</p>
                                        </div>
                                        <div>
                                            <label className="font-bold text-slate-700 block mb-2">Due Date</label>
                                            <input type="date" value={setupData.dueDate} onChange={e => setSetupData({...setupData, dueDate: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition"/>
                                        </div>
                                        
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <label className="flex items-center gap-3 font-bold text-slate-700 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={setupData.knowGender} 
                                                    onChange={e => setSetupData({...setupData, knowGender: e.target.checked})}
                                                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                                                />
                                                <span>We already know the gender</span>
                                            </label>
                                            <p className="text-xs text-slate-500 mt-1 ml-8">If checked, the "Guess Gender" option will be hidden for guests.</p>
                                        </div>

                                        <div>
                                            <label className="font-bold text-slate-700 block mb-2">Custom Questions (Optional)</label>
                                            <p className="text-xs text-slate-500 mb-3">Add up to 3 fun questions (e.g., "Mom's nose or Dad's?").</p>
                                            <div className="space-y-3">
                                                {setupData.customQuestions.map((q, i) => (
                                                    <input 
                                                        key={i}
                                                        type="text" 
                                                        value={q} 
                                                        onChange={e => {
                                                            const newQs = [...setupData.customQuestions];
                                                            newQs[i] = e.target.value;
                                                            setSetupData({...setupData, customQuestions: newQs});
                                                        }} 
                                                        className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition" 
                                                        placeholder={`Question #${i+1} (e.g. Will baby arrive early?)`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <button onClick={() => setActiveTab('style')} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4">Next: Choose Style</button>
                                    </div>
                                )}

                                {/* TAB 2: STYLE */}
                                {activeTab === 'style' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <h3 className="font-bold text-slate-700">Choose a Theme</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(THEMES).map(([k, v]) => (
                                                <button 
                                                    key={k} 
                                                    onClick={() => setSetupData({...setupData, theme: k as ThemeKey})} 
                                                    className={`relative p-3 rounded-xl border-2 transition-all text-left group overflow-hidden ${setupData.theme === k ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-100 hover:border-slate-300'}`}
                                                >
                                                    <div className={`h-16 w-full rounded-lg mb-2 ${v.bg} border border-slate-100`}></div>
                                                    <span className="text-sm font-bold text-slate-700">{v.name}</span>
                                                    {setupData.theme === k && <div className="absolute top-2 right-2 bg-slate-900 text-white rounded-full p-1"><CheckCircle size={12}/></div>}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => setActiveTab('registry')} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4">Next: Registry & More</button>
                                    </div>
                                )}

                                {/* TAB 3: REGISTRY & EXTRAS */}
                                {activeTab === 'registry' && (
                                    <div className="space-y-8 animate-fade-in">
                                        {/* Amazon Promo Block */}
                                        <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-orange-200 text-orange-800 text-[10px] font-bold px-2 py-1 rounded-bl">SPONSORED</div>
                                            <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-2"><Gift size={18}/> Need a Registry?</h3>
                                            <p className="text-sm text-orange-800 mb-3">Prime members get a <strong>Free Welcome Box ($35 value)</strong> + 15% completion discount.</p>
                                            <a href="https://www.amazon.com/baby-reg?tag=secretsanmat-20" target="_blank" className="block w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-center rounded-lg text-sm font-bold transition-colors">Create Free Amazon Registry</a>
                                        </div>

                                        <div>
                                            <label className="font-bold text-slate-700 block mb-2">Registry Link (Optional)</label>
                                            <input type="text" value={setupData.registryLink} onChange={e => setSetupData({...setupData, registryLink: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition" placeholder="Paste your registry link here..."/>
                                        </div>

                                        <div>
                                            <label className="font-bold text-slate-700 block mb-2">Diaper Fund Link (Optional)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-4 text-slate-400" size={18}/>
                                                <input type="text" value={setupData.diaperFundLink} onChange={e => setSetupData({...setupData, diaperFundLink: e.target.value})} className="w-full p-4 pl-10 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 outline-none transition" placeholder="Venmo, CashApp, or PayPal link"/>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">Guests can click this to send cash gifts directly.</p>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-xs text-slate-400 mb-4 text-center">By creating a pool, you agree to our Terms. We may earn a commission from affiliate links.</p>
                                            <button onClick={handleCreate} disabled={isCreating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-100 transition-all transform hover:-translate-y-1 flex justify-center gap-2">
                                                {isCreating ? <Loader2 className="animate-spin"/> : <PlusCircle />} Create My Baby Pool
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: LIVE PREVIEW */}
                        <div className="sticky top-8">
                            <div className="text-center mb-4">
                                <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Live Preview</span>
                            </div>
                            
                            {/* Phone Frame */}
                            <div className={`relative mx-auto max-w-[360px] rounded-[2.5rem] border-8 border-slate-900 bg-slate-900 shadow-2xl overflow-hidden`}>
                                {/* Phone Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-900 rounded-b-xl z-20"></div>
                                
                                {/* Screen Content */}
                                <div className={`h-[650px] w-full bg-white overflow-y-auto no-scrollbar ${previewTheme.bg} relative`}>
                                    
                                    {/* Theme Header */}
                                    <div className={`${previewTheme.primary} pt-12 pb-8 px-6 text-center text-white relative rounded-b-[2rem] shadow-sm`}>
                                        <h2 className="text-2xl font-black font-serif leading-tight mb-1">
                                            {setupData.babyName || "Baby Name"}
                                        </h2>
                                        {setupData.parentNames && (
                                            <p className="text-xs font-medium opacity-90 mb-3">Celebrating {setupData.parentNames}</p>
                                        )}
                                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                                            <Calendar size={12}/> Due: {setupData.dueDate || "Dec 25"}
                                        </div>
                                    </div>

                                    {/* Preview Body */}
                                    <div className="p-4 space-y-4">
                                        {/* Guess Stats Mockup */}
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Total Guesses</p>
                                                <p className="text-xl font-black text-slate-800">0</p>
                                            </div>
                                            <div className={`h-10 w-10 rounded-full ${previewTheme.secondary} flex items-center justify-center ${previewTheme.accent}`}>
                                                <User size={20}/>
                                            </div>
                                        </div>

                                        {/* Registry Preview */}
                                        {(setupData.registryLink || setupData.diaperFundLink) && (
                                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2"><Gift size={14}/> Registry & Gifts</h4>
                                                <div className="space-y-2">
                                                    {setupData.registryLink && <div className="h-8 w-full bg-slate-100 rounded-lg animate-pulse"></div>}
                                                    {setupData.diaperFundLink && <div className="h-8 w-full bg-slate-100 rounded-lg animate-pulse"></div>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Custom Question Preview */}
                                        {setupData.customQuestions[0] && (
                                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2"><HelpCircle size={14}/> Fun Predictions</h4>
                                                <p className="text-xs text-slate-500 italic">{setupData.customQuestions[0]}</p>
                                            </div>
                                        )}

                                        {/* Leaderboard Placeholder */}
                                        <div className="space-y-2">
                                            <h4 className={`text-xs font-bold uppercase tracking-wider ${previewTheme.text}`}>Recent Guesses</h4>
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="bg-white/60 p-3 rounded-xl border border-white/50 flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full ${previewTheme.secondary} flex items-center justify-center text-xs font-bold ${previewTheme.accent}`}>{String.fromCharCode(64+i)}</div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="h-3 w-20 bg-slate-200 rounded-full"></div>
                                                        <div className="h-2 w-12 bg-slate-100 rounded-full"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Fab Button Mockup */}
                                    <div className={`absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg ${previewTheme.primary} flex items-center justify-center text-white`}>
                                        <PlusCircle size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // -------------------- POOL DASHBOARD (Existing Logic Refined) --------------------
    const t = THEMES[pool.theme as ThemeKey] || THEMES.sage;
    const isCompleted = pool.status === 'completed';
    const sortedGuesses = isCompleted && pool.result 
        ? [...pool.guesses].map(g => ({ ...g, score: calculateScore(g, pool.result!) })).sort((a,b) => (b.score || 0) - (a.score || 0))
        : [...pool.guesses].reverse(); 

    return (
        <div className={`min-h-screen font-sans ${t.bg}`}>
            <Header />
            <div className="max-w-3xl mx-auto p-4 pb-20">
                
                {/* HERO HEADER */}
                <div className={`bg-white rounded-3xl shadow-xl overflow-hidden mb-6 border-b-8 ${t.border.replace('border', 'border-b')}`} style={{ borderColor: 'currentColor' }}>
                    <div className={`${t.primary} p-8 text-center text-white relative overflow-hidden`}>
                        {pool.theme === 'midnight' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>}
                        <div className="relative z-10">
                            <h1 className="text-4xl md:text-6xl font-black font-serif mb-2 drop-shadow-md">{pool.babyName}</h1>
                            {pool.parentNames && <p className="text-white/80 font-medium text-lg mb-4">Celebrating {pool.parentNames}</p>}
                            
                            <div className="flex flex-wrap justify-center gap-3 mt-4">
                                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1 text-sm font-bold"><Calendar size={14}/> Due: {pool.dueDate}</span>
                                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1 text-sm font-bold"><User size={14}/> {pool.guesses.length} Guesses</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* ADMIN PANEL */}
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

                {/* COUNTDOWN (Only if active) */}
                {!isCompleted && <PoolCountdown dueDate={pool.dueDate} theme={t} />}

                {/* ADMIN - PERSONAL LINKS GENERATOR (Existing code kept) */}
                {adminMode && !isCompleted && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 animate-fade-in">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Share2 size={20} className={t.accent}/> Invite Guests with Personal Links
                        </h3>
                        <div className="flex gap-2 mb-6">
                            <input 
                                type="text" 
                                placeholder="Enter guest name (e.g. Grandma)" 
                                value={newInviteeName}
                                onChange={e => setNewInviteeName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addInvitee()}
                                className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={addInvitee} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-900">Add</button>
                        </div>
                        <div className="space-y-2">
                            {invitees.map(invitee => (
                                <div key={invitee.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="font-bold text-slate-700">{invitee.name}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => copyLink(getPersonalLink(invitee.name))} className="p-2 bg-white border hover:bg-slate-100 rounded text-slate-600"><Copy size={16} /></button>
                                        <button onClick={() => shareWhatsApp(invitee.name)} className="p-2 bg-green-500 hover:bg-green-600 rounded text-white"><MessageCircle size={16} /></button>
                                        <button onClick={() => removeInvitee(invitee.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RESULT CARD (IF BORN) */}
                {isCompleted && pool.result && (
                    <div className={`bg-white rounded-3xl p-8 shadow-lg border-4 ${t.border} mb-8 text-center relative overflow-hidden animate-fade-in`}>
                        <div className={`absolute top-0 left-0 w-full h-2 ${t.primary}`}></div>
                        <h2 className={`text-2xl font-bold ${t.text} font-serif mb-6`}>It's Official! Welcome {pool.result.actualName}!</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-400 uppercase font-bold">Date/Time</div><div className="font-bold text-slate-700">{pool.result.date} @ {pool.result.time}</div></div>
                            <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-400 uppercase font-bold">Stats</div><div className="font-bold text-slate-700">{pool.result.weightLbs}lb {pool.result.weightOz}oz • {pool.result.length}"</div></div>
                            <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-400 uppercase font-bold">Features</div><div className="font-bold text-slate-700">{pool.result.hairColor} Hair • {pool.result.eyeColor} Eyes</div></div>
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
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input type="text" placeholder="Your Name" value={newGuess.guesserName} onChange={e => setNewGuess({...newGuess, guesserName: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50"/>
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input type="date" value={newGuess.date} onChange={e => setNewGuess({...newGuess, date: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="relative">
                                <Clock className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input type="time" value={newGuess.time} onChange={e => setNewGuess({...newGuess, time: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50"/>
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 flex items-center bg-slate-50 border rounded-xl px-3">
                                    <Scale size={18} className="text-slate-400 mr-2"/>
                                    <input type="number" value={newGuess.weightLbs} onChange={e => setNewGuess({...newGuess, weightLbs: parseInt(e.target.value)})} className="w-full p-3 bg-transparent outline-none" placeholder="Lbs"/>
                                    <span className="text-xs font-bold text-slate-400">lbs</span>
                                </div>
                                <div className="flex-1 flex items-center bg-slate-50 border rounded-xl px-3">
                                    <input type="number" value={newGuess.weightOz} onChange={e => setNewGuess({...newGuess, weightOz: parseInt(e.target.value)})} className="w-full p-3 bg-transparent outline-none" placeholder="Oz"/>
                                    <span className="text-xs font-bold text-slate-400">oz</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="relative">
                                <Ruler className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input type="number" value={newGuess.length} onChange={e => setNewGuess({...newGuess, length: parseFloat(e.target.value)})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50" placeholder="Length (inches)"/>
                            </div>
                            <div className="relative">
                                <Scissors className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <select value={newGuess.hairColor} onChange={e => setNewGuess({...newGuess, hairColor: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50 appearance-none">
                                    {HAIR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <Eye className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <select value={newGuess.eyeColor} onChange={e => setNewGuess({...newGuess, eyeColor: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50 appearance-none">
                                    {EYE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {!pool.knowGender && (
                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-400 block mb-1">Gender Guess</label>
                                <div className="flex gap-3">
                                    {['Boy', 'Girl', 'Surprise'].map(g => (
                                        <button key={g} onClick={() => setNewGuess({...newGuess, gender: g})} className={`flex-1 py-2 rounded-lg border font-bold text-sm transition-all ${newGuess.gender === g ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{g}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <input type="text" placeholder="Suggested Name (Optional)" value={newGuess.suggestedName} onChange={e => setNewGuess({...newGuess, suggestedName: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 mb-4"/>

                        {/* CUSTOM QUESTIONS */}
                        {pool.customQuestions && pool.customQuestions.length > 0 && (
                            <div className="mb-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm"><HelpCircle size={16}/> Bonus Predictions</h4>
                                {pool.customQuestions.map((q, i) => (
                                    <div key={i}>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">{q}</label>
                                        <input 
                                            type="text" 
                                            value={newGuess.customAnswers?.[i] || ''} 
                                            onChange={e => {
                                                const answers = { ...newGuess.customAnswers, [i]: e.target.value };
                                                setNewGuess({ ...newGuess, customAnswers: answers });
                                            }}
                                            className="w-full p-2 border rounded-lg bg-white text-sm"
                                            placeholder="Your answer..."
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button onClick={handleGuessSubmit} disabled={isSubmitting} className={`w-full ${t.primary} hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-md transition-all transform active:scale-95`}>
                            {isSubmitting ? 'Submitting...' : 'Submit Guess'}
                        </button>
                    </div>
                )}

                {/* LEADERBOARD */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 px-2 flex items-center gap-2"><Trophy size={18}/> {isCompleted ? 'Final Results' : 'Recent Guesses'}</h3>
                    {sortedGuesses.map((g, i) => (
                        <div key={g.id} className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isCompleted && i===0 ? 'border-yellow-400 bg-yellow-50' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-4 w-full">
                                {isCompleted && <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold ${i===0?'bg-yellow-400 text-white':'bg-slate-100 text-slate-500'}`}>{i+1}</div>}
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 flex justify-between">
                                        <span className="truncate">{g.guesserName}</span>
                                        {isCompleted && <span className="text-slate-600 font-black">{g.score}pts</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-1">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{g.date}</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{g.weightLbs}lb {g.weightOz}oz</span>
                                        {g.suggestedName && <span className="bg-slate-100 px-2 py-0.5 rounded">"{g.suggestedName}"</span>}
                                        {!pool.knowGender && <span className="bg-slate-100 px-2 py-0.5 rounded">{g.gender}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {sortedGuesses.length === 0 && <div className="text-center text-slate-400 py-8">No guesses yet. Be the first!</div>}
                </div>

                {/* GIFTS & REGISTRY (IF CONFIGURED) */}
                {(pool.registryLink || pool.diaperFundLink) && (
                    <div className={`mt-12 p-6 bg-white rounded-2xl border-2 ${t.border} shadow-sm`}>
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Gift size={20} className="text-orange-500"/> Registry & Gifts</h3>
                        <p className="text-slate-600 text-sm mb-4">Want to send a gift?</p>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                            {pool.registryLink && (
                                <a href={pool.registryLink} target="_blank" className="flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-900 transition-colors text-sm">
                                    <Gift size={16}/> View Registry
                                </a>
                            )}
                            {pool.diaperFundLink && (
                                <a href={pool.diaperFundLink} target="_blank" className="flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-600 transition-colors text-sm">
                                    <DollarSign size={16}/> Diaper Fund
                                </a>
                            )}
                        </div>
                    </div>
                )}

                <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />
            </div>

            {/* ADMIN BIRTH DECLARATION MODAL */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full overflow-y-auto max-h-[90vh]">
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
                            <input type="number" placeholder="Length (inches)" value={birthData.length} onChange={e => setBirthData({...birthData, length: parseFloat(e.target.value)})} className="w-full p-3 border rounded-xl"/>
                            <div className="grid grid-cols-2 gap-3">
                                <select value={birthData.hairColor} onChange={e => setBirthData({...birthData, hairColor: e.target.value})} className="w-full p-3 border rounded-xl">
                                    <option value="">Hair Color</option>{HAIR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={birthData.eyeColor} onChange={e => setBirthData({...birthData, eyeColor: e.target.value})} className="w-full p-3 border rounded-xl">
                                    <option value="">Eye Color</option>{EYE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
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