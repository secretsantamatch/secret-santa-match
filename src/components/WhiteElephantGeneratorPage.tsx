import React, { useState, useEffect } from 'react';
import { produce } from 'immer';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { createGame } from '../services/whiteElephantService';
import type { WEParticipant, WERules, WETheme } from '../types';
import { Users, Settings, PartyPopper, Loader2, PlusCircle, Trash2, ArrowRight } from 'lucide-react';

const WhiteElephantGeneratorPage: React.FC = () => {
    const [participants, setParticipants] = useState<WEParticipant[]>([
        { id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }
    ]);
    const [rules, setRules] = useState<WERules>({ stealLimit: 3, noStealBack: false });
    const [theme, setTheme] = useState<WETheme>('classic');
    const [activeStep, setActiveStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const generatorRef = React.useRef<HTMLDivElement>(null);

    const handleParticipantChange = (id: string, name: string) => {
        const updatedParticipants = produce(participants, draft => {
            const participant = draft.find(p => p.id === id);
            if (participant) participant.name = name;
        });

        const isLastParticipant = participants.findIndex(p => p.id === id) === participants.length - 1;
        const wasEmpty = participants.find(p => p.id === id)?.name.trim() === '';
        
        if (isLastParticipant && wasEmpty && name.trim() !== '') {
            setParticipants([...updatedParticipants, { id: crypto.randomUUID(), name: '' }]);
        } else {
            setParticipants(updatedParticipants);
        }
    };

    const removeParticipant = (id: string) => {
        if (participants.length > 1) {
            setParticipants(participants.filter(p => p.id !== id));
        }
    };

    const handleNextStep = () => {
        if(activeStep < 3) {
            setActiveStep(activeStep + 1);
            generatorRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleGenerate = async () => {
        setError(null);
        const validParticipants = participants.filter(p => p.name.trim() !== '');
        if (validParticipants.length < 2) {
            setError("You need at least two participants.");
            setActiveStep(1);
            return;
        }

        setIsLoading(true);
        trackEvent('we_generate_start', { participant_count: validParticipants.length, theme, rules });
        
        try {
            const gameData = await createGame(validParticipants, rules, theme);
            if (gameData && gameData.gameId && gameData.organizerKey) {
                trackEvent('we_generate_success', { gameId: gameData.gameId });
                // Redirect to the Organizer's Control Room
                window.location.href = `/white-elephant-generator.html#gameId=${gameData.gameId}&organizerKey=${gameData.organizerKey}`;
            } else {
                throw new Error('Failed to create game. Invalid data returned from server.');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(message);
            trackEvent('we_generate_fail', { error: message });
            setIsLoading(false);
        }
    };
    
    const steps = [
        { id: 1, label: '1. Add Participants', icon: Users },
        { id: 2, label: '2. Set Rules & Theme', icon: Settings },
        { id: 3, label: '3. Generate Game!', icon: PartyPopper }
    ];

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-center p-4">
                 <img src="/logo_256.png" alt="Loading" className="w-24 h-24 animate-pulse mb-6" />
                 <h2 className="text-2xl font-bold text-slate-800 animate-pulse">Setting Up Your Game...</h2>
                 <p className="text-slate-500 mt-2">Just a moment...</p>
            </div>
        )
    }

    return (
        <>
            <Header />
            <main className="bg-slate-50">
                <div className="text-center py-16 px-4 bg-white border-b">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 font-serif">
                        Free White Elephant Generator
                    </h1>
                    <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
                        Instantly create a random turn order and share a live dashboard for your Yankee Swap. No sign-ups required!
                    </p>
                </div>
                
                <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />
                
                <div ref={generatorRef} className="max-w-3xl mx-auto p-4 md:p-8 space-y-12">
                     <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
                        <div className="flex border-b mb-6">
                            {steps.map(step => (
                                <button key={step.id} onClick={() => setActiveStep(step.id)} className={`group flex items-center gap-2 font-semibold py-3 px-4 -mb-px border-b-2 transition-colors ${activeStep === step.id ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>
                                    <step.icon size={18} className={`transition-colors ${activeStep === step.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    <span className="hidden sm:inline">{step.label}</span>
                                    <span className="sm:hidden">{step.id}</span>
                                </button>
                            ))}
                        </div>
                        
                        {error && <p className="text-red-600 font-bold mb-4">{error}</p>}

                        <div className={activeStep === 1 ? 'block' : 'hidden'}>
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Enter Participant Names</h3>
                            <div className="space-y-3">
                                {participants.map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-2">
                                        <span className="text-slate-500 font-semibold w-8 text-center">{i + 1}.</span>
                                        <input
                                            type="text"
                                            value={p.name}
                                            onChange={e => handleParticipantChange(p.id, e.target.value)}
                                            placeholder={`Player #${i + 1}`}
                                            className="flex-1 p-2 border border-slate-300 rounded-md"
                                        />
                                        <button onClick={() => removeParticipant(p.id)} disabled={participants.length <= 1} className="text-red-500 hover:text-red-700 p-2 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={20}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={activeStep === 2 ? 'block' : 'hidden'}>
                             <h3 className="text-xl font-bold text-slate-800 mb-4">Game Settings</h3>
                             <div className="space-y-6">
                                <div>
                                    <label htmlFor="theme" className="font-bold text-slate-700">Gift Theme (Optional)</label>
                                    <p className="text-sm text-slate-500 mb-2">Set expectations for the types of gifts to bring. This will be shown to everyone.</p>
                                    <select id="theme" value={theme} onChange={e => setTheme(e.target.value as WETheme)} className="w-full p-2 border rounded-md">
                                        <option value="classic">Classic (Anything Goes)</option>
                                        <option value="funny">Funny & Weird</option>
                                        <option value="useful">Genuinely Useful</option>
                                        <option value="regift">Regift Only (Eco-Friendly!)</option>
                                    </select>
                                </div>
                                <div>
                                     <label className="font-bold text-slate-700">Steal Rules</label>
                                     <div className="mt-2 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="noStealBack" checked={rules.noStealBack} onChange={e => setRules(r => ({ ...r, noStealBack: e.target.checked }))} className="h-4 w-4 rounded" />
                                            <label htmlFor="noStealBack" className="text-sm text-slate-600">No immediate "stealing back"</label>
                                        </div>
                                         <div>
                                             <label htmlFor="stealLimit" className="text-sm text-slate-600">Limit steals per gift (0 for unlimited):</label>
                                             <input type="number" id="stealLimit" value={rules.stealLimit} onChange={e => setRules(r => ({ ...r, stealLimit: parseInt(e.target.value) || 0 }))} min="0" className="ml-2 w-20 p-1 border rounded-md text-center" />
                                         </div>
                                     </div>
                                </div>
                             </div>
                        </div>

                        <div className={activeStep === 3 ? 'block' : 'hidden'}>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-800">You're All Set!</h3>
                                <p className="text-slate-600 mt-2">Ready to create your random turn order and get the links for your game?</p>
                            </div>
                        </div>

                     </div>
                     <div className="text-center pt-4">
                        {activeStep < 3 ? (
                            <button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                                Next Step <ArrowRight />
                            </button>
                        ) : (
                             <button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                                <PartyPopper /> Generate Game!
                            </button>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default WhiteElephantGeneratorPage;
