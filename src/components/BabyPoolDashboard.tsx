import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Calendar, Scale, Clock, User, Trophy, Share2, Copy, Baby, 
    PlusCircle, CheckCircle, Instagram, Gift, Loader2, Lock, 
    MessageCircle, Trash2, DollarSign, Ruler, Scissors, Eye, 
    HelpCircle, BarChart3, Bookmark, Sparkles, X, RefreshCw,
    ExternalLink, Settings, Mail, QrCode, Download, AlertCircle,
    Users, ChevronDown, ChevronUp, Link2, Check, Edit3, Heart,
    Target, Globe
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { getPool, submitGuess, declareBirth } from '../services/babyPoolService';
import type { BabyPool, BabyGuess } from '../types';
import confetti from 'canvas-confetti';
import { THEMES, ThemeKey, AMAZON_CONFIG, detectCountry, UNIT_LABELS, UnitSystem } from './BabyPoolGenerator';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIR_COLORS = ['Bald/None', 'Blonde', 'Brown', 'Black', 'Red', 'Strawberry Blonde'];
const EYE_COLORS = ['Blue', 'Brown', 'Green', 'Hazel', 'Grey', 'Violet'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateScore = (guess: BabyGuess, actual: NonNullable<BabyPool['result']>, pool: BabyPool) => {
    let score = 0;
    const fields = pool.includeFields || { time: true, weight: true, length: true, hair: true, eye: true, gender: true };

    const gDate = new Date(guess.date).getTime();
    const aDate = new Date(actual.date).getTime();
    const daysDiff = Math.abs(gDate - aDate) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 50 - (daysDiff * 2)); 

    if (fields.weight) {
        const gTotalOz = (guess.weightLbs * 16) + guess.weightOz;
        const aTotalOz = (actual.weightLbs * 16) + actual.weightOz;
        const ozDiff = Math.abs(gTotalOz - aTotalOz);
        score += Math.max(0, 50 - (ozDiff * 3)); 
    }

    if (fields.time && guess.time && actual.time) {
        const gTime = new Date(`2000-01-01T${guess.time}`).getTime();
        const aTime = new Date(`2000-01-01T${actual.time}`).getTime();
        const minsDiff = Math.abs(gTime - aTime) / (1000 * 60);
        score += Math.max(0, 30 - Math.floor(minsDiff / 10));
    }

    if (fields.length && guess.length && actual.length) {
        score += Math.max(0, 30 - (Math.abs(guess.length - actual.length) * 5));
    }

    if (fields.gender && guess.gender === actual.gender) score += 15;
    if (fields.hair && guess.hairColor && actual.hairColor && guess.hairColor === actual.hairColor) score += 10;
    if (fields.eye && guess.eyeColor && actual.eyeColor && guess.eyeColor === actual.eyeColor) score += 10;
    
    if (actual.actualName && guess.suggestedName && actual.actualName.toLowerCase().trim() === guess.suggestedName.toLowerCase().trim()) score += 50;

    return Math.round(score);
};

const formatDate = (dateStr: string): string => {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
};

const generateQRCodeUrl = (url: string, size: number = 200): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface Invitee { id: string; name: string; sent?: boolean; }

