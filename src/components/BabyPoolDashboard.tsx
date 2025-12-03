
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Calendar, Scale, Clock, User, Trophy, Share2, Copy, Baby, 
    PlusCircle, CheckCircle, Instagram, Gift, Loader2, Lock, 
    MessageCircle, Trash2, DollarSign, Ruler, Scissors, Eye, 
    HelpCircle, BarChart3, Bookmark, Sparkles, X
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { getPool, submitGuess, declareBirth } from '../services/babyPoolService';
import type { BabyPool, BabyGuess } from '../types';
import confetti from 'canvas-confetti';
import { THEMES, ThemeKey, AMAZON_CONFIG, detectCountry } from './BabyPoolGenerator';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIR_COLORS = ['Bald/None', 'Blonde', 'Brown', 'Black', 'Red', 'Strawberry Blonde'];
const EYE_COLORS = ['Blue', 'Brown', 'Green', 'Hazel', 'Grey', 'Violet'];

// Short link service (using SecretSantaMatch)
const SHORT_LINK_BASE = 'https://secretsantamatch.com/s/';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Scoring logic
const calculateScore = (guess: BabyGuess, actual: NonNullable<BabyPool['result']>, pool: BabyPool) => {
    let score = 0;
    const fields = pool.includeFields || { time: true, weight: true, length: true, hair: true, eye: true, gender: true };

    // Date: 50 pts max, -2 per day off
    const gDate = new Date(guess.date).getTime();
    const aDate = new Date(actual.date).getTime();
    const daysDiff = Math.abs(gDate - aDate) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 50 - (daysDiff * 2)); 

    // Weight: 50 pts max, -3 per oz off
    if (fields.weight) {
        const gTotalOz = (guess.weightLbs * 16) + guess.weightOz;
        const aTotalOz = (actual.weightLbs * 16) + actual.weightOz;
        const ozDiff = Math.abs(gTotalOz - aTotalOz);
        score += Math.max(0, 50 - (ozDiff * 3)); 
    }

    // Time: 30 pts max, -1 per 10 mins off
    if (fields.time && guess.time && actual.time) {
        const gTime = new Date(`2000-01-01T${guess.time}`).getTime();
        const aTime = new Date(`2000-01-01T${actual.time}`).getTime();
        const minsDiff = Math.abs(gTime - aTime) / (1000 * 60);
        score += Math.max(0, 30 - Math.floor(minsDiff / 10));
    }

    // Length: 30 pts max, -5 per inch off
    if (fields.length && guess.length && actual.length) {
        score += Math.max(0, 30 - (Math.abs(guess.length - actual.length) * 5));
    }

    if (fields.gender && guess.gender === actual.gender) score += 15;
    if (fields.hair && guess.hairColor && actual.hairColor && guess.hairColor === actual.hairColor) score += 10;
    if (fields.eye && guess.eyeColor && actual.eyeColor && guess.eyeColor === actual.eyeColor) score += 10;
    
    // Name Match
    if (actual.actualName && guess.suggestedName && actual.actualName.toLowerCase().trim() === guess.suggestedName.toLowerCase().trim()) score += 50;

    return Math.round(score);
};

// Generate short link
const generateShortLink = async (longUrl: string): Promise<string> => {
    try {
        const encoded = btoa(longUrl).replace(/[+/=]/g, (c) => 
            c === '+' ? '-' : c === '/' ? '_' : ''
        ).substring(0, 8);
        return `${SHORT_LINK_BASE}bp-${encoded}`;
    } catch {
        return longUrl;
    }
};

// Format date nicely
const formatDate = (dateStr: string): string => {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        });
    } catch {
        return dateStr;
    }
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

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

    if (!timeLeft) return (
        <div className="text-center font-bold text-slate-500 mb-6 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <Baby className="inline mr-2" size={20}/>
            Baby is due any day now (or already here)!
        </div>
    );

    return (
        <div className={`mb-8 p-6 rounded-2xl ${theme.secondary} border ${theme.border} text-center shadow-sm`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme.accent}`}>🍼 Baby Arrives In</p>
            <div className="flex justify-center gap-3 md:gap-6">
                {Object.entries(timeLeft).map(([unit, value]) => (
                    <div key={unit} className="flex flex-col bg-white/50 px-4 py-2 rounded-xl">
                        <span className={`text-2xl md:text-4xl font-black ${theme.text}`}>{String(value).padStart(2, '0')}</span>
                        <span className="text-[10px] md:text-xs text-slate-500 uppercase font-medium">{unit}</span>
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">
                <Bookmark className="inline mr-1" size={12}/>
                Bookmark this page to check back for updates!
            </p>
        </div>
    );
};

// --- Group Stats Scorecard ---
const GroupStatsCard: React.FC<{ guesses: BabyGuess[], theme: any, fields: any }> = ({ guesses, theme, fields }) => {
    if (guesses.length < 3) return null;

    // Calculate stats
    const genderVotes = guesses.reduce((acc, g) => {
        if (g.gender && g.gender !== 'Surprise') {
            acc[g.gender] = (acc[g.gender] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const totalGenderVotes = Object.values(genderVotes).reduce((a, b) => a + b, 0);

    // Most popular date
    const dateCounts = guesses.reduce((acc, g) => {
        acc[g.date] = (acc[g.date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const popularDate = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0];

    // Average weight
    const avgWeight = guesses.reduce((sum, g) => sum + (g.weightLbs * 16 + g.weightOz), 0) / guesses.length;
    const avgLbs = Math.floor(avgWeight / 16);
    const avgOz = Math.round(avgWeight % 16);

    // Top name guesses
    const nameGuesses = guesses.filter(g => g.suggestedName).reduce((acc, g) => {
        const name = g.suggestedName!.toLowerCase().trim();
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topNames = Object.entries(nameGuesses).sort((a, b) => b[1] - a[1]).slice(0, 3);

    // Time distribution
    const timeSlots = { 'Morning (6am-12pm)': 0, 'Afternoon (12pm-6pm)': 0, 'Evening (6pm-12am)': 0, 'Night (12am-6am)': 0 };
    guesses.forEach(g => {
        if (g.time) {
            const hour = parseInt(g.time.split(':')[0]);
            if (hour >= 6 && hour < 12) timeSlots['Morning (6am-12pm)']++;
            else if (hour >= 12 && hour < 18) timeSlots['Afternoon (12pm-6pm)']++;
            else if (hour >= 18) timeSlots['Evening (6pm-12am)']++;
            else timeSlots['Night (12am-6am)']++;
        }
    });
    const popularTimeSlot = Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className={theme.accent}/> 
                📊 The Predictions Are In
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender Distribution */}
                {fields.gender && totalGenderVotes > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">👶 Gender Predictions</h4>
                        <div className="space-y-2">
                            {Object.entries(genderVotes).map(([gender, count]) => {
                                const pct = Math.round((count / totalGenderVotes) * 100);
                                return (
                                    <div key={gender}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{gender}</span>
                                            <span className="text-slate-500">{pct}% ({count})</span>
                                        </div>
                                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${gender === 'Boy' ? 'bg-blue-400' : 'bg-pink-400'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Most Popular Date */}
                {popularDate && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">📅 Most Predicted Date</h4>
                        <p className="text-2xl font-black text-slate-800">{formatDate(popularDate[0])}</p>
                        <p className="text-sm text-slate-500">{popularDate[1]} {popularDate[1] === 1 ? 'guess' : 'guesses'}</p>
                    </div>
                )}

                {/* Average Weight */}
                {fields.weight && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">⚖️ Average Weight Guess</h4>
                        <p className="text-2xl font-black text-slate-800">{avgLbs} lbs {avgOz} oz</p>
                    </div>
                )}

                {/* Popular Time Slot */}
                {fields.time && popularTimeSlot[1] > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">🕐 Most Popular Time</h4>
                        <p className="text-lg font-bold text-slate-800">{popularTimeSlot[0]}</p>
                        <p className="text-sm text-slate-500">{Math.round((popularTimeSlot[1] / guesses.filter(g => g.time).length) * 100)}% of guesses</p>
                    </div>
                )}

                {/* Top Names */}
                {topNames.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl md:col-span-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">📝 Top Name Guesses</h4>
                        <div className="flex flex-wrap gap-2">
                            {topNames.map(([name, count], i) => (
                                <span key={name} className={`px-3 py-1 rounded-full text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                                    {name.charAt(0).toUpperCase() + name.slice(1)} ({count})
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- My Prediction Card (Shareable) ---
const MyPredictionCard: React.FC<{ 
    guess: BabyGuess, 
    babyName: string, 
    theme: any,
    rank?: number,
    totalGuesses?: number 
}> = ({ guess, babyName, theme, rank, totalGuesses }) => {
    const [copied, setCopied] = useState(false);

    const shareText = `🔮 My Baby Pool Prediction for ${babyName}:\n📅 ${formatDate(guess.date)}${guess.time ? ` at ${guess.time}` : ''}\n⚖️ ${guess.weightLbs}lb ${guess.weightOz}oz\n👶 ${guess.gender}\n\nMake your guess too!`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `My ${babyName} Prediction`,
                    text: shareText,
                    url: window.location.href
                });
            } catch (err) {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(shareText + '\n' + window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={`bg-white rounded-2xl shadow-lg border-2 ${theme.border} p-6 mb-8 relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-full h-1 ${theme.primary}`}></div>
            
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles size={20} className={theme.accent}/> 
                    Your Prediction
                </h3>
                {rank && totalGuesses && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${rank === 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`} of {totalGuesses}
                    </span>
                )}
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 mb-4">
                <p className="text-sm text-slate-500 mb-2">Predicted for <strong className="text-slate-800">{babyName}</strong></p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-slate-400">📅 Date:</span>
                        <p className="font-bold text-slate-800">{formatDate(guess.date)}</p>
                    </div>
                    {guess.time && (
                        <div>
                            <span className="text-slate-400">🕐 Time:</span>
                            <p className="font-bold text-slate-800">{guess.time}</p>
                        </div>
                    )}
                    <div>
                        <span className="text-slate-400">⚖️ Weight:</span>
                        <p className="font-bold text-slate-800">{guess.weightLbs}lb {guess.weightOz}oz</p>
                    </div>
                    <div>
                        <span className="text-slate-400">👶 Gender:</span>
                        <p className="font-bold text-slate-800">{guess.gender}</p>
                    </div>
                    {guess.suggestedName && (
                        <div className="col-span-2">
                            <span className="text-slate-400">✨ Name Guess:</span>
                            <p className="font-bold text-slate-800">{guess.suggestedName}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={handleShare}
                    className={`flex-1 ${theme.primary} text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all`}
                >
                    {copied ? <CheckCircle size={18}/> : <Share2 size={18}/>}
                    {copied ? 'Copied!' : 'Share My Prediction'}
                </button>
            </div>

            <p className="text-xs text-center text-slate-400 mt-3">
                <Bookmark className="inline mr-1" size={12}/>
                Bookmark this page to see if you won!
            </p>
        </div>
    );
};

// --- Add to Home Screen Prompt ---
const AddToHomePrompt: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    }, []);

    return (
        <div className="fixed bottom-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-40 animate-slide-up">
            <button onClick={onDismiss} className="absolute top-2 right-2 text-slate-400 hover:text-white">
                <X size={20}/>
            </button>
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Baby size={24}/>
                </div>
                <div className="flex-1">
                    <p className="font-bold text-sm">Never miss the results!</p>
                    <p className="text-xs text-slate-300">
                        {isIOS 
                            ? "Tap Share → 'Add to Home Screen'" 
                            : "Tap ⋮ → 'Add to Home Screen'"}
                    </p>
                </div>
                <Bookmark className="text-emerald-400 flex-shrink-0" size={24}/>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BabyPoolDashboard: React.FC = () => {
    const [pool, setPool] = useState<BabyPool | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [country] = useState(detectCountry());

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
    const [mySubmittedGuess, setMySubmittedGuess] = useState<BabyGuess | null>(null);

    // Admin State
    const [adminMode, setAdminMode] = useState(false);
    const [birthData, setBirthData] = useState({ date: '', time: '', weightLbs: 7, weightOz: 5, length: 20, hairColor: '', eyeColor: '', gender: '', actualName: '', photoLink: '' });
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [invitees, setInvitees] = useState<Invitee[]>([]);
    const [newInviteeName, setNewInviteeName] = useState('');
    const [shortLink, setShortLink] = useState<string>('');

    // UI State
    const [showHomePrompt, setShowHomePrompt] = useState(false);

    // Check if user has dismissed home prompt before
    useEffect(() => {
        const dismissed = localStorage.getItem('bp_home_prompt_dismissed');
        if (!dismissed && pool && !adminMode) {
            setTimeout(() => setShowHomePrompt(true), 5000);
        }
    }, [pool, adminMode]);

    const dismissHomePrompt = () => {
        setShowHomePrompt(false);
        localStorage.setItem('bp_home_prompt_dismissed', 'true');
    };

    // Load pool from URL hash
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
            
            // Check if user already guessed (stored in localStorage)
            const myGuessId = localStorage.getItem(`bp_my_guess_${poolId}`);
            if (myGuessId) {
                setHasGuessed(true);
            }
        } else {
            // No pool ID, redirect to generator
            window.location.href = '/baby-pool/create';
        }
    }, []);

    // Save invitees to localStorage
    useEffect(() => {
        if (pool && adminMode) {
            localStorage.setItem(`bp_invitees_${pool.poolId}`, JSON.stringify(invitees));
        }
    }, [invitees, pool, adminMode]);

    // Generate short link when pool is loaded
    useEffect(() => {
        if (pool) {
            const guestUrl = `${window.location.origin}/baby-pool#poolId=${pool.poolId}`;
            generateShortLink(guestUrl).then(setShortLink);
        }
    }, [pool]);

    const loadPool = async (id: string, key?: string | null) => {
        try {
            const data = await getPool(id, key);
            setPool(data);
            
            // Check if user's guess is in the pool
            const myGuessId = localStorage.getItem(`bp_my_guess_${id}`);
            if (myGuessId) {
                const myGuess = data.guesses.find(g => g.id === myGuessId);
                if (myGuess) {
                    setMySubmittedGuess(myGuess);
                    setHasGuessed(true);
                }
            }
            
            if (data.result) {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#f59e0b', '#3b82f6'] });
            }
        } catch (err) {
            setError("Could not load baby pool. Check the link and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGuessSubmit = async () => {
        if (!pool || !newGuess.guesserName || !newGuess.date) return alert("Please fill in required fields!");
        setIsSubmitting(true);
        try {
            const submission = { ...newGuess };
            const result = await submitGuess(pool.poolId, submission);
            
            // Store guess ID in localStorage
            if (result?.id) {
                localStorage.setItem(`bp_my_guess_${pool.poolId}`, result.id);
            }
            
            await loadPool(pool.poolId);
            setHasGuessed(true);
            setMySubmittedGuess({ ...submission, id: result?.id || Date.now().toString() } as BabyGuess);
            
            trackEvent('guess_submitted', { poolId: pool.poolId });
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
            trackEvent('birth_declared', { poolId: pool.poolId });
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
        return `${window.location.origin}/baby-pool#poolId=${pool?.poolId}&guestName=${encodeURIComponent(name)}`;
    };

    const copyLink = (text: string) => {
        navigator.clipboard.writeText(text).then(() => alert("Link copied to clipboard!"));
    };

    const shareWhatsApp = (name: string) => {
        const link = getPersonalLink(name);
        const text = `Hi ${name}! 🍼 Join the Baby Pool for ${pool?.babyName}. Guess the due date, weight & more!\n\nMake your prediction here: ${link}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Calculate user's ranking
    const myRanking = useMemo(() => {
        if (!pool || !mySubmittedGuess) return null;
        const guessIndex = pool.guesses.findIndex(g => g.id === mySubmittedGuess.id);
        if (guessIndex === -1) return null;
        return {
            rank: pool.guesses.length - guessIndex,
            total: pool.guesses.length
        };
    }, [pool, mySubmittedGuess]);

    // Loading state
    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin w-10 h-10 text-emerald-600 mb-4"/>
            <p className="text-slate-500">Loading your baby pool...</p>
        </div>
    );

    // Error state
    if (error || !pool) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="text-red-500" size={32}/>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Pool Not Found</h2>
                <p className="text-slate-600 mb-4">{error || "This baby pool doesn't exist or the link is incorrect."}</p>
                <a href="/baby-pool.html" className="inline-block bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 transition-colors">
                    Create a New Pool
                </a>
            </div>
        </div>
    );

    // ============================================================================
    // RENDER POOL DASHBOARD
    // ============================================================================
    
    const t = THEMES[pool.theme as ThemeKey] || THEMES.sage;
    const isCompleted = pool.status === 'completed';
    const sortedGuesses = isCompleted && pool.result 
        ? [...pool.guesses].map(g => ({ ...g, score: calculateScore(g, pool.result!, pool) })).sort((a,b) => (b.score || 0) - (a.score || 0))
        : [...pool.guesses].reverse(); 
    
    const fields = pool.includeFields || { time: true, weight: true, length: true, hair: true, eye: true, gender: true };

    return (
        <div className={`min-h-screen font-sans ${t.bg}`}>
            <Header />
            <div className="max-w-3xl mx-auto p-4 pb-20">
                
                {/* HERO HEADER */}
                <div className={`bg-white rounded-3xl shadow-xl overflow-hidden mb-6 border-b-8 ${t.border.replace('border', 'border-b')}`}>
                    <div className={`${t.primary} p-8 text-center text-white relative overflow-hidden`}>
                        {pool.theme === 'midnight' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>}
                        {pool.theme === 'confetti' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-20"></div>}
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
                                    <Lock size={16}/> ORGANIZER MODE
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => {
                                        const url = shortLink || `${window.location.origin}/baby-pool#poolId=${pool.poolId}`;
                                        navigator.clipboard.writeText(url);
                                        alert("Share link copied! Send this to friends & family.");
                                    }} className="flex-1 md:flex-none bg-white border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-100 flex items-center gap-2">
                                        <Copy size={14}/> Copy Share Link
                                    </button>
                                    <button onClick={() => setShowAdminModal(true)} className="flex-1 md:flex-none bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 shadow-sm flex items-center gap-2">
                                        <Baby size={14}/> Declare Birth
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* COUNTDOWN (Only if active) */}
                {!isCompleted && <PoolCountdown dueDate={pool.dueDate} theme={t} />}

                {/* MY PREDICTION CARD (if user already guessed) */}
                {hasGuessed && mySubmittedGuess && !isCompleted && (
                    <MyPredictionCard 
                        guess={mySubmittedGuess} 
                        babyName={pool.babyName} 
                        theme={t}
                        rank={myRanking?.rank}
                        totalGuesses={myRanking?.total}
                    />
                )}

                {/* GROUP STATS SCORECARD */}
                {!isCompleted && pool.guesses.length >= 3 && (
                    <GroupStatsCard guesses={pool.guesses} theme={t} fields={fields} />
                )}

                {/* ADMIN - PERSONAL LINKS GENERATOR */}
                {adminMode && !isCompleted && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Share2 size={20} className={t.accent}/> Invite Guests with Personal Links
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Create personalized links for each guest. Their name will be pre-filled!</p>
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
                                        <button onClick={() => copyLink(getPersonalLink(invitee.name))} className="p-2 bg-white border hover:bg-slate-100 rounded text-slate-600" title="Copy Link"><Copy size={16} /></button>
                                        <button onClick={() => shareWhatsApp(invitee.name)} className="p-2 bg-green-500 hover:bg-green-600 rounded text-white" title="WhatsApp"><MessageCircle size={16} /></button>
                                        <button onClick={() => removeInvitee(invitee.id)} className="p-2 text-slate-400 hover:text-red-500" title="Remove"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RESULT CARD (IF BORN) */}
                {isCompleted && pool.result && (
                    <div className={`bg-white rounded-3xl p-8 shadow-lg border-4 ${t.border} mb-8 text-center relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 w-full h-2 ${t.primary}`}></div>
                        <h2 className={`text-2xl font-bold ${t.text} font-serif mb-6`}>🎉 Welcome {pool.result.actualName}!</h2>
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
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
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
                            {fields.time && (
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                    <input type="time" value={newGuess.time} onChange={e => setNewGuess({...newGuess, time: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50"/>
                                </div>
                            )}
                            {fields.weight && (
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1 flex items-center bg-slate-50 border rounded-xl px-3">
                                        <Scale size={18} className="text-slate-400 mr-2"/>
                                        <input type="number" value={newGuess.weightLbs} onChange={e => setNewGuess({...newGuess, weightLbs: parseInt(e.target.value) || 0})} className="w-full p-3 bg-transparent outline-none" placeholder="Lbs"/>
                                        <span className="text-xs font-bold text-slate-400">lbs</span>
                                    </div>
                                    <div className="flex-1 flex items-center bg-slate-50 border rounded-xl px-3">
                                        <input type="number" value={newGuess.weightOz} onChange={e => setNewGuess({...newGuess, weightOz: parseInt(e.target.value) || 0})} className="w-full p-3 bg-transparent outline-none" placeholder="Oz"/>
                                        <span className="text-xs font-bold text-slate-400">oz</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {fields.length && (
                                <div className="relative">
                                    <Ruler className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                    <input type="number" value={newGuess.length} onChange={e => setNewGuess({...newGuess, length: parseFloat(e.target.value) || 0})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50" placeholder="Length (inches)"/>
                                </div>
                            )}
                            {fields.hair && (
                                <div className="relative">
                                    <Scissors className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                    <select value={newGuess.hairColor} onChange={e => setNewGuess({...newGuess, hairColor: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50 appearance-none">
                                        {HAIR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                            {fields.eye && (
                                <div className="relative">
                                    <Eye className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                    <select value={newGuess.eyeColor} onChange={e => setNewGuess({...newGuess, eyeColor: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50 appearance-none">
                                        {EYE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {fields.gender && (
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
                                {isCompleted && <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold ${i===0?'bg-yellow-400 text-white':'bg-slate-100 text-slate-500'}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i+1}</div>}
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 flex justify-between">
                                        <span className="truncate">{g.guesserName}</span>
                                        {isCompleted && <span className="text-slate-600 font-black">{g.score}pts</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-1">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{formatDate(g.date)}</span>
                                        {fields.weight && <span className="bg-slate-100 px-2 py-0.5 rounded">{g.weightLbs}lb {g.weightOz}oz</span>}
                                        {g.suggestedName && <span className="bg-slate-100 px-2 py-0.5 rounded">"{g.suggestedName}"</span>}
                                        {fields.gender && <span className="bg-slate-100 px-2 py-0.5 rounded">{g.gender}</span>}
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
                                <a href={pool.registryLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-900 transition-colors text-sm">
                                    <Gift size={16}/> View Registry
                                </a>
                            )}
                            {pool.diaperFundLink && (
                                <a href={pool.diaperFundLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-600 transition-colors text-sm">
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
                        <h3 className="font-bold text-xl mb-4 text-slate-800">🎉 Baby has arrived!</h3>
                        <div className="space-y-3">
                            <input type="text" placeholder="Baby's Actual Name" value={birthData.actualName} onChange={e => setBirthData({...birthData, actualName: e.target.value})} className="w-full p-3 border rounded-xl"/>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" value={birthData.date} onChange={e => setBirthData({...birthData, date: e.target.value})} className="w-full p-3 border rounded-xl"/>
                                <input type="time" value={birthData.time} onChange={e => setBirthData({...birthData, time: e.target.value})} className="w-full p-3 border rounded-xl"/>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 flex gap-2">
                                    <input type="number" placeholder="Lbs" value={birthData.weightLbs} onChange={e => setBirthData({...birthData, weightLbs: parseInt(e.target.value) || 0})} className="w-full p-3 border rounded-xl"/>
                                    <input type="number" placeholder="Oz" value={birthData.weightOz} onChange={e => setBirthData({...birthData, weightOz: parseInt(e.target.value) || 0})} className="w-full p-3 border rounded-xl"/>
                                </div>
                                <select value={birthData.gender} onChange={e => setBirthData({...birthData, gender: e.target.value})} className="w-full p-3 border rounded-xl">
                                    <option value="">Gender</option><option>Boy</option><option>Girl</option>
                                </select>
                            </div>
                            <input type="number" placeholder="Length (inches)" value={birthData.length} onChange={e => setBirthData({...birthData, length: parseFloat(e.target.value) || 0})} className="w-full p-3 border rounded-xl"/>
                            <div className="grid grid-cols-2 gap-3">
                                <select value={birthData.hairColor} onChange={e => setBirthData({...birthData, hairColor: e.target.value})} className="w-full p-3 border rounded-xl">
                                    <option value="">Hair Color</option>{HAIR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={birthData.eyeColor} onChange={e => setBirthData({...birthData, eyeColor: e.target.value})} className="w-full p-3 border rounded-xl">
                                    <option value="">Eye Color</option>{EYE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <input type="text" placeholder="Photo Link (Instagram/FB/Google Photos)" value={birthData.photoLink} onChange={e => setBirthData({...birthData, photoLink: e.target.value})} className="w-full p-3 border rounded-xl"/>
                            
                            <button onClick={handleBirthDeclare} disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl mt-2 flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Baby size={18}/>}
                                Finalize & Calculate Winner
                            </button>
                            <button onClick={() => setShowAdminModal(false)} className="w-full text-slate-500 py-2">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD TO HOME SCREEN PROMPT */}
            {showHomePrompt && <AddToHomePrompt onDismiss={dismissHomePrompt} />}

            <Footer />
        </div>
    );
};

export default BabyPoolDashboard;
