import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Calendar, Scale, Clock, User, Trophy, Share2, Copy, Baby, 
    PlusCircle, CheckCircle, Instagram, Gift, Loader2, Lock, 
    MessageCircle, Trash2, DollarSign, Ruler, Scissors, Eye, 
    HelpCircle, BarChart3, Bookmark, Sparkles, X, RefreshCw,
    ExternalLink, Settings, Mail, QrCode, Download, AlertCircle,
    Users, ChevronDown, ChevronUp, Link2, Check, Edit3
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

// Generate QR Code URL using free QR code API
const generateQRCodeUrl = (url: string, size: number = 200): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface Invitee {
    id: string;
    name: string;
    sent?: boolean;
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

    const genderVotes = guesses.reduce((acc, g) => {
        if (g.gender && g.gender !== 'Surprise') {
            acc[g.gender] = (acc[g.gender] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const totalGenderVotes = Object.values(genderVotes).reduce((a, b) => a + b, 0);

    const dateCounts = guesses.reduce((acc, g) => {
        acc[g.date] = (acc[g.date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const popularDate = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0];

    const avgWeight = guesses.reduce((sum, g) => sum + (g.weightLbs * 16 + g.weightOz), 0) / guesses.length;
    const avgLbs = Math.floor(avgWeight / 16);
    const avgOz = Math.round(avgWeight % 16);

    const nameGuesses = guesses.filter(g => g.suggestedName).reduce((acc, g) => {
        const name = g.suggestedName!.toLowerCase().trim();
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topNames = Object.entries(nameGuesses).sort((a, b) => b[1] - a[1]).slice(0, 3);

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

                {popularDate && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">📅 Most Predicted Date</h4>
                        <p className="text-2xl font-black text-slate-800">{formatDate(popularDate[0])}</p>
                        <p className="text-sm text-slate-500">{popularDate[1]} {popularDate[1] === 1 ? 'guess' : 'guesses'}</p>
                    </div>
                )}

                {fields.weight && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">⚖️ Average Weight Guess</h4>
                        <p className="text-2xl font-black text-slate-800">{avgLbs} lbs {avgOz} oz</p>
                    </div>
                )}

                {fields.time && popularTimeSlot[1] > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">🕐 Most Popular Time</h4>
                        <p className="text-lg font-bold text-slate-800">{popularTimeSlot[0]}</p>
                        <p className="text-sm text-slate-500">{Math.round((popularTimeSlot[1] / guesses.filter(g => g.time).length) * 100)}% of guesses</p>
                    </div>
                )}

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

// --- Welcome Splash for Personalized Links ---
const WelcomeSplash: React.FC<{ 
    guestName: string, 
    babyName: string, 
    parentNames: string,
    theme: any,
    onContinue: () => void 
}> = ({ guestName, babyName, parentNames, theme, onContinue }) => {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full text-center animate-fade-in">
                {/* Decorative elements */}
                <div className="text-6xl mb-6">🍼</div>
                
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 font-serif mb-2">
                    Hi {guestName}! 👋
                </h1>
                
                <p className="text-lg text-slate-600 mb-6">
                    {parentNames ? (
                        <>
                            <span className="font-semibold text-emerald-700">{parentNames}</span> invited you to join the baby pool for
                        </>
                    ) : (
                        <>You've been invited to join the baby pool for</>
                    )}
                </p>
                
                <div className={`${theme.primary} text-white py-6 px-8 rounded-2xl mb-8 shadow-lg`}>
                    <p className="text-white/80 text-sm font-medium mb-1">Guess the arrival of</p>
                    <h2 className="text-4xl font-black font-serif">{babyName}</h2>
                </div>
                
                <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">🎯 How it works:</h3>
                    <div className="space-y-3 text-left">
                        <div className="flex items-start gap-3">
                            <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                            <p className="text-slate-600 text-sm">Make your predictions for when baby arrives, weight, gender & more</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                            <p className="text-slate-600 text-sm">See how your guesses compare to everyone else</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                            <p className="text-slate-600 text-sm">Come back after baby arrives to see if you won! 🏆</p>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={onContinue}
                    className={`w-full ${theme.primary} text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all text-lg flex items-center justify-center gap-2`}
                >
                    Make My Prediction <Sparkles size={20}/>
                </button>
                
                <p className="text-xs text-slate-400 mt-4">
                    No signup required • Takes 2 minutes • 100% free
                </p>
            </div>
        </div>
    );
};

// --- What's Winning Section (For Organizer) ---
const WhatsWinningCard: React.FC<{ guesses: BabyGuess[], pool: BabyPool, theme: any }> = ({ guesses, pool, theme }) => {
    if (guesses.length < 1) return null;

    const fields = pool.includeFields || { time: true, weight: true, length: true, hair: true, eye: true, gender: true };

    // Calculate most popular for each category
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

    // Dates
    const dates = guesses.map(g => g.date);
    const topDate = getMode(dates);
    
    // Gender
    const genders = guesses.map(g => g.gender).filter(g => g && g !== 'Surprise');
    const topGender = getMode(genders);
    const genderPct = topGender ? Math.round((topGender[1] / genders.length) * 100) : 0;

    // Weight
    const weights = guesses.map(g => g.weightLbs * 16 + g.weightOz);
    const medianWeight = getMedian(weights);
    const medianLbs = Math.floor(medianWeight / 16);
    const medianOz = Math.round(medianWeight % 16);

    // Time slots
    const timeSlots = guesses.map(g => {
        if (!g.time) return null;
        const hour = parseInt(g.time.split(':')[0]);
        if (hour >= 6 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 18) return 'Afternoon';
        if (hour >= 18 && hour < 22) return 'Evening';
        return 'Night';
    }).filter(Boolean) as string[];
    const topTimeSlot = getMode(timeSlots);

    // Hair
    const hairs = guesses.map(g => g.hairColor).filter(Boolean) as string[];
    const topHair = getMode(hairs);

    // Names
    const names = guesses.map(g => g.suggestedName?.toLowerCase().trim()).filter(Boolean) as string[];
    const topName = getMode(names);

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-6 mb-8">
            <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-lg">
                <Trophy size={22} className="text-amber-500"/> 
                🔮 Current Predictions Summary
            </h3>
            <p className="text-amber-700 text-sm mb-4">
                Based on {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'} so far:
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Date */}
                {topDate && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">📅 Due Date</div>
                        <div className="font-black text-slate-800">{formatDate(topDate[0])}</div>
                        <div className="text-xs text-emerald-600 font-medium">{topDate[1]} votes</div>
                    </div>
                )}

                {/* Gender */}
                {fields.gender && topGender && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">👶 Gender</div>
                        <div className={`font-black ${topGender[0] === 'Boy' ? 'text-blue-600' : 'text-pink-500'}`}>
                            {topGender[0] === 'Boy' ? '💙' : '💗'} {topGender[0]}
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">{genderPct}% say {topGender[0]}</div>
                    </div>
                )}

                {/* Weight */}
                {fields.weight && !isNaN(medianWeight) && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">⚖️ Weight</div>
                        <div className="font-black text-slate-800">{medianLbs}lb {medianOz}oz</div>
                        <div className="text-xs text-slate-500 font-medium">median guess</div>
                    </div>
                )}

                {/* Time */}
                {fields.time && topTimeSlot && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">🕐 Time of Day</div>
                        <div className="font-black text-slate-800">{topTimeSlot[0]}</div>
                        <div className="text-xs text-emerald-600 font-medium">{topTimeSlot[1]} votes</div>
                    </div>
                )}

                {/* Hair */}
                {fields.hair && topHair && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">💇 Hair Color</div>
                        <div className="font-black text-slate-800">{topHair[0]}</div>
                        <div className="text-xs text-emerald-600 font-medium">{topHair[1]} votes</div>
                    </div>
                )}

                {/* Name */}
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

// --- Enhanced Post-Vote Results Card ---
const PostVoteResultsCard: React.FC<{ 
    guess: BabyGuess, 
    allGuesses: BabyGuess[],
    babyName: string, 
    pool: BabyPool,
    theme: any,
    onEdit: () => void,
    canEdit: boolean
}> = ({ guess, allGuesses, babyName, pool, theme, onEdit, canEdit }) => {
    const [copied, setCopied] = useState(false);

    // Calculate percentile/ranking
    const totalGuesses = allGuesses.length;
    const guessIndex = allGuesses.findIndex(g => g.id === guess.id);
    const rank = totalGuesses - guessIndex; // Newer = lower rank for now
    const percentile = Math.round((rank / totalGuesses) * 100);

    // Calculate how guess compares to others
    const getComparison = () => {
        const comparisons: string[] = [];
        
        // Gender comparison
        const sameGender = allGuesses.filter(g => g.gender === guess.gender).length;
        const genderPct = Math.round((sameGender / totalGuesses) * 100);
        if (guess.gender !== 'Surprise') {
            comparisons.push(`${genderPct}% also picked ${guess.gender}`);
        }

        // Date comparison
        const sameDate = allGuesses.filter(g => g.date === guess.date).length;
        if (sameDate > 1) {
            comparisons.push(`${sameDate} others picked ${formatDate(guess.date)}`);
        } else {
            comparisons.push(`You're the only one who picked ${formatDate(guess.date)}!`);
        }

        return comparisons;
    };

    const shareText = `🔮 My Baby Pool Prediction for ${babyName}:\n📅 ${formatDate(guess.date)}${guess.time ? ` at ${guess.time}` : ''}\n⚖️ ${guess.weightLbs}lb ${guess.weightOz}oz\n👶 ${guess.gender}\n\nMake your guess too!`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `My ${babyName} Prediction`,
                    text: shareText,
                    url: window.location.href
                });
            } catch (err) {}
        } else {
            navigator.clipboard.writeText(shareText + '\n' + window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={`bg-white rounded-2xl shadow-lg border-2 ${theme.border} overflow-hidden mb-8`}>
            {/* Header */}
            <div className={`${theme.primary} text-white p-6 text-center`}>
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-bold mb-1">Your Prediction is Locked In!</h3>
                <p className="text-white/80 text-sm">Come back after {babyName} arrives to see if you won</p>
            </div>
            
            {/* Ranking Badge */}
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

            {/* Prediction Summary */}
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
                            {guess.gender === 'Boy' ? '💙 ' : guess.gender === 'Girl' ? '💗 ' : ''}
                            {guess.gender}
                        </p>
                    </div>
                    {guess.suggestedName && (
                        <div className="bg-slate-50 p-3 rounded-xl col-span-2">
                            <span className="text-xs text-slate-400">✨ Name Guess</span>
                            <p className="font-bold text-slate-800">{guess.suggestedName}</p>
                        </div>
                    )}
                </div>

                {/* How You Compare */}
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

                {/* Actions */}
                <div className="flex gap-2">
                    <button 
                        onClick={handleShare}
                        className={`flex-1 ${theme.primary} text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all`}
                    >
                        {copied ? <CheckCircle size={18}/> : <Share2 size={18}/>}
                        {copied ? 'Copied!' : 'Share'}
                    </button>
                    {canEdit && (
                        <button 
                            onClick={onEdit}
                            className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                        >
                            <Edit3 size={18}/> Edit Guess
                        </button>
                    )}
                </div>

                {canEdit && (
                    <p className="text-xs text-center text-slate-400 mt-3">
                        You can edit your guess until 7 days before the due date
                    </p>
                )}
            </div>

            {/* Bookmark Reminder */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-600 flex items-center justify-center gap-2">
                    <Bookmark size={16} className="text-slate-400"/>
                    <span>Bookmark this page to check back for results!</span>
                </p>
            </div>
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

// --- QR Code Modal ---
const QRCodeModal: React.FC<{ url: string, babyName: string, onClose: () => void }> = ({ url, babyName, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={24}/>
                </button>
                <h3 className="font-bold text-xl text-slate-800 mb-4">📱 Scan to Join</h3>
                <p className="text-slate-600 text-sm mb-4">
                    Share this QR code at your baby shower!
                </p>
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200 inline-block mb-4">
                    <img 
                        src={generateQRCodeUrl(url, 200)} 
                        alt="QR Code"
                        className="w-48 h-48"
                    />
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
};

// --- Quick Stats for Admin ---
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
                <p className="text-lg font-black text-blue-800">{formatDate(pool.dueDate)}</p>
                <p className="text-xs text-blue-600 font-medium">Due Date</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-100">
                <Clock className="mx-auto text-purple-600 mb-1" size={24}/>
                <p className="text-sm font-bold text-purple-800 truncate">
                    {recentGuess ? recentGuess.guesserName : 'No guesses'}
                </p>
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

    // Check if user can edit (7 days before due date)
    const canEditGuess = useMemo(() => {
        if (!pool) return false;
        const dueDate = new Date(pool.dueDate);
        const cutoffDate = new Date(dueDate);
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        return new Date() < cutoffDate;
    }, [pool]);

    // Get the guest share URL (without admin key)
    const getGuestShareUrl = useCallback(() => {
        if (!pool) return '';
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#poolId=${pool.poolId}`;
    }, [pool]);

    // Get personalized link for a specific guest
    const getPersonalLink = useCallback((name: string) => {
        if (!pool) return '';
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#poolId=${pool.poolId}&guestName=${encodeURIComponent(name)}`;
    }, [pool]);

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
                const decodedName = decodeURIComponent(guestName);
                setNewGuess(prev => ({ ...prev, guesserName: decodedName }));
                setPersonalizedGuestName(decodedName);
                // Show welcome splash for personalized links (only if not already guessed)
                const myGuessId = localStorage.getItem(`bp_my_guess_${poolId}`);
                if (!myGuessId) {
                    setShowWelcomeSplash(true);
                }
            }
            
            const myGuessId = localStorage.getItem(`bp_my_guess_${poolId}`);
            if (myGuessId) {
                setHasGuessed(true);
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
            
            if (result?.id) {
                localStorage.setItem(`bp_my_guess_${pool.poolId}`, result.id);
            }
            
            await loadPool(pool.poolId);
            setHasGuessed(true);
            setIsEditMode(false);
            setMySubmittedGuess({ ...submission, id: result?.id || Date.now().toString() } as BabyGuess);
            
            trackEvent('guess_submitted', { poolId: pool.poolId, isEdit: isEditMode });
        } catch (err) {
            alert("Failed to submit guess.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditGuess = () => {
        if (mySubmittedGuess) {
            // Pre-fill the form with existing guess
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
        setInvitees([...invitees, { id: crypto.randomUUID(), name: newInviteeName.trim(), sent: false }]);
        setNewInviteeName('');
    };

    const removeInvitee = (id: string) => {
        setInvitees(invitees.filter(i => i.id !== id));
    };

    const copyLink = (text: string, id?: string) => {
        navigator.clipboard.writeText(text).then(() => {
            if (id) {
                setCopiedLinkId(id);
                setTimeout(() => setCopiedLinkId(null), 2000);
            } else {
                alert("Link copied to clipboard!");
            }
        });
    };

    const shareWhatsApp = (name: string) => {
        const link = getPersonalLink(name);
        const text = `Hi ${name}! 🍼 Join the Baby Pool for ${pool?.babyName}. Guess the due date, weight & more!\n\nMake your prediction here: ${link}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareEmail = (name: string) => {
        const link = getPersonalLink(name);
        const subject = encodeURIComponent(`Join ${pool?.babyName}'s Baby Pool! 🍼`);
        const body = encodeURIComponent(`Hi ${name}!\n\nYou're invited to join our Baby Pool guessing game for ${pool?.babyName}!\n\nGuess the due date, weight, gender, and more. The closest guess wins!\n\nMake your prediction here: ${link}\n\nGood luck! 🎉`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const openPersonalLink = (name: string) => {
        const link = getPersonalLink(name);
        console.log('Opening personal link:', link); // Debug log
        window.open(link, '_blank', 'noopener,noreferrer');
    };

    const myRanking = useMemo(() => {
        if (!pool || !mySubmittedGuess) return null;
        const guessIndex = pool.guesses.findIndex(g => g.id === mySubmittedGuess.id);
        if (guessIndex === -1) return null;
        return {
            rank: pool.guesses.length - guessIndex,
            total: pool.guesses.length
        };
    }, [pool, mySubmittedGuess]);

    const handleRetryLoad = () => {
        setLoading(true);
        setError(null);
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const poolId = params.get('poolId');
        const adminKey = params.get('adminKey');
        if (poolId) {
            loadPool(poolId, adminKey);
        }
    };

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
                <div className="flex flex-col gap-3">
                    <button onClick={handleRetryLoad} className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                        <RefreshCw size={18} /> Retry Loading
                    </button>
                    <a href="/baby-pool.html" className="inline-block w-full bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 transition-colors">
                        Create a New Pool
                    </a>
                </div>
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
    const guestShareUrl = getGuestShareUrl();

    return (
        <div className={`min-h-screen font-sans ${t.bg}`}>
            <Header />

            {/* Welcome Splash for Personalized Links */}
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
                
                {/* Personalized Greeting (after splash dismissed) */}
                {!adminMode && personalizedGuestName && !showWelcomeSplash && (
                    <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-2xl p-4 mb-6 border border-emerald-100 text-center">
                        <p className="text-emerald-800 font-medium">
                            Welcome, <span className="font-bold">{personalizedGuestName}</span>! 
                            {pool?.parentNames && <span className="text-slate-600"> • Invited by {pool.parentNames}</span>}
                        </p>
                    </div>
                )}

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
                                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
                                    <button 
                                        onClick={() => copyLink(guestShareUrl)} 
                                        className="flex-1 md:flex-none bg-white border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-100 flex items-center gap-2"
                                    >
                                        <Copy size={14}/> Copy Share Link
                                    </button>
                                    <button 
                                        onClick={() => setShowQRModal(true)} 
                                        className="flex-1 md:flex-none bg-white border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-100 flex items-center gap-2"
                                    >
                                        <QrCode size={14}/> QR Code
                                    </button>
                                    <button 
                                        onClick={() => setShowAdminModal(true)} 
                                        className="flex-1 md:flex-none bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 shadow-sm flex items-center gap-2"
                                    >
                                        <Baby size={14}/> Declare Birth
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ADMIN QUICK STATS */}
                {adminMode && !isCompleted && <AdminQuickStats pool={pool} />}

                {/* WHAT'S WINNING - Organizer Summary */}
                {adminMode && !isCompleted && pool.guesses.length > 0 && (
                    <WhatsWinningCard guesses={pool.guesses} pool={pool} theme={t} />
                )}

                {/* NO GUESSES REMINDER FOR ADMIN */}
                {adminMode && !isCompleted && pool.guesses.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-center">
                        <AlertCircle className="mx-auto text-blue-500 mb-3" size={32}/>
                        <h3 className="font-bold text-blue-900 text-lg mb-2">No guesses yet!</h3>
                        <p className="text-blue-700 text-sm mb-4">
                            Share your baby pool link with friends and family to start collecting predictions.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button 
                                onClick={() => copyLink(guestShareUrl)} 
                                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700"
                            >
                                <Link2 size={18}/> Copy Share Link
                            </button>
                            <button 
                                onClick={() => setShowQRModal(true)} 
                                className="bg-white border-2 border-blue-600 text-blue-600 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50"
                            >
                                <QrCode size={18}/> Show QR Code
                            </button>
                        </div>
                    </div>
                )}

                {/* COUNTDOWN (Only if active) */}
                {!isCompleted && <PoolCountdown dueDate={pool.dueDate} theme={t} />}

                {/* MY PREDICTION CARD (if user already guessed) */}
                {hasGuessed && mySubmittedGuess && !isCompleted && (
                    <PostVoteResultsCard 
                        guess={mySubmittedGuess} 
                        allGuesses={pool.guesses}
                        babyName={pool.babyName} 
                        pool={pool}
                        theme={t}
                        onEdit={handleEditGuess}
                        canEdit={canEditGuess}
                    />
                )}

                {/* GROUP STATS SCORECARD */}
                {!isCompleted && pool.guesses.length >= 3 && (
                    <GroupStatsCard guesses={pool.guesses} theme={t} fields={fields} />
                )}

                {/* ADMIN - PERSONAL LINKS GENERATOR */}
                {adminMode && !isCompleted && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                        <button 
                            onClick={() => setShowShareSection(!showShareSection)}
                            className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Share2 size={20} className={t.accent}/> Invite Guests with Personal Links
                            </h3>
                            {showShareSection ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                        </button>
                        
                        {showShareSection && (
                            <div className="p-6">
                                <p className="text-sm text-slate-500 mb-4">Create personalized links for each guest. Their name will be pre-filled!</p>
                                
                                {/* Quick Share URL */}
                                <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Generic Share Link</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={guestShareUrl}
                                            className="flex-1 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 truncate"
                                        />
                                        <button 
                                            onClick={() => copyLink(guestShareUrl)} 
                                            className="bg-slate-800 text-white px-4 rounded-lg font-bold hover:bg-slate-900 flex items-center gap-2"
                                        >
                                            <Copy size={16}/>
                                        </button>
                                    </div>
                                </div>

                                {/* Add Invitee */}
                                <div className="flex gap-2 mb-6">
                                    <input 
                                        type="text" 
                                        placeholder="Enter guest name (e.g. Grandma)" 
                                        value={newInviteeName}
                                        onChange={e => setNewInviteeName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addInvitee()}
                                        className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <button onClick={addInvitee} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700">Add</button>
                                </div>

                                {/* Invitee List */}
                                <div className="space-y-2">
                                    {invitees.map(invitee => {
                                        const personalLink = getPersonalLink(invitee.name);
                                        const isCopied = copiedLinkId === invitee.id;
                                        
                                        return (
                                            <div key={invitee.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <span className="font-bold text-slate-700">{invitee.name}</span>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => copyLink(personalLink, invitee.id)} 
                                                        className={`p-2 rounded transition-colors ${isCopied ? 'bg-emerald-100 text-emerald-600' : 'bg-white border hover:bg-slate-100 text-slate-600'}`} 
                                                        title="Copy Link"
                                                    >
                                                        {isCopied ? <Check size={16}/> : <Copy size={16}/>}
                                                    </button>
                                                    <button 
                                                        onClick={() => openPersonalLink(invitee.name)} 
                                                        className="p-2 bg-white border hover:bg-slate-100 rounded text-slate-600" 
                                                        title="Open Link"
                                                    >
                                                        <ExternalLink size={16}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => shareEmail(invitee.name)} 
                                                        className="p-2 bg-blue-500 hover:bg-blue-600 rounded text-white" 
                                                        title="Send Email"
                                                    >
                                                        <Mail size={16}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => shareWhatsApp(invitee.name)} 
                                                        className="p-2 bg-green-500 hover:bg-green-600 rounded text-white" 
                                                        title="WhatsApp"
                                                    >
                                                        <MessageCircle size={16}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => removeInvitee(invitee.id)} 
                                                        className="p-2 text-slate-400 hover:text-red-500" 
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {invitees.length === 0 && (
                                        <p className="text-center text-slate-400 py-4 text-sm">
                                            Add guest names above to create personalized links
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
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

                {/* ADMIN ACTIONS: Declare Birth / Enter Results */}
                {adminMode && !isCompleted && (
                    <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-6 mb-8">
                        <div className="flex flex-col items-center text-center">
                            <h3 className="text-xl font-bold text-orange-900 mb-2 flex items-center gap-2">
                                <Settings size={22} className="text-orange-500"/> Enter Results & Declare Birth
                            </h3>
                            <p className="text-slate-600 mb-6 max-w-md">
                                When the baby arrives, click below to enter the final stats and calculate the winner automatically!
                            </p>
                            <button 
                                onClick={() => setShowAdminModal(true)} 
                                className="bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Baby size={24}/> Declare Birth / Enter Results
                            </button>
                            
                            {!adminWantsToGuess && (
                                <button 
                                    onClick={() => setAdminWantsToGuess(true)} 
                                    className="mt-6 text-slate-500 hover:text-slate-700 font-medium underline text-sm"
                                >
                                    I also want to make a prediction (show guessing form)
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* GUESS FORM (IF ACTIVE) */}
                {!isCompleted && !hasGuessed && (!adminMode || adminWantsToGuess) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <PlusCircle size={20} className={t.accent}/> 
                            {isEditMode ? "Edit Your Prediction" : adminMode ? "Make a Prediction (As Organizer)" : "Cast Your Vote"}
                        </h3>
                        {personalizedGuestName && !adminMode && (
                            <p className="text-slate-500 text-sm mb-4">
                                Make your best guess, {personalizedGuestName}! The closest prediction wins. 🏆
                            </p>
                        )}

                        {/* YOUR INFO */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User size={14}/> Your Info
                            </h4>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input 
                                    type="text" 
                                    placeholder="Your Name" 
                                    value={newGuess.guesserName} 
                                    onChange={e => setNewGuess({...newGuess, guesserName: e.target.value})} 
                                    className="w-full p-3 pl-10 border rounded-xl bg-slate-50"
                                    disabled={!!personalizedGuestName}
                                />
                            </div>
                        </div>

                        {/* WHEN WILL BABY ARRIVE */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                📅 When Will Baby Arrive?
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                    <input 
                                        type="date" 
                                        value={newGuess.date} 
                                        onChange={e => setNewGuess({...newGuess, date: e.target.value})} 
                                        className="w-full p-3 pl-10 border rounded-xl bg-slate-50"
                                    />
                                </div>
                                {fields.time && (
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                        <input 
                                            type="time" 
                                            value={newGuess.time} 
                                            onChange={e => setNewGuess({...newGuess, time: e.target.value})} 
                                            className="w-full p-3 pl-10 border rounded-xl bg-slate-50"
                                            placeholder="Time of birth"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BABY'S STATS */}
                        {(fields.weight || fields.length) && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    ⚖️ Baby's Stats
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {fields.weight && (
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Weight</label>
                                            <div className="flex gap-2 items-center">
                                                <div className="flex-1 flex items-center bg-slate-50 border rounded-xl px-3">
                                                    <Scale size={18} className="text-slate-400 mr-2"/>
                                                    <input type="number" value={newGuess.weightLbs} onChange={e => setNewGuess({...newGuess, weightLbs: parseInt(e.target.value) || 0})} className="w-full p-3 bg-transparent outline-none" min="0" max="15"/>
                                                    <span className="text-xs font-bold text-slate-400">lbs</span>
                                                </div>
                                                <div className="flex-1 flex items-center bg-slate-50 border rounded-xl px-3">
                                                    <input type="number" value={newGuess.weightOz} onChange={e => setNewGuess({...newGuess, weightOz: parseInt(e.target.value) || 0})} className="w-full p-3 bg-transparent outline-none" min="0" max="15"/>
                                                    <span className="text-xs font-bold text-slate-400">oz</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {fields.length && (
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Length</label>
                                            <div className="relative">
                                                <Ruler className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                                <input 
                                                    type="number" 
                                                    value={newGuess.length} 
                                                    onChange={e => setNewGuess({...newGuess, length: parseFloat(e.target.value) || 0})} 
                                                    className="w-full p-3 pl-10 border rounded-xl bg-slate-50" 
                                                    placeholder="Length in inches"
                                                    step="0.5"
                                                    min="15"
                                                    max="25"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* BABY'S APPEARANCE */}
                        {(fields.gender || fields.hair || fields.eye) && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    👶 Baby's Appearance
                                </h4>
                                
                                {fields.gender && (
                                    <div className="mb-4">
                                        <label className="text-xs text-slate-500 mb-2 block">Gender</label>
                                        <div className="flex gap-3">
                                            {['Boy', 'Girl', 'Surprise'].map(g => (
                                                <button 
                                                    key={g} 
                                                    onClick={() => setNewGuess({...newGuess, gender: g})} 
                                                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                                        newGuess.gender === g 
                                                            ? g === 'Boy' 
                                                                ? 'bg-blue-50 text-blue-600 border-blue-400' 
                                                                : g === 'Girl' 
                                                                    ? 'bg-pink-50 text-pink-500 border-pink-400' 
                                                                    : 'bg-slate-800 text-white border-slate-800'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                                    }`}
                                                >
                                                    {g === 'Boy' && '💙'} {g === 'Girl' && '💗'} {g === 'Surprise' && '🎁'} {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {fields.hair && (
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Hair Color</label>
                                            <div className="relative">
                                                <Scissors className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                                <select value={newGuess.hairColor} onChange={e => setNewGuess({...newGuess, hairColor: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50 appearance-none cursor-pointer">
                                                    {HAIR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    {fields.eye && (
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Eye Color</label>
                                            <div className="relative">
                                                <Eye className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                                <select value={newGuess.eyeColor} onChange={e => setNewGuess({...newGuess, eyeColor: e.target.value})} className="w-full p-3 pl-10 border rounded-xl bg-slate-50 appearance-none cursor-pointer">
                                                    {EYE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* NAME GUESS */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                ✨ Name Guess (Optional)
                            </h4>
                            <input 
                                type="text" 
                                placeholder="What do you think they'll name the baby?" 
                                value={newGuess.suggestedName} 
                                onChange={e => setNewGuess({...newGuess, suggestedName: e.target.value})} 
                                className="w-full p-3 border rounded-xl bg-slate-50"
                            />
                        </div>

                        {/* CUSTOM QUESTIONS */}
                        {pool.customQuestions && pool.customQuestions.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <HelpCircle size={14}/> Bonus Predictions
                                </h4>
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
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
                            </div>
                        )}

                        <button 
                            onClick={handleGuessSubmit} 
                            disabled={isSubmitting} 
                            className={`w-full ${t.primary} hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-md transition-all transform active:scale-95 text-lg flex items-center justify-center gap-2`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin" size={20}/> Submitting...</>
                            ) : isEditMode ? (
                                <><Edit3 size={20}/> Update My Prediction</>
                            ) : (
                                <><Sparkles size={20}/> Submit My Prediction</>
                            )}
                        </button>

                        {isEditMode && (
                            <button 
                                onClick={() => { setIsEditMode(false); setHasGuessed(true); }}
                                className="w-full text-slate-500 font-medium py-3 mt-2 hover:text-slate-700"
                            >
                                Cancel Edit
                            </button>
                        )}
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

            {/* QR CODE MODAL */}
            {showQRModal && pool && (
                <QRCodeModal 
                    url={guestShareUrl}
                    babyName={pool.babyName}
                    onClose={() => setShowQRModal(false)}
                />
            )}

            {/* ADD TO HOME SCREEN PROMPT */}
            {showHomePrompt && <AddToHomePrompt onDismiss={dismissHomePrompt} />}

            <Footer />
        </div>
    );
};

export default BabyPoolDashboard;