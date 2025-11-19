
import React, { useState, useEffect, useRef } from 'react';
import { trackEvent } from '../services/analyticsService';
import { getGameState, updateGameState } from '../services/whiteElephantService';
import type { WEGame } from '../types';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { generateWETurnNumbersPdf, generateWERulesPdf, generateWEGameLogPdf } from '../services/pdfService';
import { RefreshCw, Play, History, Gift, RotateCcw, Download, Share2, Users, CheckCircle, Volume2, VolumeX, Copy, Lock, Smartphone, ArrowRight, FileText, BarChart3 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import QRCode from 'react-qr-code';

// --- SOUND EFFECTS (Base64 encoded for instant playback) ---
const SOUNDS = {
    // "Ding/Chime" for opening a gift
    open: 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
    // "Whoosh/Slide" for stealing
    steal: 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
    // "Pop" for next turn
    turn: 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
};

// Simple Audio Player Helper
const playAudio = (type: 'open' | 'steal' | 'turn') => {
    try {
        // In a real production app, these would be real mp3 file paths.
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'open') {
            // Magical Chime (High pitch arpeggio)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
            osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            osc.start(now);
            osc.stop(now + 1.5);
        } else if (type === 'steal') {
            // Slide Whistle / Whoosh (Frequency ramp down)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else {
            // Turn Pop (Short blip)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

const WhiteElephantDashboard: React.FC = () => {
    const [game, setGame] = useState<WEGame | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gameId, setGameId] = useState<string | null>(null);
    const [organizerKey, setOrganizerKey] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [shortPlayerLink, setShortPlayerLink] = useState<string>('');
    
    // Sound & Animation State
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [overlayMessage, setOverlayMessage] = useState<{ title: string, subtitle: string, type: 'open' | 'steal' } | null>(null);
    const lastHistoryLen = useRef(0);
    const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Action States
    const [openGiftDescription, setOpenGiftDescription] = useState('');
    const [stealActorId, setStealActorId] = useState<string>('');
    const [stealTargetId, setStealTargetId] = useState<string>('');
    const [stealGift, setStealGift] = useState('');
    const [showStealModal, setShowStealModal] = useState(false);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showEndGameModal, setShowEndGameModal] = useState(false);

    // Polling Refs (Critical for flicker fix)
    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const lastManualUpdate = useRef<number>(0); // Timestamp of last manual action
    const isUpdatingRef = useRef(false); // Flag if an update request is in flight

    useEffect(() => {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const gId = params.get('gameId');
        const oKey = params.get('organizerKey');

        setGameId(gId);
        setOrganizerKey(oKey);

        if (gId) {
            fetchGame(gId);
            // Start Polling every 3 seconds
            pollInterval.current = setInterval(() => fetchGame(gId), 3000);

            // Generate short link for player view
            const longLink = `${window.location.href.split('#')[0]}#gameId=${gId}`;
            fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longLink)}`)
                .then(res => res.text())
                .then(text => {
                    if (!text.toLowerCase().includes('error')) setShortPlayerLink(text);
                    else setShortPlayerLink(longLink);
                })
                .catch(() => setShortPlayerLink(longLink));

        } else {
            setError("No game ID found in URL.");
            setLoading(false);
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
            if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
        };
    }, []);

    // Watch for new history events to trigger sounds/animations
    useEffect(() => {
        if (game && game.history.length > lastHistoryLen.current) {
            const isNewGame = lastHistoryLen.current === 0;
            lastHistoryLen.current = game.history.length;

            // Don't play sounds on initial load
            if (isNewGame) return;

            const latestEvent = game.history[game.history.length - 1];
            
            // Determine event type from string (basic parsing)
            if (latestEvent.includes('opened')) {
                if (soundEnabled) playAudio('open');
                // Extract info for overlay
                const match = latestEvent.match(/^(.*) opened \[(.*)\]!$/);
                if (match) {
                    setOverlayMessage({ title: 'GIFT OPENED!', subtitle: `${match[1]} opened ${match[2]}`, type: 'open' });
                } else {
                    setOverlayMessage({ title: 'GIFT OPENED!', subtitle: latestEvent, type: 'open' });
                }
            } else if (latestEvent.includes('stole')) {
                if (soundEnabled) playAudio('steal');
                const match = latestEvent.match(/^(.*) stole \[(.*)\] from (.*)!$/);
                if (match) {
                    setOverlayMessage({ title: 'STOLEN!', subtitle: `${match[1]} stole ${match[2]} from ${match[3]}`, type: 'steal' });
                } else {
                     setOverlayMessage({ title: 'STOLEN!', subtitle: latestEvent, type: 'steal' });
                }
            } else {
                if (soundEnabled) playAudio('turn');
            }

            // Clear any existing timeout to prevent flickering/early dismissal
            if (overlayTimeoutRef.current) {
                clearTimeout(overlayTimeoutRef.current);
            }
            
            // Set new timeout to clear overlay after 5 seconds (increased from 3.5s)
            overlayTimeoutRef.current = setTimeout(() => {
                setOverlayMessage(null);
                overlayTimeoutRef.current = null;
            }, 5000);
        }
    }, [game, soundEnabled]);

    const fetchGame = async (id: string) => {
        // SKIP polling if we just manually updated the state recently (within 2 seconds)
        // OR if a manual update is currently in progress.
        if (Date.now() - lastManualUpdate.current < 2000 || isUpdatingRef.current) {
            return;
        }

        try {
            const data = await getGameState(id);
            if (data) {
                setGame(prev => {
                    if (prev && data.history.length < prev.history.length && !data.isFinished) {
                         return prev;
                    }
                    return data;
                });
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch game:", err);
        }
    };

    const handleUpdate = async (action: 'next_player' | 'log_steal' | 'log_open' | 'undo' | 'start_game' | 'end_game', payload?: any) => {
        if (!gameId || !organizerKey) return;
        
        setIsActionLoading(true);
        isUpdatingRef.current = true;
        lastManualUpdate.current = Date.now();

        try {
            const updatedGame = await updateGameState(gameId, organizerKey, action, payload);
            if (updatedGame) {
                setGame(updatedGame);
                lastHistoryLen.current = updatedGame.history.length;
                trackEvent(`we_action_${action}`);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update game.");
        } finally {
            setIsActionLoading(false);
            isUpdatingRef.current = false;
            setShowStealModal(false);
            setShowOpenModal(false);
            setShowEndGameModal(false);
            setOpenGiftDescription('');
            setStealGift('');
            setStealTargetId('');
        }
    };

    const currentPlayer = game && !game.isFinished ? game.turnOrder[game.currentPlayerIndex] : null;
    const isOrganizer = !!organizerKey;

    const handleLogOpen = () => {
        if (!currentPlayer) return;
        const giftName = openGiftDescription || 'a Mystery Gift';
        
        trackEvent('we_gift_revealed', { 
            gift_name: giftName.trim().toLowerCase() 
        });

        handleUpdate('log_open', { 
            entry: `${currentPlayer.name} opened [${giftName}]!`,
            actorId: currentPlayer.id,
            gift: giftName
        });
    };

    const handleLogSteal = () => {
        if (!stealTargetId || !stealGift) return;
        
        const thief = currentPlayer?.id === stealActorId ? currentPlayer : game?.participants.find(p => p.id === stealActorId);
        const victim = game?.participants.find(p => p.id === stealTargetId);
        
        if (!thief || !victim) return;

        handleUpdate('log_steal', {
            entry: `${thief.name} stole [${stealGift}] from ${victim.name}!`,
            thiefId: thief.id,
            victimId: victim.id,
            gift: stealGift
        });
    };

    // --- UI Sub-Components ---

    const EventBadge = ({ text }: { text: string }) => {
        if (text.includes('stole')) {
            return <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded font-bold mr-2 border border-red-200">STEAL</span>;
        }
        if (text.includes('opened')) {
             return <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-bold mr-2 border border-emerald-200">OPEN</span>;
        }
        if (text.includes('turn')) {
             return <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold mr-2 border border-blue-200">TURN</span>;
        }
        return <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-bold mr-2 border border-slate-200">GAME</span>;
    };

    const BigAnimationOverlay = () => {
        if (!overlayMessage) return null;
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"></div>
                <div className={`relative bg-white p-8 md:p-12 rounded-3xl shadow-2xl border-4 text-center transform transition-all scale-100 animate-bounce-in ${overlayMessage.type === 'steal' ? 'border-red-500 text-red-600' : 'border-emerald-500 text-emerald-600'}`}>
                    <div className="text-6xl md:text-8xl mb-4">{overlayMessage.type === 'steal' ? '😈' : '🎁'}</div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2 drop-shadow-sm">{overlayMessage.title}</h1>
                    <p className="text-xl md:text-3xl font-bold text-slate-700">{overlayMessage.subtitle}</p>
                </div>
            </div>
        );
    };
    
    // Copy Helper
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Link copied!");
            trackEvent('copy_link', { link_type: 'dashboard_share' });
        });
    };
    
    // Progress Bar Component
    const GameProgressBar = () => {
        if (!game || !game.isStarted || game.isFinished) return null;
        
        const totalTurns = game.turnOrder.length;
        const currentTurnNum = game.currentPlayerIndex + 1;
        const progressPercent = (currentTurnNum / totalTurns) * 100;

        return (
            <div className="mb-6 px-1">
               <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                   <span>Progress</span>
                   <span>{game.finalRound ? 'Final Round!' : `Turn ${currentTurnNum} of ${totalTurns}`}</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                   <div 
                        className={`h-full transition-all duration-700 ease-out ${game.finalRound ? 'bg-purple-500' : 'bg-blue-500'}`} 
                        style={{ width: `${game.finalRound ? 100 : progressPercent}%` }}
                    ></div>
               </div>
            </div>
        );
    };

    // ... Rendering ...
    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold text-xl animate-pulse">Loading Game...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold text-xl">{error}</div>;
    if (!game) return <div className="min-h-screen flex items-center justify-center text-slate-500">Game not found.</div>;

    // Calculate links
    const currentUrl = window.location.href.split('#')[0];
    const fullOrganizerLink = `${currentUrl}#gameId=${gameId}&organizerKey=${organizerKey}`;
    const playerLink = shortPlayerLink || `${currentUrl}#gameId=${gameId}`;

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <BigAnimationOverlay />
            <Header />
            
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                
                {/* ORGANIZER ONLY: Link Sharing Section */}
                {isOrganizer && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                        {/* Box 1: Master Key (Private) */}
                        <div className="bg-amber-50 border-2 border-amber-200 border-dashed rounded-xl p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold">
                                    <Lock size={18} /> Organizer Master Key
                                </div>
                                <p className="text-amber-700 text-sm mb-4">
                                    This is your private control panel. <span className="font-extrabold underline">Do not share this link</span> or players will be able to control the game!
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded border border-amber-200">
                                <input type="text" readOnly value={fullOrganizerLink} className="flex-1 text-xs text-slate-500 truncate outline-none" />
                                <button onClick={() => copyToClipboard(fullOrganizerLink)} className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded transition-colors text-xs font-bold flex items-center gap-1">
                                    <Copy size={14}/> Copy
                                </button>
                            </div>
                        </div>

                        {/* Box 2: Player Link (Public) */}
                        <div className="bg-indigo-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-[1.01] transition-transform relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-white/10 p-8 rounded-full -mr-10 -mt-10"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 font-bold text-lg text-indigo-100">
                                    <Smartphone size={22} /> Player Dashboard Link
                                </div>
                                <p className="text-indigo-100 text-sm mb-4 opacity-90 leading-relaxed">
                                    <span className="font-bold bg-indigo-500 px-1.5 py-0.5 rounded text-white text-xs mr-1 align-middle">FOR ZOOM/TEAMS</span> 
                                    Share this view on your screen so everyone can see the animations! Send the link below to phones for individual updates.
                                </p>
                                <div className="flex items-center gap-2 bg-indigo-800/50 p-2 rounded border border-indigo-400/30">
                                    <input type="text" readOnly value={playerLink} className="flex-1 text-xs text-indigo-200 bg-transparent truncate outline-none font-mono" />
                                    <button onClick={() => copyToClipboard(playerLink)} className="p-2 bg-white text-indigo-700 hover:bg-indigo-50 rounded transition-colors text-xs font-bold flex items-center gap-1 shadow-sm">
                                        <Share2 size={14}/> Copy Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dashboard Header */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 font-serif">
                                {game.groupName || 'White Elephant Party'}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                                <span className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${game.isFinished ? 'bg-red-100 text-red-700' : game.isStarted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    <span className={`w-2 h-2 rounded-full ${game.isFinished ? 'bg-red-500' : game.isStarted ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
                                    {game.isFinished ? 'Game Over' : game.isStarted ? 'Live Game' : 'Setup Mode'}
                                </span>
                                {game.eventDetails && <span className="text-slate-500 border-l pl-3">{game.eventDetails}</span>}
                                
                                {/* Sound Toggle */}
                                <button 
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all ${soundEnabled ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                >
                                    {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                    {soundEnabled ? 'Sound On' : 'Enable Sound'}
                                </button>
                            </div>
                        </div>
                        {isOrganizer && (
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => { trackEvent('download_turn_numbers'); generateWETurnNumbersPdf(game.participants.length); }} 
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-semibold text-sm flex items-center gap-2 transition-colors" 
                                    title="Print Turn Numbers"
                                >
                                    <Download size={16} /> Turn #s
                                </button>
                                <button 
                                    onClick={() => { trackEvent('download_rules'); generateWERulesPdf(game.rules, game.theme, game.groupName, game.eventDetails); }} 
                                    className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg border border-emerald-200 font-semibold text-sm flex items-center gap-2 transition-colors" 
                                    title="Print Rules"
                                >
                                    <FileText size={16} /> Rules
                                </button>
                                <button 
                                    onClick={() => { trackEvent('download_summary'); generateWEGameLogPdf(game.history, game.participants, game.giftState, game.groupName, game.eventDetails); }} 
                                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg border border-blue-200 font-semibold text-sm flex items-center gap-2 transition-colors" 
                                    title="Game Report"
                                >
                                    <BarChart3 size={16} /> Summary
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Turn Order & Participants (4 cols) */}
                    <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-[600px]">
                             <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <Users className="text-slate-400" size={18} /> Turn Order
                                </h3>
                                <span className="text-xs font-bold text-slate-400 uppercase">{game.participants.length} Players</span>
                            </div>
                            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                                {game.turnOrder.map((p, i) => {
                                    const isCurrent = i === game.currentPlayerIndex && !game.isFinished && game.isStarted;
                                    const hasGone = i < game.currentPlayerIndex || game.isFinished;
                                    const gift = game.giftState[p.id];
                                    
                                    return (
                                        <div key={p.id} id={`player-${i}`} className={`relative p-3 rounded-xl border transition-all duration-300 ${isCurrent ? 'bg-blue-50 border-blue-400 shadow-md scale-[1.02] z-10' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isCurrent ? 'bg-blue-600 text-white' : hasGone ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    {i + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={`font-bold truncate ${isCurrent ? 'text-blue-800 text-lg' : hasGone ? 'text-slate-700' : 'text-slate-500'}`}>
                                                            {p.name}
                                                        </p>
                                                        {hasGone && <CheckCircle size={16} className="text-emerald-500 ml-2 flex-shrink-0" />}
                                                    </div>
                                                    {gift && (
                                                        <div className="mt-1 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold w-fit">
                                                            <Gift size={12} /> {gift}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {isCurrent && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-blue-500 rounded-r-full"></div>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                         {isOrganizer && (
                            <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
                                <h3 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wider">Quick QR Join</h3>
                                <div className="flex justify-center bg-white p-4 rounded-xl border border-slate-200 mb-3">
                                    <QRCode value={playerLink} size={120} />
                                </div>
                                <p className="text-xs text-slate-400">Scan to open player view</p>
                            </div>
                        )}
                    </div>


                    {/* MIDDLE/RIGHT COLUMN: Active Game Area (8 cols) */}
                    <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
                        
                        {/* Big Active Card */}
                        <div className="bg-white rounded-3xl shadow-xl border-2 border-indigo-100 overflow-hidden relative">
                            <div className={`absolute top-0 left-0 w-full h-2 ${game.finalRound ? 'bg-purple-500' : game.isFinished ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}></div>
                            
                            <div className="p-8 md:p-12 text-center relative">
                                
                                <GameProgressBar />

                                <div className="inline-block px-4 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
                                    {game.isFinished ? 'Game Summary' : game.isStarted ? (game.finalRound ? 'Final Round' : 'Live Game') : 'Waiting Room'}
                                </div>
                                
                                <h2 className="text-slate-400 text-lg md:text-xl font-medium mb-2">
                                    {game.isFinished ? 'The game has ended!' : game.isStarted ? 'It is currently' : 'Waiting for organizer to start...'}
                                </h2>
                                
                                <div className={`text-5xl md:text-7xl font-black font-serif mb-6 tracking-tight ${game.finalRound ? 'text-purple-600' : 'text-indigo-600'}`}>
                                    {game.isFinished ? 'All Done!' : game.isStarted ? `${currentPlayer?.name}'s Turn!` : 'Not Started'}
                                </div>

                                {/* Action Buttons (Organizer Only) */}
                                {isOrganizer && !game.isFinished && (
                                    <div className="flex flex-wrap justify-center gap-4 mt-8 relative z-20">
                                        {!game.isStarted ? (
                                            <button 
                                                onClick={() => handleUpdate('start_game')}
                                                disabled={isActionLoading}
                                                className="py-4 px-10 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl text-xl flex items-center gap-3 transition-all transform hover:-translate-y-1"
                                            >
                                                Start The Game <Play fill="currentColor" />
                                            </button>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => {
                                                        setStealActorId(currentPlayer?.id || '');
                                                        setStealGift('');
                                                        setStealTargetId('');
                                                        setShowStealModal(true);
                                                    }}
                                                    disabled={isActionLoading}
                                                    className="py-3 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
                                                >
                                                    <RefreshCw size={20} /> Log Steal
                                                </button>
                                                 <button 
                                                    onClick={() => {
                                                        setOpenGiftDescription('');
                                                        setShowOpenModal(true);
                                                    }}
                                                    disabled={isActionLoading}
                                                    className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
                                                >
                                                    <Gift size={20} /> Log Open
                                                </button>
                                                <div className="w-full sm:w-auto border-l border-slate-200 pl-4 ml-2 flex gap-2">
                                                     <button 
                                                        onClick={() => handleUpdate('next_player')}
                                                        disabled={isActionLoading}
                                                        className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all hover:shadow-blue-200/50"
                                                    >
                                                        Next Player <ArrowRight size={20} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdate('undo')}
                                                        className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                                                        title="Undo Last Action"
                                                    >
                                                        <RotateCcw size={20} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Live Ticker */}
                        <div className="bg-white rounded-2xl shadow-sm border flex flex-col h-[400px]">
                             <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                                <History className="text-purple-500" /> 
                                <h3 className="font-bold text-slate-700">Live Ticker</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col-reverse">
                                {game.history.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 italic">
                                        Game events will appear here...
                                    </div>
                                )}
                                {game.history.map((entry, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 animate-fade-in shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5"><EventBadge text={entry} /></div>
                                            <div className="text-sm md:text-base leading-relaxed">
                                                {entry}
                                            </div>
                                        </div>
                                        <div className="text-right mt-1">
                                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Event #{i + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {isOrganizer && (
                             <div className="text-right">
                                <button 
                                    onClick={() => setShowEndGameModal(true)}
                                    className="text-red-500 text-xs font-bold hover:underline opacity-60 hover:opacity-100"
                                >
                                    Force End Game
                                </button>
                            </div>
                        )}

                        <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="7777777777" data-ad-format="auto" data-full-width-responsive="true" />
                    </div>
                </div>
            </main>
            <Footer />
            
            {/* MODALS */}
            {showOpenModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                        <div className="flex items-center gap-3 mb-4 text-emerald-600">
                            <Gift size={28} />
                            <h3 className="text-2xl font-bold font-serif">What did they open?</h3>
                        </div>
                        
                        <p className="text-slate-500 text-sm mb-1">Player: <strong className="text-slate-800">{currentPlayer?.name}</strong></p>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="e.g. Blue Bluetooth Speaker" 
                            value={openGiftDescription}
                            onChange={e => setOpenGiftDescription(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogOpen()}
                            className="w-full p-4 border-2 border-emerald-100 focus:border-emerald-500 rounded-xl text-lg mb-6 outline-none transition-colors bg-emerald-50/30"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowOpenModal(false)} className="px-5 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                            <button onClick={handleLogOpen} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200">Log "Opened Gift"</button>
                        </div>
                    </div>
                </div>
            )}

             {showStealModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center gap-3 mb-6 text-amber-600">
                            <RefreshCw size={28} />
                            <h3 className="text-2xl font-bold font-serif">Log a Steal</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Who is stealing?</label>
                                <select 
                                    value={stealActorId} 
                                    onChange={e => setStealActorId(e.target.value)}
                                    className="w-full p-3 border rounded-xl bg-slate-50 font-bold text-slate-700"
                                >
                                     {game.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-center text-slate-300">
                                <div className="border-l-2 border-dashed h-6"></div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stealing FROM whom?</label>
                                <select 
                                    value={stealTargetId} 
                                    onChange={e => {
                                        setStealTargetId(e.target.value);
                                        setStealGift(game.giftState[e.target.value] || '');
                                    }}
                                    className="w-full p-3 border rounded-xl bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                     <option value="">-- Select Victim --</option>
                                     {game.participants.filter(p => p.id !== stealActorId && game.giftState[p.id]).map(p => (
                                         <option key={p.id} value={p.id}>{p.name} (Has: {game.giftState[p.id]})</option>
                                     ))}
                                </select>
                            </div>
                        </div>
                        
                        {stealGift && (
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-center">
                                <span className="text-xs text-amber-600 font-bold uppercase">The Gift Being Stolen</span>
                                <div className="text-lg font-bold text-amber-900 mt-1">{stealGift}</div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowStealModal(false)} className="px-5 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                            <button onClick={handleLogSteal} disabled={!stealTargetId} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-200 disabled:opacity-50 disabled:shadow-none">Confirm Steal</button>
                        </div>
                    </div>
                </div>
            )}
            
            <ConfirmationModal 
                isOpen={showEndGameModal}
                onClose={() => setShowEndGameModal(false)}
                onConfirm={() => handleUpdate('end_game')}
                title="End Game?"
                message="This will mark the game as finished. You can't undo this."
                confirmText="End Game"
            />

            <style>{`
                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                
                /* Animation Classes */
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
                .animate-bounce-in { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
                
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes bounceIn { 
                    0% { opacity: 0; transform: scale(0.3); } 
                    50% { opacity: 1; transform: scale(1.05); } 
                    70% { transform: scale(0.9); } 
                    100% { transform: scale(1); } 
                }
            `}</style>
        </div>
    );
};

export default WhiteElephantDashboard;
