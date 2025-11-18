import React, { useState, useRef } from 'react';
import { produce } from 'immer';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { createGame } from '../services/whiteElephantService';
import type { WEParticipant, WERules, WETheme } from '../types';
import { Users, Settings, PartyPopper, PlusCircle, Trash2, ArrowRight, Gift, AlertCircle } from 'lucide-react';

const WhiteElephantGeneratorPage: React.FC = () => {
    const [participants, setParticipants] = useState<WEParticipant[]>([
        { id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }
    ]);
    const [rules, setRules] = useState<WERules>({ stealLimit: 3, noStealBack: false });
    const [theme, setTheme] = useState<WETheme>('classic');
    const [activeStep, setActiveStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const generatorRef = useRef<HTMLDivElement>(null);

    const handleParticipantChange = (id: string, name: string) => {
        setValidationError(null);
        
        // Check for duplicates immediately
        const nameTrimmed = name.trim().toLowerCase();
        if (nameTrimmed && participants.some(p => p.id !== id && p.name.trim().toLowerCase() === nameTrimmed)) {
            setValidationError(`"${name}" is already on the list.`);
        }

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
        if (activeStep === 1) {
            const validParticipants = participants.filter(p => p.name.trim() !== '');
            if (validParticipants.length < 2) {
                setError("You need at least two participants.");
                return;
            }
            // Final duplicate check before proceeding
            const names = validParticipants.map(p => p.name.trim().toLowerCase());
            const uniqueNames = new Set(names);
            if (names.length !== uniqueNames.size) {
                setError("Please remove duplicate names before continuing.");
                return;
            }
        }
        
        if(activeStep < 3) {
            setError(null);
            setActiveStep(activeStep + 1);
            generatorRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleGenerate = async () => {
        setError(null);
        const validParticipants = participants.filter(p => p.name.trim() !== '');
        
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
        { id: 1, label: '1. Add Names', icon: Users },
        { id: 2, label: '2. Set Rules', icon: Settings },
        { id: 3, label: '3. Generate', icon: PartyPopper }
    ];

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-center p-4">
                 <img src="/logo_256.png" alt="Loading" className="w-24 h-24 animate-bounce mb-6" />
                 <h2 className="text-3xl font-bold text-blue-800 font-serif animate-pulse">Setting Up Your Party...</h2>
                 <p className="text-slate-500 mt-2 text-lg">Shuffling names and wrapping virtual gifts!</p>
            </div>
        )
    }

    return (
        <>
            <Header />
            <main className="bg-slate-50 min-h-screen pb-20">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-center py-20 px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold font-serif mb-4 drop-shadow-md">
                        White Elephant Generator
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto font-medium">
                        The easiest way to run your Yankee Swap or Elephant Gift Exchange. 
                        <span className="block mt-2 text-yellow-300 font-bold">Free • No Sign-Up • Live Dashboard</span>
                    </p>
                </div>
                
                <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />
                
                <div ref={generatorRef} className="max-w-4xl mx-auto -mt-10 px-4 relative z-10">
                     <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                        {/* Progress Bar */}
                        <div className="flex border-b bg-slate-50">
                            {steps.map(step => (
                                <button 
                                    key={step.id} 
                                    onClick={() => activeStep > step.id ? setActiveStep(step.id) : null}
                                    disabled={activeStep < step.id}
                                    className={`flex-1 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 transition-all
                                        ${activeStep === step.id ? 'bg-white border-b-4 border-blue-500 text-blue-700' : 'text-slate-400'}
                                        ${activeStep > step.id ? 'text-green-600 cursor-pointer hover:bg-slate-100' : ''}
                                    `}
                                >
                                    <div className={`p-2 rounded-full ${activeStep === step.id ? 'bg-blue-100' : (activeStep > step.id ? 'bg-green-100' : 'bg-slate-200')}`}>
                                        <step.icon size={20} />
                                    </div>
                                    <span className="font-bold text-sm sm:text-base">{step.label}</span>
                                </button>
                            ))}
                        </div>
                        
                        <div className="p-6 md:p-10 min-h-[400px]">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-3">
                                    <AlertCircle /> {error}
                                </div>
                            )}

                            {/* STEP 1: PARTICIPANTS */}
                            <div className={activeStep === 1 ? 'block animate-fade-in' : 'hidden'}>
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-slate-800">Who's Playing?</h2>
                                    <p className="text-slate-500">Enter names below. We'll shuffle them for you.</p>
                                </div>
                                
                                <div className="space-y-3 max-w-lg mx-auto">
                                    {validationError && <p className="text-red-500 text-sm text-center font-bold animate-pulse">{validationError}</p>}
                                    
                                    {participants.map((p, i) => (
                                        <div key={p.id} className="flex items-center gap-3 group">
                                            <span className="text-slate-400 font-bold w-6 text-right">{i + 1}.</span>
                                            <input
                                                type="text"
                                                value={p.name}
                                                onChange={e => handleParticipantChange(p.id, e.target.value)}
                                                placeholder={`Player Name`}
                                                className="flex-1 p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-lg"
                                                autoFocus={i === participants.length - 1 && i > 2}
                                            />
                                            <button 
                                                onClick={() => removeParticipant(p.id)} 
                                                disabled={participants.length <= 1}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                aria-label="Remove player"
                                            >
                                                <Trash2 size={20}/>
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setParticipants([...participants, { id: crypto.randomUUID(), name: '' }])}
                                        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <PlusCircle size={20} /> Add Another Player
                                    </button>
                                </div>
                            </div>

                            {/* STEP 2: RULES */}
                            <div className={activeStep === 2 ? 'block animate-fade-in' : 'hidden'}>
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-slate-800">Game Rules</h2>
                                    <p className="text-slate-500">Customize how your party will play.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Theme Selection */}
                                    <div className="space-y-4">
                                        <label className="block font-bold text-slate-700 text-lg">Gift Theme</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { val: 'classic', label: 'Classic (Anything Goes)', desc: 'The standard game. No specific theme.' },
                                                { val: 'funny', label: 'Funny & Weird', desc: 'Gag gifts and hilarity encouraged.' },
                                                { val: 'useful', label: 'Genuinely Useful', desc: 'Things people actually want to keep.' },
                                                { val: 'regift', label: 'Regift / Eco-Friendly', desc: 'Re-home items you already own.' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.val}
                                                    onClick={() => setTheme(opt.val as WETheme)}
                                                    className={`text-left p-4 rounded-xl border-2 transition-all ${theme === opt.val ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}
                                                >
                                                    <div className="font-bold text-slate-800">{opt.label}</div>
                                                    <div className="text-sm text-slate-500">{opt.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Steal Rules */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block font-bold text-slate-700 text-lg mb-2">Steal Limit (Per Gift)</label>
                                            <p className="text-sm text-slate-500 mb-3">How many times can a single gift be stolen before it's "frozen"?</p>
                                            <div className="flex items-center gap-4">
                                                <input 
                                                    type="range" 
                                                    min="0" max="5" 
                                                    value={rules.stealLimit} 
                                                    onChange={e => setRules(r => ({ ...r, stealLimit: parseInt(e.target.value) }))}
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <span className="font-bold text-2xl text-blue-600 w-12 text-center">
                                                    {rules.stealLimit === 0 ? '∞' : rules.stealLimit}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 text-right">{rules.stealLimit === 0 ? 'Unlimited Steals' : `${rules.stealLimit} steals max`}</p>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label htmlFor="noStealBack" className="font-bold text-slate-700 cursor-pointer">No Immediate "Steal Back"</label>
                                                    <p className="text-sm text-slate-500">Prevents two players from swapping the same gift back and forth endlessly.</p>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    id="noStealBack" 
                                                    checked={rules.noStealBack} 
                                                    onChange={e => setRules(r => ({ ...r, noStealBack: e.target.checked }))} 
                                                    className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 3: READY */}
                            <div className={activeStep === 3 ? 'block animate-fade-in' : 'hidden'}>
                                <div className="text-center py-10">
                                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                        <PartyPopper size={48} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Ready to Party!</h2>
                                    <p className="text-lg text-slate-600 max-w-md mx-auto mb-8">
                                        We'll generate a random turn order and create a <strong>Live Game Dashboard</strong> for you to manage the event.
                                    </p>
                                    
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 max-w-lg mx-auto text-left">
                                        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Gift size={18}/> What you'll get:</h4>
                                        <ul className="list-disc list-inside space-y-2 text-blue-700 text-sm">
                                            <li>Randomized turn order list</li>
                                            <li>Private Organizer Control Room</li>
                                            <li>Shareable "Game Day" link for participants</li>
                                            <li>Free printable turn numbers & rules</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer Navigation */}
                        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
                            {activeStep > 1 ? (
                                <button onClick={() => setActiveStep(activeStep - 1)} className="text-slate-500 font-bold hover:text-slate-800 px-4 py-2">
                                    Back
                                </button>
                            ) : <div></div>}
                            
                            {activeStep < 3 ? (
                                <button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                                    Next Step <ArrowRight size={20} />
                                </button>
                            ) : (
                                <button onClick={handleGenerate} className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 animate-pulse">
                                    Let's Play! <PartyPopper size={20} />
                                </button>
                            )}
                        </div>
                     </div>
                </div>
            </main>
            <Footer />
            <style>{`
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </>
    );
};

export default WhiteElephantGeneratorPage;