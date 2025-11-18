import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import Footer from './Footer';
import { getGameState, updateGameState } from '../services/whiteElephantService';
import { generateWETurnNumbersPdf, generateWERulesPdf } from '../services/pdfService';
import type { WEGame } from '../types';
import { Loader2, ArrowRight, RotateCw, Copy, Check, Users, Shield, History, Download, FileText, Printer, Save, X } from 'lucide-react';

const WhiteElephantDashboard: React.FC = () => {
    const [game, setGame] = useState<WEGame | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [masterLinkCopied, setMasterLinkCopied] = useState(false);

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
        if (!isOrganizer) {
            const interval = setInterval(fetchGame, 5000); // Poll every 5s for participants
            return () => clearInterval(interval);
        }
    }, [gameId, isOrganizer]);

    const handleUpdate = async (action: 'next_player' | 'log_steal' | 'undo' | 'start_game' | 'end_game', payload?: any) => {
        if (!gameId || !organizerKey || !game) return;
        setIsUpdating(true);
        try {
            const updatedGame = await updateGameState(gameId, organizerKey, action, payload);
            setGame(updatedGame);
            setShowActionModal(false);
        } catch (err) {
            alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleCopyMasterLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setMasterLinkCopied(true);
        setTimeout(() => setMasterLinkCopied(false), 2000);
    };

    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-12 w-12 text-blue-600" /></div>;
    if (error) return <div className="text-center p-8"><h2 className="text-xl font-bold text-red-600">Error</h2><p>{error}</p></div>;
    if (!game) return <div className="text-center p-8"><h2 className="text-xl font-bold">Game Not Found</h2></div>;

    const currentPlayer = game.turnOrder[game.currentPlayerIndex];

    return (
        <div className="bg-slate-100 min-h-screen">
            <Header />
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                {isOrganizer && (
                    <div className="mb-8 space-y-6">
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

                        {/* Organizer Toolbar */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-700 font-bold">
                                <Shield className="text-blue-600" /> Organizer Command Center
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => generateWETurnNumbersPdf(game.turnOrder.length)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-lg border transition-colors">
                                    <Printer size={16} /> Print Turn #s
                                </button>
                                <button onClick={() => generateWERulesPdf(game.rules, game.theme)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-lg border transition-colors">
                                    <FileText size={16} /> Print Rules
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Panel: Turn Order */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 h-full">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b"><Users className="text-blue-500"/> Turn Order</h2>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                {game.turnOrder.map((p, index) => (
                                    <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${index === game.currentPlayerIndex && game.isStarted && !game.isFinished ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'bg-slate-50 text-slate-600'}`}>
                                        <span className={`font-bold w-8 h-8 flex items-center justify-center rounded-full ${index === game.currentPlayerIndex && game.isStarted ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-500'}`}>{index + 1}</span>
                                        <span className="font-semibold truncate">{p.name}</span>
                                        {index < game.currentPlayerIndex && <Check size={16} className="ml-auto opacity-50" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center Panel: Live Game Board */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border-2 border-blue-100 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                            
                            {!game.isStarted ? (
                                <div className="py-8">
                                    <h1 className="text-4xl md:text-6xl font-extrabold font-serif text-slate-800 mb-4">Waiting to Start</h1>
                                    <p className="text-xl text-slate-500 mb-8">Gather everyone around! The game will begin shortly.</p>
                                    {isOrganizer && (
                                        <button onClick={() => handleUpdate('start_game')} disabled={isUpdating} className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 px-10 rounded-full shadow-lg transform hover:scale-105 transition-all">
                                            Start Game! 🚀
                                        </button>
                                    )}
                                </div>
                            ) : !game.isFinished ? (
                                <div>
                                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full mb-4">LIVE</span>
                                    <p className="text-xl text-slate-500 mb-2">It is currently</p>
                                    <h1 className="text-5xl md:text-7xl font-extrabold font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-8 pb-2">
                                        {currentPlayer.name}'s Turn!
                                    </h1>
                                    
                                    {isOrganizer && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                                            <button onClick={() => handleUpdate('next_player')} disabled={isUpdating} className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2">
                                                Next Player <ArrowRight />
                                            </button>
                                            <button onClick={() => setShowActionModal(true)} className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold py-3 rounded-xl">
                                                Log Action
                                            </button>
                                            <button onClick={() => handleUpdate('undo')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                                                <RotateCw size={18}/> Undo
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8">
                                    <h1 className="text-5xl font-bold font-serif text-slate-800 mb-4">Game Over!</h1>
                                    <p className="text-xl text-slate-600">Thanks for playing!</p>
                                </div>
                            )}
                        </div>

                        {/* Game History Log */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4"><History className="text-purple-500"/> Game Log</h2>
                             <div className="bg-slate-50 rounded-xl p-4 h-48 overflow-y-auto space-y-3 border border-slate-100">
                                {game.history.slice().reverse().map((entry, i) => (
                                    <div key={i} className="text-sm text-slate-700 pb-2 border-b border-slate-200 last:border-0">
                                        <span className="font-mono text-xs text-slate-400 mr-2">[{game.history.length - i}]</span>
                                        {entry}
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Log an Event</h3>
                            <button onClick={() => setShowActionModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => handleUpdate('log_steal', { entry: `${currentPlayer.name} opened a new gift!` })} className="p-4 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded-xl text-left flex items-center gap-3 transition-colors">
                                <span className="text-2xl">🎁</span> Opened a Gift
                            </button>
                            <button onClick={() => handleUpdate('log_steal', { entry: `${currentPlayer.name} STOLE a gift!` })} className="p-4 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-xl text-left flex items-center gap-3 transition-colors">
                                <span className="text-2xl">😈</span> Stole a Gift
                            </button>
                             <button onClick={() => handleUpdate('log_steal', { entry: `${currentPlayer.name} swapped gifts.` })} className="p-4 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-xl text-left flex items-center gap-3 transition-colors">
                                <span className="text-2xl">🔄</span> Swapped Gift
                            </button>
                        </div>
                         <div className="mt-4 pt-4 border-t">
                             <label className="block text-sm font-semibold text-slate-500 mb-1">Custom Note</label>
                             <div className="flex gap-2">
                                 <input type="text" id="customLog" placeholder="e.g. Grandma loved the socks" className="flex-1 p-2 border rounded-lg text-sm" />
                                 <button onClick={() => {
                                     const input = document.getElementById('customLog') as HTMLInputElement;
                                     if(input.value) handleUpdate('log_steal', { entry: input.value });
                                 }} className="bg-slate-800 text-white px-4 rounded-lg text-sm font-bold">Add</button>
                             </div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhiteElephantDashboard;