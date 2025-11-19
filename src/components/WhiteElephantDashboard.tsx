
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { getGameState, updateGameState } from '../services/whiteElephantService';
import { generateWETurnNumbersPdf, generateWERulesPdf, generateWEGameLogPdf } from '../services/pdfService';
import type { WEGame } from '../types';
import { Loader2, ArrowRight, RotateCw, Copy, Check, Users, Shield, History, Download, FileText, Printer, Save, X, Tv, Gift, Calendar, Volume2, VolumeX, Play } from 'lucide-react';

// --- AUDIO ENGINE ---
// We use a singleton AudioContext to comply with browser policies
let audioCtx: AudioContext | null = null;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

const playSoundEffect = (type: 'open' | 'steal' | 'turn') => {
    const ctx = initAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'open') {
        // Magical Chime (Ascending Arpeggio)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.linearRampToValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.linearRampToValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.linearRampToValueAtTime(1046.50, now + 0.4); // C6
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        
        osc.start(now);
        osc.stop(now + 1.5);
    } else if (type === 'steal') {
        // Dramatic Siren / Whoosh
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1); // Up
        osc.frequency.linearRampToValueAtTime(200, now + 0.4); // Down fast
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    } else {
        // Turn Change (Pop)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }
};

// Helper to categorize events and return a visual badge
const getEventBadge = (text: string) => {
    const badgeClass = "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mr-2 align-middle shadow-sm";
    
    if (text.includes('stole') || text.includes('STEAL')) {
        return <span className={`${badgeClass} bg-red-100 text-red-800 border-red-200`}>Steal</span>;
    }
    if (text.includes('opened')) {
        return <span className={`${badgeClass} bg-green-100 text-green-800 border-green-200`}>Open</span>;
    }
    if (text.includes('turn')) {
        return <span className={`${badgeClass} bg-blue-100 text-blue-800 border-blue-200`}>Turn</span>;
    }
    if (text.includes('started') || text.includes('ended') || text.includes('Game')) {
        return <span className={`${badgeClass} bg-slate-100 text-slate-700 border-slate-200`}>Game</span>;
    }
    return null;
};

