import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import Footer from './Footer';
import { getGameState, updateGameState } from '../services/whiteElephantService';
import type { WEGame } from '../types';
import { Loader2, ArrowRight, RotateCw, Copy, Check, Users, Shield, History, Info, Download, FileText } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';

const WhiteElephantDashboard: React.FC = () => {
    const [game, setGame] = useState<WEGame | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

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
            setError("Game ID not found in the URL. Please check the link.");
            setIsLoading(false);
            return;
        }

        const fetchGame = async () => {
            try {
                const data = await getGameState(gameId);
                if (!data) throw new Error("Game not found or has been deleted.");
                setGame(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load game data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGame();

        if (!isOrganizer) {
            const interval = setInterval(fetchGame, 8000); // Poll every 8 seconds
            return () => clearInterval(interval);
        }
    }, [gameId, isOrganizer]);

    const handleUpdate = async (action: 'next_player' | 'log_steal' | 'undo' | 'start_game' | 'end_game', payload?: any) => {
        if (!gameId || !organizerKey || !game) return;
        setIsUpdating(true);
        try {
            const updatedGame = await updateGameState(gameId, organizerKey, action, payload);
            setGame(updatedGame);
        } catch (err) {
            alert(`Error updating game: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsUpdating(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
    }
    
    if (error) {
        return <div className="text-center p-8"><h2 className="text-xl font-bold text-red-600">Error</h2><p className="text-slate-600">{error}</p></div>;
    }

    if (!game) {
        return <div className="text-center p-8"><h2 className="text-xl font-bold">Game Not Found</h2></div>;
    }

    const currentPlayer = game.turnOrder[game.currentPlayerIndex];

    return (
        <div className="bg-slate-100 min-h-screen">
            <Header />
            <main className="max-w-6xl mx-auto p-4 md:p-8">
                {isOrganizer && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-r-lg mb-6 flex items-center gap-3">
                        <Shield className="h-8 w-8 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold">You are the Organizer.</h3>
                            <p className="text-sm">Only you can see the admin controls to manage the game.</p>
                        </div>
                    </div>
                )}
                
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Panel: Turn Order & History */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-lg border">
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4"><Users /> Turn Order</h2>
                            <ol className="list-decimal list-inside space-y-2">
                                {game.turnOrder.map((p, index) => (
                                    <li key={p.id} className={`p-2 rounded-md transition-all ${index === game.currentPlayerIndex ? 'bg-blue-100 font-bold text-blue-800 ring-2 ring-blue-300' : 'text-slate-600'}`}>
                                        {p.name}
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg border">
                             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4"><History /> Game History</h2>
                             <div className="space-y-2 text-sm text-slate-500 h-48 overflow-y-auto">
                                {game.history.length > 0 ? game.history.map((entry, i) => <p key={i}>- {entry}</p>) : <p>The game hasn't started yet!</p>}
                             </div>
                        </div>
                    </div>

                    {/* Main Panel: Game State & Controls */}
                    <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-lg border">
                        {!game.isStarted ? (
                             <div className="text-center">
                                <h1 className="text-4xl font-bold font-serif text-slate-800">The Party is About to Start!</h1>
                                <p className="text-slate-600 mt-2">Get ready for some gift-stealing fun!</p>
                                <div className="my-6 p-4 bg-slate-50 rounded-lg border text-left">
                                    <h3 className="font-bold text-lg text-slate-700">Game Rules:</h3>
                                    <p><strong>Theme:</strong> {game.theme}</p>
                                    <p><strong>Steal Limit per Gift:</strong> {game.rules.stealLimit > 0 ? game.rules.stealLimit : 'Unlimited'}</p>
                                    <p><strong>No Immediate Steal-Back:</strong> {game.rules.noStealBack ? 'Enabled' : 'Disabled'}</p>
                                </div>
                                {isOrganizer && (
                                    <button onClick={() => handleUpdate('start_game')} disabled={isUpdating} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg">
                                        {isUpdating ? <Loader2 className="animate-spin"/> : 'Start The Game!'}
                                    </button>
                                )}
                             </div>
                        ) : !game.isFinished ? (
                            <div className="text-center">
                                <p className="text-lg text-slate-500">It's...</p>
                                <h1 className="text-5xl md:text-7xl font-bold font-serif text-blue-600 my-4">{currentPlayer.name}'s Turn!</h1>
                                {isOrganizer && (
                                    <div className="mt-8 p-4 bg-slate-100 rounded-lg border space-y-4">
                                        <h3 className="font-bold">Organizer Controls</h3>
                                        <div className="flex flex-wrap gap-4 justify-center">
                                            <button onClick={() => handleUpdate('next_player')} disabled={isUpdating} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2 justify-center">
                                                Next Player <ArrowRight size={18} />
                                            </button>
                                            <button onClick={() => { const reason = prompt("What happened?"); if (reason) handleUpdate('log_steal', { entry: reason }); }} disabled={isUpdating} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md">Log Action</button>
                                            <button onClick={() => handleUpdate('undo')} disabled={isUpdating} className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2 justify-center">
                                                <RotateCw size={18}/> Undo Last Action
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="text-center">
                                <h1 className="text-4xl font-bold font-serif text-slate-800">Game Over!</h1>
                                <p className="text-slate-600 mt-2">Thanks for playing! We hope you had a blast.</p>
                                {isOrganizer && (
                                     <div className="mt-6">
                                        <h3 className="font-bold text-lg">Post-Game Downloads</h3>
                                        {/* TODO: Add PDF summary download */}
                                        <p className="text-sm text-slate-500">Coming soon: Download a PDF summary of your game!</p>
                                     </div>
                                )}
                             </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default WhiteElephantDashboard;
