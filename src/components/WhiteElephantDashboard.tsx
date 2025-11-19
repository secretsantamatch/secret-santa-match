
import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import Footer from './Footer';
import { getGameState, updateGameState } from '../services/whiteElephantService';
import { generateWETurnNumbersPdf, generateWERulesPdf, generateWEGameLogPdf } from '../services/pdfService';
import type { WEGame } from '../types';
import { Loader2, ArrowRight, RotateCw, Copy, Check, Users, Shield, History, Download, FileText, Printer, Save, X, Tv, Gift, Building, Calendar } from 'lucide-react';

const WhiteElephantDashboard: React.FC = () => {
    const [game, setGame] = useState<WEGame | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [masterLinkCopied, setMasterLinkCopied] = useState(false);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);
    
    // Logging State
    const [stealActor, setStealActor] = useState('');
    const [stealTarget, setStealTarget] = useState('');
    const [stealGift, setStealGift] = useState('');
    const [customLog, setCustomLog] = useState('');

    const { gameId, organizerKey } = useMemo(() => {
        const params = new URLSearchParams(window.location.hash.slice(1));
        return {
            gameId: params.get('gameId'),
            organizerKey: params.get('organizerKey')
        };
    }, []);

    const isOrganizer = !!organizerKey;

    useEffect(() => {
        if (!gameId) {
            setError("Game ID not found. Please check your link.");
            setIsLoading(false);
            return;
        }

        const fetchGame = async () => {
            try {
                const data = await getGameState(gameId);
                if (!data) throw new Error("Game not found.");
                setGame(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load game.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGame();
        // Poll every 3 seconds for near-realtime updates
        const interval = setInterval(fetchGame, 3000);
        return () => clearInterval(interval);
    }, [gameId]);

    const handleUpdate = async (action: 'next_player' | 'log_steal' | 'undo' | 'start_game' | 'end_game', payload?: any) => {
        if (!gameId || !organizerKey || !game) return;
        setIsUpdating(true);
        try {
            const updatedGame = await updateGameState(gameId, organizerKey, action, payload);
            setGame(updatedGame);
            setShowActionModal(false);
            // Reset log form
            setStealActor('');
            setStealTarget('');
            setStealGift('');
            setCustomLog('');
        } catch (err) {
            alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleSmartLog = () => {
        if (stealActor && stealTarget && stealGift) {
            handleUpdate('log_steal', { entry: `${stealActor} STOLE [${stealGift}] from ${stealTarget}!` });
        } else if (customLog) {
            handleUpdate('log_steal', { entry: customLog });
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

    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-12 w-12 text-blue-600" /></div>;
    if (error) return <div className="text-center p-8"><h2 className="text-xl font-bold text-red-600">Error</h2><p>{error}</p></div>;
    if (!game) return <div className="text-center p-8"><h2 className="text-xl font-bold">Game Not Found</h2></div>;

    const currentPlayer = game.turnOrder[game.currentPlayerIndex];

    return (
        <div className="bg-slate-100 min-h-screen font-sans">
            <Header />
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                
                {/* HEADER INFO (Visible to All) */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 font-serif">{game.groupName || 'White Elephant Party'}</h1>
                        {game.eventDetails && (
                            <p className="text-slate-500 flex items-center gap-2 text-sm mt-1"><Calendar size={14}/> {game.eventDetails}</p>
                        )}
                    </div>
                    <div className="mt-2 md:mt-0 flex gap-2">
                         <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            Theme: {game.theme}
                         </span>
                         <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                            Steals: {game.rules.stealLimit}
                         </span>
                    </div>
                </div>

                {isOrganizer && (
                    <div className="mb-8 space-y-6 animate-fade-in">
                        {/* Master Link Box */}
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

                        {/* Organizer Command Center */}
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
                                <button onClick={handleCopyShareLink} className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
                                    {shareLinkCopied ? <Check size={16} /> : <Tv size={16} />}
                                    {shareLinkCopied ? 'Link Copied!' : 'Copy Shareable Game Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Panel: Turn Order */}
                    <div className="lg:col-span-1 order-2 lg:order-1">
                        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
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
                                            <span className={`font-semibold ${index === game.currentPlayerIndex ? 'text-blue-900' : 'text-slate-600'}`}>{p.name}</span>
                                            {index < game.currentPlayerIndex && <Check size={16} className="ml-auto text-green-500" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500 italic">
                                        <p>The turn order will be revealed when the game starts!</p>
                                        <div className="mt-4 space-y-2">
                                            {game.participants.map(p => <div key={p.id} className="text-sm font-medium">{p.name}</div>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Center Panel: Live Game Board */}
                    <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border-2 border-blue-100 text-center relative overflow-hidden min-h-[400px] flex flex-col justify-center">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                            
                            {!game.isStarted ? (
                                <div className="py-8">
                                    <div className="inline-block p-4 rounded-full bg-blue-50 text-blue-600 mb-6"><Gift size={48} /></div>
                                    <h1 className="text-4xl md:text-6xl font-extrabold font-serif text-slate-800 mb-4">Waiting for Host...</h1>
                                    <p className="text-xl text-slate-500 mb-8">The game has not started yet.</p>
                                    {isOrganizer ? (
                                        <button onClick={() => handleUpdate('start_game')} disabled={isUpdating} className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 px-10 rounded-full shadow-lg transform hover:scale-105 transition-all">
                                            Start Game! 🚀
                                        </button>
                                    ) : (
                                        <p className="text-sm text-slate-400 animate-pulse">Please wait for the organizer to begin.</p>
                                    )}
                                </div>
                            ) : !game.isFinished ? (
                                <div>
                                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
                                        {game.finalRound ? "Final Steal Round" : "Live Game"}
                                    </span>
                                    <p className="text-xl text-slate-500 mb-2">It is currently</p>
                                    <h1 className="text-5xl md:text-7xl font-extrabold font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-10 pb-2">
                                        {currentPlayer.name}'s Turn!
                                    </h1>
                                    
                                    {isOrganizer && (
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
                                            <button onClick={() => handleUpdate('next_player')} disabled={isUpdating} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95">
                                                Next Player <ArrowRight />
                                            </button>
                                            <button onClick={() => setShowActionModal(true)} className="flex-1 bg-amber-400 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-md transition-colors">
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
                                    <button onClick={() => generateWEGameLogPdf(game.history, game.groupName, game.eventDetails)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-lg inline-flex items-center gap-2 transition-colors">
                                        <Download size={20} /> Download Game Log PDF
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Game History Log */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4"><History className="text-purple-500"/> Game Log</h2>
                             <div className="bg-slate-50 rounded-xl p-4 h-48 overflow-y-auto space-y-3 border border-slate-100">
                                {game.history.slice().reverse().map((entry, i) => (
                                    <div key={i} className="text-sm text-slate-700 pb-2 border-b border-slate-200 last:border-0 flex gap-3">
                                        <span className="font-mono text-xs text-slate-400 mt-0.5">[{game.history.length - i}]</span>
                                        <span>{entry}</span>
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
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => handleUpdate('log_steal', { entry: `${currentPlayer.name} opened a new gift!` })} className="p-4 bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 font-bold rounded-xl text-left flex items-center gap-4 transition-all hover:shadow-md group">
                                <span className="text-2xl group-hover:scale-110 transition-transform">🎁</span> Opened a Gift
                            </button>
                            
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                                <div className="font-bold text-red-800 flex items-center gap-2"><span className="text-xl">😈</span> Log a Steal</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <select className="p-2 border rounded text-sm" value={stealActor} onChange={e => setStealActor(e.target.value)}>
                                        <option value="">Who Stole?</option>
                                        {game.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                    <select className="p-2 border rounded text-sm" value={stealTarget} onChange={e => setStealTarget(e.target.value)}>
                                        <option value="">From Whom?</option>
                                        {game.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <input type="text" placeholder="What Gift? (e.g. Wine)" className="w-full p-2 border rounded text-sm" value={stealGift} onChange={e => setStealGift(e.target.value)} />
                                <button onClick={handleSmartLog} disabled={!stealActor || !stealTarget || !stealGift} className="w-full bg-red-600 text-white font-bold py-2 rounded disabled:opacity-50 hover:bg-red-700">Log Steal</button>
                            </div>
                        </div>
                         <div className="mt-6 pt-4 border-t">
                             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Custom Note</label>
                             <div className="flex gap-2">
                                 <input type="text" value={customLog} onChange={e => setCustomLog(e.target.value)} placeholder="e.g. Grandma loved the socks" className="flex-1 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                 <button onClick={() => { if(customLog) handleUpdate('log_steal', { entry: customLog }); }} className="bg-slate-800 hover:bg-slate-900 text-white px-6 rounded-lg text-sm font-bold transition-colors">Add</button>
                             </div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhiteElephantDashboard;