// --- Progress Bar Component ---
const ProgressBar: React.FC<{ current: number, target: number, theme: any }> = ({ current, target, theme }) => {
    const percentage = Math.min(100, Math.round((current / target) * 100));
    
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Target size={16} className={theme.accent}/> 
                    🎯 {current} of {target} guesses collected!
                </span>
                <span className="text-sm font-bold text-slate-500">{percentage}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${theme.primary} rounded-full transition-all duration-500`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            {percentage >= 100 && (
                <p className="text-xs text-emerald-600 font-medium mt-2 text-center">🎉 Goal reached! Keep sharing to get more guesses!</p>
            )}
        </div>
    );
};

// --- Prize Display Component ---
const PrizeDisplay: React.FC<{ prize: string, theme: any }> = ({ prize, theme }) => {
    if (!prize) return null;
    
    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-200 mb-6 text-center">
            <Trophy className="mx-auto text-amber-500 mb-2" size={28}/>
            <h3 className="font-bold text-amber-900 mb-1">🏆 Winner's Prize</h3>
            <p className="text-amber-800 font-medium">{prize}</p>
        </div>
    );
};

// --- Name Poll Component ---
const NamePollCard: React.FC<{ 
    nameOptions: string[], 
    votes: Record<string, number>,
    onVote: (name: string) => void,
    hasVoted: boolean,
    myVote: string | null,
    theme: any 
}> = ({ nameOptions, votes, onVote, hasVoted, myVote, theme }) => {
    if (!nameOptions || nameOptions.length === 0) return null;
    
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
    
    return (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-5 rounded-2xl border border-pink-200 mb-6">
            <h3 className="font-bold text-pink-900 mb-3 flex items-center gap-2">
                <Heart size={20} className="text-pink-500"/> 💕 Help Pick a Name!
            </h3>
            
            <div className="space-y-2">
                {nameOptions.map((name, i) => {
                    const voteCount = votes[name] || 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const isMyVote = myVote === name;
                    
                    return (
                        <button 
                            key={i}
                            onClick={() => !hasVoted && onVote(name)}
                            disabled={hasVoted}
                            className={`w-full p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                                isMyVote 
                                    ? 'border-pink-400 bg-pink-100' 
                                    : hasVoted 
                                        ? 'border-slate-200 bg-white cursor-default'
                                        : 'border-slate-200 bg-white hover:border-pink-300 cursor-pointer'
                            }`}
                        >
                            {hasVoted && (
                                <div 
                                    className="absolute left-0 top-0 h-full bg-pink-100 transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            )}
                            <div className="relative flex justify-between items-center">
                                <span className="font-medium text-slate-800 flex items-center gap-2">
                                    {!hasVoted && <div className="w-4 h-4 rounded-full border-2 border-pink-300"></div>}
                                    {isMyVote && <CheckCircle size={16} className="text-pink-500"/>}
                                    {name}
                                </span>
                                {hasVoted && (
                                    <span className="text-sm text-pink-700 font-bold">{percentage}%</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
            
            {hasVoted && (
                <p className="text-xs text-pink-600 mt-3 text-center">
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast • Your vote: {myVote}
                </p>
            )}
        </div>
    );
};

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
            <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                <Bookmark size={12}/> Bookmark this page to check back for updates!
            </p>
        </div>
    );
};

// --- Deadline Banner ---
const DeadlineBanner: React.FC<{ deadline: string, isPast: boolean }> = ({ deadline, isPast }) => {
    if (!deadline) return null;
    
    if (isPast) {
        return (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 text-center">
                <Lock className="inline mr-2 text-red-500" size={18}/>
                <span className="font-bold text-red-700">Guessing is closed!</span>
                <p className="text-sm text-red-600 mt-1">The deadline was {formatDate(deadline)}</p>
            </div>
        );
    }
    
    return (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-6 text-center">
            <Clock className="inline mr-2 text-amber-600" size={16}/>
            <span className="text-sm font-medium text-amber-800">
                ⏰ Guessing closes on <strong>{formatDate(deadline)}</strong>
            </span>
        </div>
    );
};

// --- Registry Section for Participants ---
const RegistrySection: React.FC<{ pool: BabyPool, theme: any, country: string }> = ({ pool, theme, country }) => {
    const hasLinks = pool.registryLink || pool.diaperFundLink || (pool.additionalLinks && pool.additionalLinks.length > 0);
    
    if (!hasLinks) return null;
    
    return (
        <div className={`mt-8 p-6 bg-white rounded-2xl border-2 ${theme.border} shadow-sm`}>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Gift size={20} className="text-orange-500"/> 🎁 Want to Send a Gift?
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {pool.registryLink && (
                    <a href={pool.registryLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-900 transition-colors text-sm">
                        <Gift size={16}/> View Baby Registry
                    </a>
                )}
                {pool.diaperFundLink && (
                    <a href={pool.diaperFundLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-600 transition-colors text-sm">
                        <DollarSign size={16}/> Diaper Fund
                    </a>
                )}
            </div>
            
            {pool.additionalLinks && pool.additionalLinks.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                    {pool.additionalLinks.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                            <ExternalLink size={14}/> {link.label}
                        </a>
                    ))}
                </div>
            )}
            
            {/* Affiliate suggestions */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Or shop top baby gifts:</p>
                <div className="flex flex-wrap gap-2">
                    <a href={AMAZON_CONFIG[country]?.link || AMAZON_CONFIG.US.link} target="_blank" rel="noopener" className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 font-medium">
                        🎁 Amazon Baby Registry
                    </a>
                    <a href="https://sugarwish.com?ref=secretsantamatch" target="_blank" rel="noopener" className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full hover:bg-pink-200 font-medium">
                        🍬 Sugarwish Treats
                    </a>
                </div>
            </div>
        </div>
    );
};

// --- Welcome Splash ---
const WelcomeSplash: React.FC<{ guestName: string, babyName: string, parentNames: string, theme: any, onContinue: () => void }> = ({ guestName, babyName, parentNames, theme, onContinue }) => (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full text-center animate-fade-in">
            <div className="text-6xl mb-6">🍼</div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 font-serif mb-2">Hi {guestName}! 👋</h1>
            <p className="text-lg text-slate-600 mb-6">
                {parentNames ? (
                    <><span className="font-semibold text-emerald-700">{parentNames}</span> invited you to join the baby pool for</>
                ) : 'You\'ve been invited to join the baby pool for'}
            </p>
            <div className={`${theme.primary} text-white py-6 px-8 rounded-2xl mb-8 shadow-lg`}>
                <p className="text-white/80 text-sm font-medium mb-1">Guess the arrival of</p>
                <h2 className="text-4xl font-black font-serif">{babyName}</h2>
            </div>
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4">🎯 How it works:</h3>
                <div className="space-y-3 text-left">
                    {['Make your predictions for when baby arrives, weight, gender & more', 'See how your guesses compare to everyone else', 'Come back after baby arrives to see if you won! 🏆'].map((text, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">{i+1}</span>
                            <p className="text-slate-600 text-sm">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={onContinue} className={`w-full ${theme.primary} text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all text-lg flex items-center justify-center gap-2`}>
                Make My Prediction <Sparkles size={20}/>
            </button>
            <p className="text-xs text-slate-400 mt-4">No signup required • Takes 2 minutes • 100% free</p>
        </div>
    </div>
);

// --- What's Winning Section ---
const WhatsWinningCard: React.FC<{ guesses: BabyGuess[], pool: BabyPool, theme: any }> = ({ guesses, pool, theme }) => {
    if (guesses.length < 1) return null;

    const fields = pool.includeFields || { time: true, weight: true, length: true, hair: true, eye: true, gender: true };

    const getMode = (arr: string[]) => {
        const counts: Record<string, number> = {};
        arr.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted[0] || null;
    };

    const getMedian = (arr: number[]) => {
        const sorted = arr.filter(n => !isNaN(n)).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const dates = guesses.map(g => g.date);
    const topDate = getMode(dates);
    
    const genders = guesses.map(g => g.gender).filter(g => g && g !== 'Surprise');
    const topGender = getMode(genders);
    const genderPct = topGender && genders.length > 0 ? Math.round((topGender[1] / genders.length) * 100) : 0;

    const weights = guesses.map(g => g.weightLbs * 16 + g.weightOz);
    const medianWeight = getMedian(weights);
    const medianLbs = Math.floor(medianWeight / 16);
    const medianOz = Math.round(medianWeight % 16);

    const names = guesses.map(g => g.suggestedName?.toLowerCase().trim()).filter(Boolean) as string[];
    const topName = getMode(names);

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-6 mb-8">
            <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-lg">
                <Trophy size={22} className="text-amber-500"/> 🔮 Current Predictions Summary
            </h3>
            <p className="text-amber-700 text-sm mb-4">Based on {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'} so far:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {topDate && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">📅 Top Date</div>
                        <div className="font-black text-slate-800">{formatDate(topDate[0])}</div>
                        <div className="text-xs text-emerald-600 font-medium">{topDate[1]} votes</div>
                    </div>
                )}
                {fields.gender && topGender && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">👶 Gender</div>
                        <div className={`font-black ${topGender[0] === 'Boy' ? 'text-blue-600' : 'text-pink-500'}`}>
                            {topGender[0] === 'Boy' ? '💙' : '💗'} {topGender[0]}
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">{genderPct}% say {topGender[0]}</div>
                    </div>
                )}
                {fields.weight && !isNaN(medianWeight) && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">⚖️ Weight</div>
                        <div className="font-black text-slate-800">{medianLbs}lb {medianOz}oz</div>
                        <div className="text-xs text-slate-500 font-medium">median guess</div>
                    </div>
                )}
                {topName && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">✨ Top Name</div>
                        <div className="font-black text-slate-800 capitalize">{topName[0]}</div>
                        <div className="text-xs text-emerald-600 font-medium">{topName[1]} votes</div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STUNNING Share Modal for Social Sharing ---
const SharePredictionModal: React.FC<{
    guess: BabyGuess,
    babyName: string,
    parentNames: string,
    rank: number,
    totalGuesses: number,
    theme: any,
    onClose: () => void
}> = ({ guess, babyName, parentNames, rank, totalGuesses, theme, onClose }) => {
    const [copied, setCopied] = useState(false);

    const shareText = `🔮 I made my prediction for ${babyName}'s arrival!\n\n📅 ${formatDate(guess.date)}\n⚖️ ${guess.weightLbs}lb ${guess.weightOz}oz\n👶 ${guess.gender}\n\nThink you can guess better? Join the baby pool! 🍼`;
    
    const handleCopy = () => {
        navigator.clipboard.writeText(shareText + '\n\n' + window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: `My ${babyName} Prediction`, text: shareText, url: window.location.href });
            } catch {}
        } else {
            handleCopy();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full relative overflow-hidden animate-fade-in shadow-2xl">
                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg">
                    <X size={20} className="text-slate-600"/>
                </button>

                {/* Shareable Card Preview */}
                <div className={`${theme.bg} p-6 relative overflow-hidden`}>
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <div className="absolute top-2 left-4 text-4xl">✨</div>
                        <div className="absolute top-8 right-8 text-3xl">🍼</div>
                        <div className="absolute bottom-4 left-1/4 text-2xl">⭐</div>
                        <div className="absolute bottom-8 right-1/4 text-3xl">🎉</div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="text-center mb-4">
                            <div className="text-4xl mb-2">🔮</div>
                            <h3 className={`text-lg font-bold ${theme.text}`}>My Prediction for</h3>
                            <h2 className={`text-2xl font-black font-serif ${theme.text}`}>{babyName}</h2>
                            {parentNames && <p className={`text-sm ${theme.accent} opacity-80`}>by {parentNames}</p>}
                        </div>

                        {/* Prediction Card */}
                        <div className={`bg-white rounded-2xl p-5 shadow-lg border-2 ${theme.border}`}>
                            <div className="text-center mb-4">
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Predicted by</p>
                                <p className="text-xl font-black text-slate-800">{guess.guesserName}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <div className="text-2xl mb-1">📅</div>
                                    <p className="text-xs text-slate-400 font-medium">Date</p>
                                    <p className="font-bold text-slate-800">{formatDate(guess.date)}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <div className="text-2xl mb-1">⚖️</div>
                                    <p className="text-xs text-slate-400 font-medium">Weight</p>
                                    <p className="font-bold text-slate-800">{guess.weightLbs}lb {guess.weightOz}oz</p>
                                </div>
                                <div className={`p-3 rounded-xl text-center ${guess.gender === 'Boy' ? 'bg-blue-50' : guess.gender === 'Girl' ? 'bg-pink-50' : 'bg-slate-50'}`}>
                                    <div className="text-2xl mb-1">{guess.gender === 'Boy' ? '💙' : guess.gender === 'Girl' ? '💗' : '🎁'}</div>
                                    <p className="text-xs text-slate-400 font-medium">Gender</p>
                                    <p className={`font-bold ${guess.gender === 'Boy' ? 'text-blue-600' : guess.gender === 'Girl' ? 'text-pink-500' : 'text-slate-800'}`}>{guess.gender}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-xl text-center">
                                    <div className="text-2xl mb-1">🏆</div>
                                    <p className="text-xs text-slate-400 font-medium">Position</p>
                                    <p className="font-bold text-amber-700">#{rank} of {totalGuesses}</p>
                                </div>
                            </div>

                            {guess.suggestedName && (
                                <div className="mt-3 bg-purple-50 p-3 rounded-xl text-center">
                                    <p className="text-xs text-purple-400 font-medium">Name Guess</p>
                                    <p className="font-bold text-purple-700">"{guess.suggestedName}"</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <p className="text-center text-xs text-slate-400 mt-4">
                            Join the baby pool at SecretSantaMatch.com 🍼
                        </p>
                    </div>
                </div>

                {/* Share Actions */}
                <div className="p-6 space-y-3">
                    <button 
                        onClick={handleNativeShare}
                        className={`w-full ${theme.primary} text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg text-lg`}
                    >
                        <Share2 size={22}/> Share My Prediction
                    </button>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <a 
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n\n' + window.location.href)}`}
                            target="_blank"
                            rel="noopener"
                            className="bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600"
                        >
                            <MessageCircle size={18}/>
                        </a>
                        <a 
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                            target="_blank"
                            rel="noopener"
                            className="bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center hover:bg-blue-700 text-lg"
                        >
                            f
                        </a>
                        <button 
                            onClick={handleCopy}
                            className="bg-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-300"
                        >
                            {copied ? <Check size={18}/> : <Copy size={18}/>}
                        </button>
                    </div>
                    
                    <p className="text-xs text-slate-400 text-center">
                        {copied ? '✅ Copied to clipboard!' : 'Share to challenge friends & family!'}
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- Post-Vote Results Card (FIXED PERCENTILE) ---
const PostVoteResultsCard: React.FC<{ 
    guess: BabyGuess, allGuesses: BabyGuess[], babyName: string, parentNames?: string, pool: BabyPool, theme: any, onEdit: () => void, canEdit: boolean
}> = ({ guess, allGuesses, babyName, parentNames, pool, theme, onEdit, canEdit }) => {
    const [showShareModal, setShowShareModal] = useState(false);

    // FIX: Calculate correct rank - findIndex returns 0-based, we need 1-based
    const totalGuesses = allGuesses.length;
    const myIndex = allGuesses.findIndex(g => g.id === guess.id);
    
    // CRITICAL FIX: If not found (-1) or found at index 0, both need proper handling
    // Index 0 = first guess = rank 1, Index 1 = second guess = rank 2, etc.
    const rank = myIndex >= 0 ? myIndex + 1 : 1; // Default to 1 if not found
    
    // Percentile: Rank 1 of 10 = Top 10%, Rank 5 of 10 = Top 50%
    const percentile = totalGuesses > 0 ? Math.max(1, Math.round((rank / totalGuesses) * 100)) : 100;

    const getComparison = () => {
        const comparisons: string[] = [];
        const sameGender = allGuesses.filter(g => g.gender === guess.gender).length;
        const genderPct = Math.round((sameGender / totalGuesses) * 100);
        if (guess.gender !== 'Surprise') {
            comparisons.push(`${genderPct}% also picked ${guess.gender}`);
        }
        const sameDate = allGuesses.filter(g => g.date === guess.date).length;
        if (sameDate > 1) {
            comparisons.push(`${sameDate} others picked ${formatDate(guess.date)}`);
        } else {
            comparisons.push(`You're the only one who picked ${formatDate(guess.date)}!`);
        }
        return comparisons;
    };

    return (
        <>
            {/* Stunning Share Modal */}
            {showShareModal && (
                <SharePredictionModal
                    guess={guess}
                    babyName={babyName}
                    parentNames={parentNames || ''}
                    rank={rank}
                    totalGuesses={totalGuesses}
                    theme={theme}
                    onClose={() => setShowShareModal(false)}
                />
            )}

            <div className={`bg-white rounded-2xl shadow-lg border-2 ${theme.border} overflow-hidden mb-8`}>
            <div className={`${theme.primary} text-white p-6 text-center`}>
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-bold mb-1">Your Prediction is Locked In!</h3>
                <p className="text-white/80 text-sm">Come back after {babyName} arrives to see if you won</p>
            </div>
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-amber-100 text-center">
                <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-amber-200">
                    <Trophy className="text-amber-500" size={24}/>
                    <div className="text-left">
                        <p className="text-xs text-slate-500 font-medium">Your Position</p>
                        <p className="font-black text-slate-800">
                            #{rank} of {totalGuesses} 
                            <span className="text-amber-600 ml-2">Top {percentile}%</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <User size={18}/> {guess.guesserName}'s Prediction
                </h4>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-xs text-slate-400">📅 Date</span>
                        <p className="font-bold text-slate-800">{formatDate(guess.date)}</p>
                    </div>
                    {guess.time && (
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-xs text-slate-400">🕐 Time</span>
                            <p className="font-bold text-slate-800">{guess.time}</p>
                        </div>
                    )}
                    <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-xs text-slate-400">⚖️ Weight</span>
                        <p className="font-bold text-slate-800">{guess.weightLbs}lb {guess.weightOz}oz</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-xs text-slate-400">👶 Gender</span>
                        <p className={`font-bold ${guess.gender === 'Boy' ? 'text-blue-600' : guess.gender === 'Girl' ? 'text-pink-500' : 'text-slate-800'}`}>
                            {guess.gender === 'Boy' ? '💙 ' : guess.gender === 'Girl' ? '💗 ' : ''}{guess.gender}
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                    <h5 className="font-bold text-blue-800 mb-2 text-sm flex items-center gap-2">
                        <BarChart3 size={16}/> How You Compare
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                        {getComparison().map((c, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <span className="text-blue-400">•</span> {c}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setShowShareModal(true)} className={`flex-1 ${theme.primary} text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 shadow-lg`}>
                        <Share2 size={18}/> Share My Prediction
                    </button>
                    {canEdit && (
                        <button onClick={onEdit} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200">
                            <Edit3 size={18}/> Edit
                        </button>
                    )}
                </div>
                {canEdit && <p className="text-xs text-center text-slate-400 mt-3">You can edit until 7 days before due date</p>}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-600 flex items-center justify-center gap-2">
                    <Bookmark size={16} className="text-slate-400"/> Bookmark to check results!
                </p>
            </div>
        </div>
        </>
    );
};

// --- QR Code Modal ---
const QRCodeModal: React.FC<{ url: string, babyName: string, onClose: () => void }> = ({ url, babyName, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
            <h3 className="font-bold text-xl text-slate-800 mb-4">📱 Scan to Join</h3>
            <div className="bg-white p-4 rounded-xl border-2 border-slate-200 inline-block mb-4">
                <img src={generateQRCodeUrl(url, 200)} alt="QR Code" className="w-48 h-48"/>
            </div>
            <p className="text-xs text-slate-500 mb-4">{babyName}'s Baby Pool</p>
            <button 
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = generateQRCodeUrl(url, 400);
                    link.download = `${babyName.replace(/\s+/g, '-')}-baby-pool-qr.png`;
                    link.click();
                }}
                className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900"
            >
                <Download size={18}/> Download QR Code
            </button>
            <button onClick={onClose} className="w-full text-slate-500 py-2 mt-2">Close</button>
        </div>
    </div>
);

// --- Admin Quick Stats ---
const AdminQuickStats: React.FC<{ pool: BabyPool }> = ({ pool }) => {
    const guessCount = pool.guesses.length;
    const recentGuess = pool.guesses[pool.guesses.length - 1];
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                <Users className="mx-auto text-emerald-600 mb-1" size={24}/>
                <p className="text-2xl font-black text-emerald-800">{guessCount}</p>
                <p className="text-xs text-emerald-600 font-medium">Total Guesses</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                <Calendar className="mx-auto text-blue-600 mb-1" size={24}/>
                <p className="text-lg font-black text-blue-800">{pool.dueDate ? formatDate(pool.dueDate) : 'TBD'}</p>
                <p className="text-xs text-blue-600 font-medium">Due Date</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-100">
                <Clock className="mx-auto text-purple-600 mb-1" size={24}/>
                <p className="text-sm font-bold text-purple-800 truncate">{recentGuess ? recentGuess.guesserName : 'No guesses'}</p>
                <p className="text-xs text-purple-600 font-medium">Latest Guess</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                <Trophy className="mx-auto text-amber-600 mb-1" size={24}/>
                <p className="text-sm font-bold text-amber-800">{pool.status === 'active' ? 'Open' : 'Closed'}</p>
                <p className="text-xs text-amber-600 font-medium">Status</p>
            </div>
        </div>
    );
};

// --- Add to Home Prompt ---
const AddToHomePrompt: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-40 animate-slide-up">
        <button onClick={onDismiss} className="absolute top-2 right-2 text-slate-400 hover:text-white"><X size={18}/></button>
        <p className="font-bold mb-1 flex items-center gap-2"><Bookmark size={16}/> Add to Home Screen</p>
        <p className="text-sm text-slate-300 mb-3">Get quick access to check pool updates!</p>
        <p className="text-xs text-slate-400">Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></p>
    </div>
);

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
        guesserName: '', date: '', time: '', 
        weightLbs: 7, weightOz: 0, length: 20,
        hairColor: 'Bald/None', eyeColor: 'Blue',
        gender: 'Surprise', suggestedName: '',
        customAnswers: {} as Record<string, string>
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasGuessed, setHasGuessed] = useState(false);
    const [mySubmittedGuess, setMySubmittedGuess] = useState<BabyGuess | null>(null);

    // Name Poll State
    const [nameVotes, setNameVotes] = useState<Record<string, number>>({});
    const [hasVotedName, setHasVotedName] = useState(false);
    const [myNameVote, setMyNameVote] = useState<string | null>(null);

    // Admin State
    const [adminMode, setAdminMode] = useState(false);
    const [adminWantsToGuess, setAdminWantsToGuess] = useState(false);
    const [birthData, setBirthData] = useState({ date: '', time: '', weightLbs: 7, weightOz: 5, length: 20, hairColor: '', eyeColor: '', gender: '', actualName: '', photoLink: '' });
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [invitees, setInvitees] = useState<Invitee[]>([]);
    const [newInviteeName, setNewInviteeName] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
    const [showShareSection, setShowShareSection] = useState(true);

    // UI State
    const [showHomePrompt, setShowHomePrompt] = useState(false);
    const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [personalizedGuestName, setPersonalizedGuestName] = useState<string | null>(null);

    // Computed values
    const canEditGuess = useMemo(() => {
        if (!pool) return false;
        const dueDate = new Date(pool.dueDate);
        const cutoffDate = new Date(dueDate);
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        return new Date() < cutoffDate;
    }, [pool]);

    const isDeadlinePassed = useMemo(() => {
        if (!pool?.guessDeadline) return false;
        return new Date() > new Date(pool.guessDeadline);
    }, [pool]);

    const getGuestShareUrl = useCallback(() => {
        if (!pool) return '';
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#poolId=${pool.poolId}`;
    }, [pool]);

    const getPersonalLink = useCallback((name: string) => {
        if (!pool) return '';
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#poolId=${pool.poolId}&guestName=${encodeURIComponent(name)}`;
    }, [pool]);

    // Effects
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
                    try { setInvitees(JSON.parse(savedInvitees)); } catch {}
                }
            }
            if (guestName) {
                const decodedName = decodeURIComponent(guestName);
                setNewGuess(prev => ({ ...prev, guesserName: decodedName }));
                setPersonalizedGuestName(decodedName);
                const myGuessId = localStorage.getItem(`bp_my_guess_${poolId}`);
                if (!myGuessId) setShowWelcomeSplash(true);
            }
            
            const myGuessId = localStorage.getItem(`bp_my_guess_${poolId}`);
            if (myGuessId) setHasGuessed(true);

            // Load name vote
            const savedVote = localStorage.getItem(`bp_name_vote_${poolId}`);
            if (savedVote) {
                setHasVotedName(true);
                setMyNameVote(savedVote);
            }
        } else {
            window.location.href = '/baby-pool.html';
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
            
            // Load name votes from pool data
            if (data.nameVotes) setNameVotes(data.nameVotes);
            
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
        } catch {
            setError("Could not load baby pool. Check the link and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGuessSubmit = async () => {
        if (!pool || !newGuess.guesserName || !newGuess.date) return alert("Please fill in your name and date!");
        setIsSubmitting(true);
        try {
            const result = await submitGuess(pool.poolId, { ...newGuess });
            if (result?.id) localStorage.setItem(`bp_my_guess_${pool.poolId}`, result.id);
            await loadPool(pool.poolId);
            setHasGuessed(true);
            setIsEditMode(false);
            setMySubmittedGuess({ ...newGuess, id: result?.id || Date.now().toString() } as BabyGuess);
            trackEvent('guess_submitted', { poolId: pool.poolId, isEdit: isEditMode });
        } catch {
            alert("Failed to submit guess.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditGuess = () => {
        if (mySubmittedGuess) {
            setNewGuess({
                guesserName: mySubmittedGuess.guesserName,
                date: mySubmittedGuess.date,
                time: mySubmittedGuess.time || '',
                weightLbs: mySubmittedGuess.weightLbs,
                weightOz: mySubmittedGuess.weightOz,
                length: mySubmittedGuess.length || 20,
                hairColor: mySubmittedGuess.hairColor || 'Bald/None',
                eyeColor: mySubmittedGuess.eyeColor || 'Blue',
                gender: mySubmittedGuess.gender,
                suggestedName: mySubmittedGuess.suggestedName || '',
                customAnswers: mySubmittedGuess.customAnswers || {}
            });
            setIsEditMode(true);
            setHasGuessed(false);
        }
    };

    const handleNameVote = (name: string) => {
        if (!pool || hasVotedName) return;
        const newVotes = { ...nameVotes, [name]: (nameVotes[name] || 0) + 1 };
        setNameVotes(newVotes);
        setHasVotedName(true);
        setMyNameVote(name);
        localStorage.setItem(`bp_name_vote_${pool.poolId}`, name);
        trackEvent('name_vote', { poolId: pool.poolId, name });
    };

    const handleBirthDeclare = async () => {
        if (!pool || !pool.adminKey) return;
        setIsSubmitting(true);
        try {
            await declareBirth(pool.poolId, pool.adminKey, birthData);
            trackEvent('birth_declared', { poolId: pool.poolId });
            window.location.reload();
        } catch {
            alert("Failed to update status.");
            setIsSubmitting(false);
        }
    };

    const addInvitee = () => {
        if (!newInviteeName.trim()) return;
        setInvitees([...invitees, { id: crypto.randomUUID(), name: newInviteeName.trim(), sent: false }]);
        setNewInviteeName('');
    };

    const removeInvitee = (id: string) => setInvitees(invitees.filter(i => i.id !== id));

    const copyLink = (text: string, id?: string) => {
        navigator.clipboard.writeText(text).then(() => {
            if (id) {
                setCopiedLinkId(id);
                setTimeout(() => setCopiedLinkId(null), 2000);
            } else {
                alert("Link copied!");
            }
        });
    };

    const shareWhatsApp = (name: string) => {
        const link = getPersonalLink(name);
        const text = `Hi ${name}! 🍼 Join the Baby Pool for ${pool?.babyName}. Guess the due date, weight & more!\n\n${link}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareEmail = (name: string) => {
        const link = getPersonalLink(name);
        const subject = encodeURIComponent(`Join ${pool?.babyName}'s Baby Pool! 🍼`);
        const body = encodeURIComponent(`Hi ${name}!\n\nYou're invited to join our Baby Pool for ${pool?.babyName}!\n\nMake your prediction here: ${link}\n\nGood luck! 🎉`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const openPersonalLink = (name: string) => {
        const link = getPersonalLink(name);
        console.log('Opening personal link:', link);
        window.open(link, '_blank', 'noopener,noreferrer');
    };

    // Loading & Error states
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-emerald-500" size={48}/>
        </div>
    );

    if (error || !pool) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
                <AlertCircle className="mx-auto text-red-400 mb-4" size={48}/>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Pool Not Found</h2>
                <p className="text-slate-600 mb-4">{error || "Could not load baby pool. Check the link and try again."}</p>
                <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold mr-2">
                    <RefreshCw className="inline mr-2" size={16}/> Retry
                </button>
                <a href="/baby-pool.html" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold inline-block mt-2">Create New Pool</a>
            </div>
        </div>
    );

    const t = THEMES[pool.theme as ThemeKey] || THEMES.sage;
    const fields = pool.includeFields || { time: true, weight: true, length: true, hair: true, eye: true, gender: true };
    const isCompleted = !!pool.result;
    const sortedGuesses = isCompleted 
        ? [...pool.guesses].sort((a, b) => (b.score || 0) - (a.score || 0))
        : pool.guesses;
    const guestShareUrl = getGuestShareUrl();
    const unitSystem = pool.unitSystem || 'imperial';

    // Input style helper - GREEN when has value
    const inputStyle = (hasValue: boolean) => `w-full p-3 pl-10 border rounded-xl transition ${
        hasValue ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-slate-50 border-slate-200'
    }`;

    return (
        <div className={`min-h-screen font-sans ${t.bg}`}>
            <Header />

            {showWelcomeSplash && pool && personalizedGuestName && (
                <WelcomeSplash 
                    guestName={personalizedGuestName}
                    babyName={pool.babyName}
                    parentNames={pool.parentNames || ''}
                    theme={t}
                    onContinue={() => setShowWelcomeSplash(false)}
                />
            )}

            <div className="max-w-3xl mx-auto p-4 pb-20">
                
                {/* Personalized Greeting */}
                {!adminMode && personalizedGuestName && !showWelcomeSplash && (
                    <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-2xl p-4 mb-6 border border-emerald-100 text-center">
                        <p className="text-emerald-800 font-medium">
                            Welcome, <span className="font-bold">{personalizedGuestName}</span>! 
                            {pool.parentNames && <span className="text-slate-600"> • Invited by {pool.parentNames}</span>}
                        </p>
                    </div>
                )}

                {/* HERO HEADER */}
                <div className={`${t.primary} rounded-3xl p-8 text-center text-white mb-8 shadow-lg relative overflow-hidden`}>
                    <div className="text-5xl mb-3">{t.illustration}</div>
                    <h1 className="text-3xl md:text-4xl font-black font-serif mb-1">{pool.babyName}</h1>
                    {pool.parentNames && <p className="text-white/80 text-sm mb-4">Celebrating {pool.parentNames}</p>}
                    {pool.isMultiples && (
                        <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-3">
                            {'👶'.repeat(pool.multiplesCount || 2)} {pool.multiplesCount === 2 ? 'Twins' : 'Triplets'}!
                        </span>
                    )}
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                        {pool.dueDate && (
                            <span className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Calendar size={12}/> Due: {formatDate(pool.dueDate)}
                            </span>
                        )}
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Users size={12}/> {pool.guesses.length} Guesses
                        </span>
                    </div>
                </div>

                {/* ADMIN TOOLBAR */}
                {adminMode && !isCompleted && (
                    <div className={`${t.secondary} p-4 rounded-2xl mb-6 border ${t.border} flex flex-wrap items-center justify-between gap-3`}>
                        <span className={`font-bold ${t.accent} flex items-center gap-2`}><Lock size={16}/> ORGANIZER MODE</span>
                        <div className="flex gap-2">
                            <button onClick={() => copyLink(guestShareUrl)} className="bg-white text-slate-700 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 hover:bg-slate-50 border">
                                <Copy size={14}/> Copy Share Link
                            </button>
                            <button onClick={() => setShowQRModal(true)} className="bg-white text-slate-700 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 hover:bg-slate-50 border">
                                <QrCode size={14}/> QR Code
                            </button>
                            <button onClick={() => setShowAdminModal(true)} className={`${t.primary} text-white font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2`}>
                                <Sparkles size={14}/> Declare Birth
                            </button>
                        </div>
                    </div>
                )}

                {/* ADMIN QUICK STATS */}
                {adminMode && !isCompleted && <AdminQuickStats pool={pool} />}

                {/* PROGRESS BAR */}
                {!isCompleted && (
                    <ProgressBar current={pool.guesses.length} target={pool.targetGuessCount || 25} theme={t} />
                )}

                {/* PRIZE DISPLAY */}
                {pool.prizeDescription && <PrizeDisplay prize={pool.prizeDescription} theme={t} />}

                {/* DEADLINE BANNER */}
                {pool.guessDeadline && <DeadlineBanner deadline={pool.guessDeadline} isPast={isDeadlinePassed} />}

                {/* WHAT'S WINNING - Organizer Summary */}
                {adminMode && !isCompleted && pool.guesses.length > 0 && (
                    <WhatsWinningCard guesses={pool.guesses} pool={pool} theme={t} />
                )}

                {/* NO GUESSES REMINDER FOR ADMIN */}
                {adminMode && pool.guesses.length === 0 && !isCompleted && (
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 mb-8 text-center">
                        <AlertCircle className="mx-auto text-blue-400 mb-3" size={40}/>
                        <h3 className="font-bold text-blue-900 text-lg mb-2">No guesses yet!</h3>
                        <p className="text-blue-700 mb-4">Share your pool link to start collecting predictions.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => copyLink(guestShareUrl)} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-xl text-sm flex items-center gap-2">
                                <Copy size={14}/> Copy Share Link
                            </button>
                            <button onClick={() => setShowQRModal(true)} className="bg-white text-blue-600 border border-blue-300 font-bold py-2 px-6 rounded-xl text-sm flex items-center gap-2">
                                <QrCode size={14}/> Show QR Code
                            </button>
                        </div>
                    </div>
                )}

                {/* COUNTDOWN */}
                {pool.dueDate && !isCompleted && <PoolCountdown dueDate={pool.dueDate} theme={t} />}

                {/* NAME POLL */}
                {pool.enableNamePoll && pool.nameOptions && pool.nameOptions.length > 0 && !isCompleted && (
                    <NamePollCard 
                        nameOptions={pool.nameOptions}
                        votes={nameVotes}
                        onVote={handleNameVote}
                        hasVoted={hasVotedName}
                        myVote={myNameVote}
                        theme={t}
                    />
                )}

                {/* MY PREDICTION CARD (if user already guessed) - Shows ONLY their guess */}
                {hasGuessed && mySubmittedGuess && !isCompleted && (
                    <PostVoteResultsCard 
                        guess={mySubmittedGuess} 
                        allGuesses={pool.guesses}
                        babyName={pool.babyName}
                        parentNames={pool.parentNames}
                        pool={pool}
                        theme={t}
                        onEdit={handleEditGuess}
                        canEdit={canEditGuess && !isDeadlinePassed}
                    />
                )}

                {/* ADMIN SHARE SECTION */}
                {adminMode && !isCompleted && (
                    <div className={`bg-white rounded-2xl border ${t.border} mb-8 shadow-sm overflow-hidden`}>
                        <button onClick={() => setShowShareSection(!showShareSection)} className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50">
                            <span className="font-bold text-slate-700 flex items-center gap-2">
                                <Share2 size={18}/> Invite Guests with Personal Links
                            </span>
                            {showShareSection ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </button>
                        
                        {showShareSection && (
                            <div className="p-4 pt-0 space-y-4">
                                <p className="text-slate-500 text-sm">Create personalized links for each guest. Their name will be pre-filled!</p>
                                
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Generic Share Link</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={guestShareUrl} readOnly className="flex-1 p-2 bg-white border rounded-lg text-sm text-slate-600"/>
                                        <button onClick={() => copyLink(guestShareUrl)} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
                                            <Copy size={14}/>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newInviteeName} 
                                        onChange={e => setNewInviteeName(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addInvitee()}
                                        placeholder="Enter guest name (e.g. Grandma)" 
                                        className="flex-1 p-3 border rounded-xl bg-slate-50"
                                    />
                                    <button onClick={addInvitee} className={`${t.primary} text-white font-bold px-6 rounded-xl`}>Add</button>
                                </div>

                                {invitees.length > 0 && (
                                    <div className="space-y-2">
                                        {invitees.map(inv => (
                                            <div key={inv.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                                                <span className="font-bold text-slate-700">{inv.name}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => copyLink(getPersonalLink(inv.name), inv.id)} className={`p-2 rounded-lg text-slate-500 hover:bg-white ${copiedLinkId === inv.id ? 'bg-emerald-100 text-emerald-600' : ''}`} title="Copy">
                                                        {copiedLinkId === inv.id ? <Check size={16}/> : <Copy size={16}/>}
                                                    </button>
                                                    <button onClick={() => openPersonalLink(inv.name)} className="p-2 rounded-lg text-slate-500 hover:bg-white" title="Open">
                                                        <ExternalLink size={16}/>
                                                    </button>
                                                    <button onClick={() => shareEmail(inv.name)} className="p-2 rounded-lg bg-blue-500 text-white" title="Email">
                                                        <Mail size={16}/>
                                                    </button>
                                                    <button onClick={() => shareWhatsApp(inv.name)} className="p-2 rounded-lg bg-green-500 text-white" title="WhatsApp">
                                                        <MessageCircle size={16}/>
                                                    </button>
                                                    <button onClick={() => removeInvitee(inv.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Delete">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* GUESS FORM */}
                {!isCompleted && !hasGuessed && !isDeadlinePassed && (!adminMode || adminWantsToGuess) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <PlusCircle size={20} className={t.accent}/> 
                            {isEditMode ? "Edit Your Prediction" : "Cast Your Vote"}
                        </h3>
                        {personalizedGuestName && <p className="text-slate-500 text-sm mb-4">Make your best guess, {personalizedGuestName}! 🏆</p>}

                        {/* YOUR INFO */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User size={14}/> Your Info
                            </h4>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input 
                                    type="text" placeholder="Your Name" 
                                    value={newGuess.guesserName} 
                                    onChange={e => setNewGuess({...newGuess, guesserName: e.target.value})} 
                                    className={inputStyle(!!newGuess.guesserName)}
                                    disabled={!!personalizedGuestName}
                                />
                            </div>
                        </div>

                        {/* WHEN WILL BABY ARRIVE */}
                        {pool.dueDate && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📅 When Will Baby Arrive?</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                        <input type="date" value={newGuess.date} onChange={e => setNewGuess({...newGuess, date: e.target.value})} className={inputStyle(!!newGuess.date)}/>
                                    </div>
                                    {fields.time && (
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                            <input type="time" value={newGuess.time} onChange={e => setNewGuess({...newGuess, time: e.target.value})} className={inputStyle(!!newGuess.time)}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* BABY'S STATS */}
                        {(fields.weight || fields.length) && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    ⚖️ Baby's Stats 
                                    {unitSystem === 'metric' && <span className="text-emerald-500 text-[10px]">(metric)</span>}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {fields.weight && (
                                        <div className="flex gap-2 items-center">
                                            <div className={`flex-1 flex items-center border rounded-xl px-3 ${newGuess.weightLbs > 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                                                <Scale size={18} className="text-slate-400 mr-2"/>
                                                <input type="number" value={newGuess.weightLbs} onChange={e => setNewGuess({...newGuess, weightLbs: parseInt(e.target.value) || 0})} className="w-full p-3 bg-transparent outline-none" min="0" max="15"/>
                                                <span className="text-xs font-bold text-slate-400">{unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
                                            </div>
                                            <div className={`flex-1 flex items-center border rounded-xl px-3 ${newGuess.weightOz > 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                                                <input type="number" value={newGuess.weightOz} onChange={e => setNewGuess({...newGuess, weightOz: parseInt(e.target.value) || 0})} className="w-full p-3 bg-transparent outline-none" min="0" max="15"/>
                                                <span className="text-xs font-bold text-slate-400">{unitSystem === 'metric' ? 'g' : 'oz'}</span>
                                            </div>
                                        </div>
                                    )}
                                    {fields.length && (
                                        <div className="relative">
                                            <Ruler className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                            <input type="number" value={newGuess.length} onChange={e => setNewGuess({...newGuess, length: parseFloat(e.target.value) || 0})} className={inputStyle(newGuess.length > 0)} placeholder={`Length (${unitSystem === 'metric' ? 'cm' : 'inches'})`} step="0.5" min="15" max="60"/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* BABY'S APPEARANCE */}
                        {(fields.gender || fields.hair || fields.eye) && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">👶 Baby's Appearance</h4>
                                
                                {fields.gender && (
                                    <div className="mb-4">
                                        <div className="flex gap-3">
                                            {['Boy', 'Girl', 'Surprise'].map(g => (
                                                <button key={g} onClick={() => setNewGuess({...newGuess, gender: g})} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                                    newGuess.gender === g 
                                                        ? g === 'Boy' ? 'bg-blue-50 text-blue-600 border-blue-400' 
                                                            : g === 'Girl' ? 'bg-pink-50 text-pink-500 border-pink-400' 
                                                            : 'bg-slate-800 text-white border-slate-800'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                                }`}>
                                                    {g === 'Boy' && '💙'} {g === 'Girl' && '💗'} {g === 'Surprise' && '🎁'} {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {fields.hair && (
                                        <div className="relative">
                                            <Scissors className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                            <select value={newGuess.hairColor} onChange={e => setNewGuess({...newGuess, hairColor: e.target.value})} className={inputStyle(newGuess.hairColor !== 'Bald/None')}>
                                                {HAIR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {fields.eye && (
                                        <div className="relative">
                                            <Eye className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                            <select value={newGuess.eyeColor} onChange={e => setNewGuess({...newGuess, eyeColor: e.target.value})} className={inputStyle(newGuess.eyeColor !== 'Blue')}>
                                                {EYE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* NAME GUESS */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">✨ Name Guess (Optional)</h4>
                            <input type="text" placeholder="What do you think they'll name the baby?" value={newGuess.suggestedName} onChange={e => setNewGuess({...newGuess, suggestedName: e.target.value})} className={inputStyle(!!newGuess.suggestedName).replace('pl-10', '')}/>
                        </div>

                        <button onClick={handleGuessSubmit} disabled={isSubmitting} className={`w-full ${t.primary} hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-md transition-all transform active:scale-95 text-lg flex items-center justify-center gap-2`}>
                            {isSubmitting ? <><Loader2 className="animate-spin" size={20}/> Submitting...</> 
                                : isEditMode ? <><Edit3 size={20}/> Update My Prediction</> 
                                : <><Sparkles size={20}/> Submit My Prediction</>}
                        </button>

                        {isEditMode && (
                            <button onClick={() => { setIsEditMode(false); setHasGuessed(true); }} className="w-full text-slate-500 font-medium py-3 mt-2 hover:text-slate-700">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                )}

                {/* LEADERBOARD - Shows all guesses (not just user's) */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 px-2 flex items-center gap-2">
                        <Trophy size={18}/> {isCompleted ? 'Final Results' : 'All Guesses'}
                    </h3>
                    {sortedGuesses.map((g, i) => (
                        <div key={g.id} className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isCompleted && i === 0 ? 'border-yellow-400 bg-yellow-50' : 
                            mySubmittedGuess?.id === g.id ? `border-2 ${t.border}` : 'border-slate-100'
                        }`}>
                            <div className="flex items-center gap-4 w-full">
                                {isCompleted && <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold ${i===0?'bg-yellow-400 text-white':'bg-slate-100 text-slate-500'}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i+1}</div>}
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 flex justify-between items-center">
                                        <span className="truncate flex items-center gap-2">
                                            {g.guesserName}
                                            {mySubmittedGuess?.id === g.id && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">You</span>}
                                        </span>
                                        {isCompleted && <span className="text-slate-600 font-black">{g.score}pts</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-1">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{formatDate(g.date)}</span>
                                        {fields.weight && <span className="bg-slate-100 px-2 py-0.5 rounded">{g.weightLbs}lb {g.weightOz}oz</span>}
                                        {fields.gender && <span className="bg-slate-100 px-2 py-0.5 rounded">{g.gender}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {sortedGuesses.length === 0 && <div className="text-center text-slate-400 py-8">No guesses yet. Be the first!</div>}
                </div>

                {/* REGISTRY SECTION FOR PARTICIPANTS */}
                {!adminMode && <RegistrySection pool={pool} theme={t} country={country} />}

                <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />
            </div>

            {/* MODALS */}
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
                                <input type="number" placeholder="Lbs" value={birthData.weightLbs} onChange={e => setBirthData({...birthData, weightLbs: parseInt(e.target.value) || 0})} className="w-full p-3 border rounded-xl"/>
                                <input type="number" placeholder="Oz" value={birthData.weightOz} onChange={e => setBirthData({...birthData, weightOz: parseInt(e.target.value) || 0})} className="w-full p-3 border rounded-xl"/>
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
                            <input type="text" placeholder="Photo Link (optional)" value={birthData.photoLink} onChange={e => setBirthData({...birthData, photoLink: e.target.value})} className="w-full p-3 border rounded-xl"/>
                            
                            <button onClick={handleBirthDeclare} disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl mt-2 flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Baby size={18}/>}
                                Finalize & Calculate Winner
                            </button>
                            <button onClick={() => setShowAdminModal(false)} className="w-full text-slate-500 py-2">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showQRModal && pool && <QRCodeModal url={guestShareUrl} babyName={pool.babyName} onClose={() => setShowQRModal(false)} />}
            {showHomePrompt && <AddToHomePrompt onDismiss={dismissHomePrompt} />}

            <Footer />
        </div>
    );
};

export default BabyPoolDashboard;