const WhiteElephantDashboard: React.FC = () => {
    const [game, setGame] = useState<WEGame | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [masterLinkCopied, setMasterLinkCopied] = useState(false);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    
    // Animation State
    const [overlayEvent, setOverlayEvent] = useState<{ type: 'steal' | 'open' | 'turn', text: string, subtext: string } | null>(null);
    
    // Logging State
    const [stealActorId, setStealActorId] = useState('');
    const [stealTargetId, setStealTargetId] = useState('');
    const [stealGift, setStealGift] = useState('');
    const [customLog, setCustomLog] = useState('');
    const [openGiftDescription, setOpenGiftDescription] = useState('');
    const [logType, setLogType] = useState<'open' | 'steal' | 'custom'>('open');

    // Refs for Concurrency & Sound
    const prevHistoryLength = useRef(0);
    const isUpdatingRef = useRef(false); 
    const lastManualUpdateRef = useRef(0);
    const gameRef = useRef<WEGame | null>(null);

    const { gameId, organizerKey } = useMemo(() => {
        const params = new URLSearchParams(window.location.hash.slice(1));
        return {
            gameId: params.get('gameId'),
            organizerKey: params.get('organizerKey')
        };
    }, []);

    const isOrganizer = !!organizerKey;

    useEffect(() => {
        gameRef.current = game;
    }, [game]);

    // Enable Audio Context on first interaction
    const enableAudio = () => {
        initAudio();
        setAudioEnabled(true);
    };

    useEffect(() => {
        if (!gameId) {
            setError("Game ID not found. Please check your link.");
            setIsLoading(false);
            return;
        }

        const fetchGame = async () => {
            if (isUpdatingRef.current || (Date.now() - lastManualUpdateRef.current < 4000)) {
                return;
            }

            try {
                const data = await getGameState(gameId);
                if (!data) throw new Error("Game not found.");
                
                const localHistoryLen = gameRef.current?.history.length || 0;
                if (data.history.length < localHistoryLen) {
                    console.warn("Ignored stale server data");
                    return;
                }

                setGame(data);
            } catch (err) {
                if (!game) setError(err instanceof Error ? err.message : "Failed to load game.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGame();
        const interval = setInterval(fetchGame, 3000);
        return () => clearInterval(interval);
    }, [gameId]);

    // Event Listener for Sound and Animation
    useEffect(() => {
        if (game) {
            // If it's the first load, just sync the ref, don't play sound
            if (prevHistoryLength.current === 0) {
                prevHistoryLength.current = game.history.length;
                return;
            }

            if (game.history.length > prevHistoryLength.current) {
                const newEntry = game.history[game.history.length - 1];
                
                let type: 'steal' | 'open' | 'turn' | null = null;
                let mainText = '';
                let subText = '';

                if (newEntry.includes('STEAL') || newEntry.includes('stole')) {
                    type = 'steal';
                    mainText = 'STOLEN!';
                    subText = newEntry.replace(/STEAL!|stole/gi, '').trim(); // Simplified text for impact
                    if(subText.includes('[')) {
                         // Extract just the gift if possible for cleaner display
                         // Example: "WWER stole [Socks] from SDF" -> "Socks"
                         const match = subText.match(/\[(.*?)\]/);
                         if(match) subText = match[1];
                    }
                } else if (newEntry.includes('opened')) {
                    type = 'open';
                    mainText = 'GIFT OPENED!';
                    // Extract gift name for big display
                    const match = newEntry.match(/\[(.*?)\]/);
                    subText = match ? match[1] : 'Something New!';
                } else if (newEntry.includes('turn')) {
                    type = 'turn';
                }

                // Play Sound
                if (type && audioEnabled) {
                    playSoundEffect(type);
                }

                // Trigger Overlay
                if (type === 'steal' || type === 'open') {
                    setOverlayEvent({ type, text: mainText, subtext: subText });
                    setTimeout(() => setOverlayEvent(null), 4000);
                }

                prevHistoryLength.current = game.history.length;
            }
        }
    }, [game?.history, audioEnabled]);

    const handleUpdate = async (action: 'next_player' | 'log_steal' | 'log_open' | 'undo' | 'start_game' | 'end_game', payload?: any) => {
        if (!gameId || !organizerKey || !game) return;
        
        setIsUpdating(true);
        isUpdatingRef.current = true;

        // If we are triggering an action, we implicitly enable audio context for the organizer
        if (!audioEnabled) enableAudio();

        try {
            const updatedGame = await updateGameState(gameId, organizerKey, action, payload);
            setGame(updatedGame);
            lastManualUpdateRef.current = Date.now();
            
            setShowActionModal(false);
            setStealActorId('');
            setStealTargetId('');
            setStealGift('');
            setCustomLog('');
            setOpenGiftDescription('');
        } catch (err) {
            alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsUpdating(false);
            isUpdatingRef.current = false;
        }
    };
    
    const currentPlayer = game ? game.turnOrder[game.currentPlayerIndex] : null;

    const handleLogOpen = () => {
        if (!currentPlayer) return;
        const giftName = openGiftDescription || 'a new gift';
        handleUpdate('log_open', { 
            entry: `${currentPlayer.name} opened [${giftName}]!`,
            actorId: currentPlayer.id,
            gift: giftName
        });
    };

    const handleLogSteal = () => {
        if (stealActorId && stealTargetId && stealGift) {
            const actor = game?.participants.find(p => p.id === stealActorId)?.name;
            const target = game?.participants.find(p => p.id === stealTargetId)?.name;
            
            if (actor && target) {
                handleUpdate('log_steal', { 
                    entry: `STEAL! ${actor} stole [${stealGift}] from ${target}!`,
                    thiefId: stealActorId,
                    victimId: stealTargetId,
                    gift: stealGift
                });
            }
        }
    };

    const handleCustomLog = () => {
        if (customLog) {
            handleUpdate('log_steal', { entry: customLog });
        }
    };

    const handleTargetChange = (targetId: string) => {
        setStealTargetId(targetId);
        if (game && targetId && game.giftState && game.giftState[targetId]) {
            setStealGift(game.giftState[targetId]);
        } else {
            setStealGift('');
        }
    };
    
    const handleCopyMasterLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setMasterLinkCopied(true);
        setTimeout(() => setMasterLinkCopied(false), 2000);
    };

    const handleCopyShareLink = () => {
        if (!gameId) return;
        const url = `${window.location.origin}/white-elephant-generator.html#gameId=${gameId}`;
        navigator.clipboard.writeText(url);
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 2000);
    };

    // Test function for organizer to verify animation/sound
    const testAnimation = (type: 'open' | 'steal') => {
        enableAudio();
        playSoundEffect(type);
        setOverlayEvent({ 
            type, 
            text: type === 'open' ? 'GIFT OPENED!' : 'STOLEN!', 
            subtext: type === 'open' ? 'Mystery Box' : 'The Good Blender' 
        });
        setTimeout(() => setOverlayEvent(null), 4000);
    };

    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-12 w-12 text-blue-600" /></div>;
    if (error) return <div className="text-center p-8"><h2 className="text-xl font-bold text-red-600">Error</h2><p>{error}</p></div>;
    if (!game) return <div className="text-center p-8"><h2 className="text-xl font-bold">Game Not Found</h2></div>;

    return (
        <div className="bg-slate-100 min-h-screen font-sans relative" onClick={enableAudio}>
            
            {/* BIG ANIMATION OVERLAY */}
            {overlayEvent && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-none">
                    <div className={`
                        transform transition-all duration-500 scale-100 opacity-100
                        p-12 rounded-[2rem] shadow-2xl text-center border-8 max-w-5xl w-full
                        flex flex-col items-center justify-center min-h-[400px]
                        ${overlayEvent.type === 'steal' ? 'bg-white border-red-500' : 'bg-white border-green-500'}
                    `}>
                        <div className={`text-2xl font-bold mb-4 uppercase tracking-[0.3em] ${overlayEvent.type === 'steal' ? 'text-red-400' : 'text-green-400'}`}>
                            Event Alert
                        </div>
                        <h1 className={`text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 drop-shadow-sm ${overlayEvent.type === 'steal' ? 'text-red-600' : 'text-green-600'}`}>
                            {overlayEvent.text}
                        </h1>
                        {overlayEvent.subtext && (
                            <div className="bg-slate-100 px-8 py-4 rounded-xl">
                                <p className="text-3xl md:text-5xl text-slate-800 font-bold font-serif">
                                    {overlayEvent.subtext}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Header />
            <main className="max-w-[1400px] mx-auto p-4 md:p-6">
                
                {/* HEADER INFO */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 font-serif">{game.groupName || 'White Elephant Party'}</h1>
                        {game.eventDetails && (
                            <p className="text-slate-500 flex items-center gap-2 text-sm mt-1"><Calendar size={14}/> {game.eventDetails}</p>
                        )}
                    </div>
                    <div className="mt-2 md:mt-0 flex gap-2 items-center">
                         <button 
                            onClick={enableAudio} 
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${audioEnabled ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                         >
                            {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                            {audioEnabled ? 'Sound On' : 'Enable Sound'}
                         </button>
                         <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            Theme: {game.theme}
                         </span>
                    </div>
                </div>

                {isOrganizer && (
                    <div className="mb-8 space-y-6 animate-fade-in">
                        <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-amber-100 p-3 rounded-full text-amber-700"><Save size={24} /></div>
                                <div>
                                    <h3 className="font-bold text-amber-900 text-lg">Organizer Master Link</h3>
                                    <p className="text-amber-700 text-sm">Save this URL! It's your only way to access these admin controls.</p>
                                </div>
                            </div>
                            <button onClick={handleCopyMasterLink} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm">
                                {masterLinkCopied ? <Check size={18} /> : <Copy size={18} />}
                                {masterLinkCopied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>

                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                                <Shield className="text-blue-600" /> Organizer Command Center
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                    <button onClick={() => generateWETurnNumbersPdf(game.turnOrder.length)} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white px-3 py-2 rounded-md transition-all">
                                        <Printer size={16} /> Turn #s
                                    </button>
                                    <button onClick={() => generateWERulesPdf(game.rules, game.theme, game.groupName, game.eventDetails)} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white px-3 py-2 rounded-md transition-all">
                                        <FileText size={16} /> Rules
                                    </button>
                                </div>
                                <button onClick={() => testAnimation('open')} className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded-lg transition-colors" title="Test Animation">
                                    <Play size={16} /> Test Anim
                                </button>
                                <button onClick={handleCopyShareLink} className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
                                    {shareLinkCopied ? <Check size={16} /> : <Tv size={16} />}
                                    {shareLinkCopied ? 'Link Copied!' : 'Copy Shareable Game Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Left Panel: Turn Order */}
                    <div className="lg:col-span-1 order-2 lg:order-1">
                        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden sticky top-24">
                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2"><Users size={20}/> Turn Order</h2>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{game.participants.length} Players</span>
                            </div>
                            <div className="max-h-[600px] overflow-y-auto p-2 space-y-1">
                                {game.isStarted ? (
                                    game.turnOrder.map((p, index) => (
                                        <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${index === game.currentPlayerIndex && !game.isFinished ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'hover:bg-slate-50'}`}>
                                            <div className={`font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm ${index === game.currentPlayerIndex && !game.isFinished ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`font-semibold block truncate ${index === game.currentPlayerIndex ? 'text-blue-900' : 'text-slate-600'}`}>{p.name}</span>
                                                {game.giftState && game.giftState[p.id] && (
                                                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 truncate">
                                                        <Gift size={10} /> {game.giftState[p.id]}
                                                    </span>
                                                )}
                                            </div>
                                            {index < game.currentPlayerIndex && <Check size={16} className="ml-auto text-green-500 flex-shrink-0" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500 italic">
                                        <p>Turn order hidden until game starts.</p>
                                        <div className="mt-4 space-y-2 opacity-50">
                                            {game.participants.map(p => <div key={p.id} className="text-sm font-medium">{p.name}</div>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Center Panel: Main Stage */}
                    <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border-2 border-blue-100 text-center relative overflow-hidden min-h-[400px] flex flex-col justify-center">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                            
                            {!game.isStarted ? (
                                <div className="py-8">
                                    <div className="inline-block p-4 rounded-full bg-blue-50 text-blue-600 mb-6"><Gift size={48} /></div>
                                    <h1 className="text-4xl md:text-6xl font-extrabold font-serif text-slate-800 mb-4">Waiting for Host...</h1>
                                    <p className="text-xl text-slate-500 mb-8">The game has not started yet.</p>
                                    
                                    <div className="mb-8 max-w-lg mx-auto">
                                        <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="5555555555" data-ad-format="auto" data-full-width-responsive="true" />
                                    </div>

                                    {isOrganizer && (
                                        <button onClick={() => handleUpdate('start_game')} disabled={isUpdating} className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 px-10 rounded-full shadow-lg transform hover:scale-105 transition-all">
                                            Start Game! 🚀
                                        </button>
                                    )}
                                </div>
                            ) : !game.isFinished ? (
                                <div>
                                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
                                        {game.finalRound ? "Final Steal Round" : "Live Game"}
                                    </span>
                                    <p className="text-xl text-slate-500 mb-2">It is currently</p>
                                    <h1 className="text-5xl md:text-7xl font-extrabold font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-10 pb-2">
                                        {currentPlayer?.name}'s Turn!
                                    </h1>
                                    
                                    {isOrganizer && (
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
                                            <button onClick={() => handleUpdate('next_player')} disabled={isUpdating} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95">
                                                Next Player <ArrowRight />
                                            </button>
                                            <button onClick={() => {
                                                setStealActorId(currentPlayer?.id || '');
                                                setShowActionModal(true);
                                            }} className="flex-1 bg-amber-400 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-md transition-colors">
                                                Log Action
                                            </button>
                                            <button onClick={() => handleUpdate('undo')} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors" title="Undo Last Action">
                                                <RotateCw size={20}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8">
                                    <h1 className="text-5xl font-bold font-serif text-slate-800 mb-4">Game Over!</h1>
                                    <p className="text-xl text-slate-600 mb-8">Thanks for playing!</p>
                                    <div className="flex flex-col items-center gap-6">
                                        <button onClick={() => generateWEGameLogPdf(game.history, game.groupName, game.eventDetails)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-lg inline-flex items-center gap-2 transition-colors">
                                            <Download size={20} /> Download Game Summary PDF
                                        </button>
                                        <div className="w-full max-w-lg">
                                            <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="6666666666" data-ad-format="auto" data-full-width-responsive="true" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Game Ticker */}
                    <div className="lg:col-span-1 order-3">
                         <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden sticky top-24">
                             <div className="bg-slate-50 p-4 border-b border-slate-200">
                                 <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2"><History className="text-purple-500" size={20}/> Live Ticker</h2>
                             </div>
                             <div className="h-[400px] lg:h-[600px] overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                                {game.history.slice().reverse().map((entry, i) => (
                                    <div key={i} className="text-sm text-slate-700 p-3 bg-white rounded-lg border border-slate-100 shadow-sm animate-fade-in leading-relaxed">
                                        <div className="flex items-start">
                                            {getEventBadge(entry)}
                                            <span className="flex-1">{entry}</span>
                                        </div>
                                        <span className="font-mono text-[10px] text-slate-300 block text-right mt-1">#{game.history.length - i}</span>
                                    </div>
                                ))}
                                {game.history.length === 0 && <p className="text-slate-400 italic text-center mt-10">Events will appear here...</p>}
                             </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Log Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowActionModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Log an Event</h3>
                            <button onClick={() => setShowActionModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setLogType('open')} 
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${logType === 'open' ? 'bg-white shadow text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Open Gift
                            </button>
                            <button 
                                onClick={() => setLogType('steal')} 
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${logType === 'steal' ? 'bg-white shadow text-red-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Steal
                            </button>
                            <button 
                                onClick={() => setLogType('custom')} 
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${logType === 'custom' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Custom
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {/* OPEN GIFT TAB */}
                            {logType === 'open' && (
                                <div className="space-y-3 animate-fade-in">
                                    <p className="text-sm text-slate-600">What did {currentPlayer?.name} open?</p>
                                    <input 
                                        type="text" 
                                        placeholder="Gift Description (e.g. Fuzzy Socks)" 
                                        className="w-full p-3 border rounded-lg text-sm"
                                        value={openGiftDescription}
                                        onChange={e => setOpenGiftDescription(e.target.value)}
                                    />
                                    <button onClick={handleLogOpen} className="w-full p-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                        <Gift size={20} /> Log "Opened Gift"
                                    </button>
                                </div>
                            )}
                            
                            {/* STEAL TAB */}
                            {logType === 'steal' && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-bold text-red-800 mb-1">Thief</label>
                                            <select className="w-full p-2 border rounded text-sm" value={stealActorId} onChange={e => setStealActorId(e.target.value)}>
                                                <option value="">Select...</option>
                                                {game.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-red-800 mb-1">Victim</label>
                                            <select className="w-full p-2 border rounded text-sm" value={stealTargetId} onChange={e => handleTargetChange(e.target.value)}>
                                                <option value="">Select...</option>
                                                {game.participants
                                                    .filter(p => p.id !== stealActorId && game.giftState?.[p.id]) // Filter: Only people who HAVE a gift
                                                    .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-red-800 mb-1">Gift</label>
                                        <input 
                                            type="text" 
                                            placeholder="Auto-fills when victim selected" 
                                            className="w-full p-2 border rounded text-sm bg-white" 
                                            value={stealGift} 
                                            onChange={e => setStealGift(e.target.value)} 
                                        />
                                    </div>
                                    <button onClick={handleLogSteal} disabled={!stealActorId || !stealTargetId || !stealGift} className="w-full bg-red-600 text-white font-bold py-2 rounded disabled:opacity-50 hover:bg-red-700">
                                        Log Steal
                                    </button>
                                </div>
                            )}

                            {/* CUSTOM TAB */}
                            {logType === 'custom' && (
                                <div className="space-y-3 animate-fade-in">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Note</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={customLog} onChange={e => setCustomLog(e.target.value)} placeholder="e.g. Grandma loved the socks" className="flex-1 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                        <button onClick={handleCustomLog} className="bg-slate-800 hover:bg-slate-900 text-white px-6 rounded-lg text-sm font-bold transition-colors">Add</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Inline Style for overlay animations */}
            <style>{`
                @keyframes bounce-short {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                .animate-bounce-short { animation: bounce-short 0.5s; }
            `}</style>
        </div>
    );
};

export default WhiteElephantDashboard;
