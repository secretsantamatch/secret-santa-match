
import React, { useState, useRef, useEffect } from 'react';
import { produce } from 'immer';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { createGame } from '../services/whiteElephantService';
import type { WEParticipant, WERules, WETheme } from '../types';
import { Users, Settings, PartyPopper, PlusCircle, Trash2, ArrowRight, Gift, AlertCircle, CheckCircle, Calendar, Building } from 'lucide-react';
import CookieConsentBanner from './CookieConsentBanner';
import { shouldTrackByDefault } from '../utils/privacy';

const WhiteElephantGeneratorPage: React.FC = () => {
    const [participants, setParticipants] = useState<WEParticipant[]>([
        { id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }
    ]);
    const [rules, setRules] = useState<WERules>({ stealLimit: 3, noStealBack: false });
    const [theme, setTheme] = useState<WETheme>('classic');
    const [groupName, setGroupName] = useState('');
    const [eventDetails, setEventDetails] = useState('');
    
    const [activeStep, setActiveStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showCookieBanner, setShowCookieBanner] = useState(false);
    const generatorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) {
            setShowCookieBanner(true);
        }
        // Hybrid Tracking: 
        // If US -> Tracks immediately. 
        // If EU -> Waits for consent.
        if (shouldTrackByDefault()) {
            trackEvent('we_generator_view');
        }
    }, []);

    const handleCookieAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setShowCookieBanner(false);
        trackEvent('cookie_consent_accept');
    };

    const handleCookieDecline = () => {
        localStorage.setItem('cookie_consent', 'false');
        setShowCookieBanner(false);
    };

    const handleParticipantChange = (id: string, name: string) => {
        setValidationError(null);
        
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
        
        // Only add a new line if they are typing in the last one and it was previously empty
        // And we do NOT set focus manually to avoid the jumping bug
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
            const gameData = await createGame(validParticipants, rules, theme, groupName, eventDetails);
            if (gameData && gameData.gameId && gameData.organizerKey) {
                trackEvent('we_generate_success', { gameId: gameData.gameId });
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

    const themeOptions = [
        { val: 'classic', label: 'Classic', desc: 'Anything Goes', color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 ring-blue-400' },
        { val: 'funny', label: 'Funny & Weird', desc: 'Gag Gifts Encouraged', color: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 ring-orange-400' },
        { val: 'useful', label: 'Genuinely Useful', desc: 'Things people want', color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 ring-emerald-400' },
        { val: 'regift', label: 'Regift / Eco', desc: 'Re-home items', color: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100 ring-purple-400' }
    ];

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
                                                className={`flex-1 p-3 border-2 rounded-xl focus:ring-2 transition-all outline-none text-lg ${validationError && p.name && participants.filter(px => px.name.toLowerCase() === p.name.toLowerCase()).length > 1 ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'}`}
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
                                    {/* Group Info Section */}
                                    <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-2">
                                        <h3 className="font-bold text-slate-700 text-lg mb-4 flex items-center gap-2">
                                            <PartyPopper size={20} className="text-blue-500"/> Event Details (Optional)
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-600 mb-1">Group / Party Name</label>
                                                <div className="relative">
                                                    <Building size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                                                    <input 
                                                        type="text" 
                                                        value={groupName}
                                                        onChange={(e) => setGroupName(e.target.value)}
                                                        placeholder="e.g. ACME Corp Holiday Party"
                                                        className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-600 mb-1">Date & Time / Location</label>
                                                <div className="relative">
                                                    <Calendar size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                                                    <input 
                                                        type="text" 
                                                        value={eventDetails}
                                                        onChange={(e) => setEventDetails(e.target.value)}
                                                        placeholder="e.g. Dec 24th @ 6PM"
                                                        className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block font-bold text-slate-700 text-lg">Gift Theme</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {themeOptions.map((opt) => (
                                                <button
                                                    key={opt.val}
                                                    onClick={() => setTheme(opt.val as WETheme)}
                                                    className={`text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${theme === opt.val ? `${opt.color} ring-2 ring-offset-1 ${opt.val === 'classic' ? 'ring-blue-300' : opt.val === 'funny' ? 'ring-orange-300' : opt.val === 'useful' ? 'ring-emerald-300' : 'ring-purple-300'}` : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}
                                                >
                                                    <div>
                                                        <div className="font-bold">{opt.label}</div>
                                                        <div className="text-sm opacity-80">{opt.desc}</div>
                                                    </div>
                                                    {theme === opt.val && <CheckCircle size={24} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block font-bold text-slate-700 text-lg mb-2">Steal Limit (Per Gift)</label>
                                            <p className="text-sm text-slate-500 mb-3">How many times can a single gift be stolen before it's "frozen"?</p>
                                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <input 
                                                    type="range" 
                                                    min="0" max="5" 
                                                    value={rules.stealLimit} 
                                                    onChange={e => setRules(r => ({ ...r, stealLimit: parseInt(e.target.value) }))}
                                                    className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                />
                                                <div className="flex flex-col items-center w-20">
                                                    <span className="font-bold text-3xl text-blue-600">
                                                        {rules.stealLimit === 0 ? '∞' : rules.stealLimit}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-bold uppercase">
                                                        {rules.stealLimit === 0 ? 'Unlimited' : 'Steals'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setRules(r => ({ ...r, noStealBack: !r.noStealBack }))}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-bold text-slate-700 cursor-pointer">No Immediate "Steal Back"</label>
                                                    <p className="text-sm text-slate-500">Prevents swapping the same gift back and forth.</p>
                                                </div>
                                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${rules.noStealBack ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                                    {rules.noStealBack && <CheckCircle size={16} className="text-white" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 3: READY */}
                            <div className={activeStep === 3 ? 'block animate-fade-in' : 'hidden'}>
                                <div className="text-center py-10">
                                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-8 rounded-3xl text-white shadow-xl max-w-xl mx-auto transform hover:scale-105 transition-transform">
                                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                                            <PartyPopper size={40} className="text-white" />
                                        </div>
                                        <h2 className="text-3xl font-bold mb-2">Ready to Party!</h2>
                                        <p className="text-blue-50 mb-6">
                                            We've shuffled the names and set up your control room.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4 text-left bg-white/10 rounded-xl p-4 text-sm">
                                             <div className="flex items-center gap-2"><CheckCircle size={16}/> Random Order</div>
                                             <div className="flex items-center gap-2"><CheckCircle size={16}/> Live Dashboard</div>
                                             <div className="flex items-center gap-2"><CheckCircle size={16}/> Mobile Friendly</div>
                                             <div className="flex items-center gap-2"><CheckCircle size={16}/> Free Printables</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

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
                                <button onClick={handleGenerate} className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-12 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 animate-pulse">
                                    Generate Game! <PartyPopper size={24} />
                                </button>
                            )}
                        </div>
                     </div>
                </div>
            </main>
            <Footer />
            {showCookieBanner && <CookieConsentBanner onAccept={handleCookieAccept} onDecline={handleCookieDecline} />}
            <style>{`
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </>
    );
};

export default WhiteElephantGeneratorPage;
