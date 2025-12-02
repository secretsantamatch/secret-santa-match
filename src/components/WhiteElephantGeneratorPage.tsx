
import React, { useState, useRef, useEffect } from 'react';
import { produce } from 'immer';
import Header from './Header';
import Footer from './Footer';
import AdBanner from './AdBanner';
import { trackEvent } from '../services/analyticsService';
import { createGame } from '../services/whiteElephantService';
import type { WEParticipant, WERules, WETheme } from '../types';
import { Users, Settings, PartyPopper, PlusCircle, Trash2, ArrowRight, Gift, AlertCircle, CheckCircle, Calendar, Building, HelpCircle, Video, MapPin, Dices, BookOpen } from 'lucide-react';
import CookieConsentBanner from './CookieConsentBanner';
import { shouldTrackByDefault } from '../utils/privacy';

const FaqItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => (
    <div className="border-b border-slate-200 py-4">
        <details className="group" onClick={() => trackEvent('we_faq_click', { question })}>
            <summary className="flex justify-between items-center font-bold text-slate-800 cursor-pointer list-none text-lg hover:text-blue-700 transition-colors">
                <span>{question}</span>
                <span className="transition-transform transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </summary>
            <div className="text-slate-600 mt-3 leading-relaxed prose prose-slate max-w-none">
                {children}
            </div>
        </details>
    </div>
);

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

    // Analytics: Track Step Changes
    useEffect(() => {
        const stepNames = {
            1: 'Add Names',
            2: 'Set Rules',
            3: 'Generate'
        };
        const currentStepName = stepNames[activeStep as keyof typeof stepNames];
        
        if (currentStepName) {
            trackEvent('step_view', { 
                step_number: activeStep, 
                step_name: currentStepName,
                generator_type: 'white_elephant'
            });
        }
    }, [activeStep]);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) {
            setShowCookieBanner(true);
        }
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
        
        if (isLastParticipant && wasEmpty && name.trim() !== '') {
            setParticipants([...updatedParticipants, { id: crypto.randomUUID(), name: '' }]);
            trackEvent('we_add_row_auto');
        } else {
            setParticipants(updatedParticipants);
        }
    };

    const removeParticipant = (id: string) => {
        if (participants.length > 1) {
            setParticipants(participants.filter(p => p.id !== id));
            trackEvent('we_remove_row');
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
            trackEvent('we_step_complete', { step: 1, count: validParticipants.length });
        }
        
        if (activeStep === 2) {
            trackEvent('we_step_complete', { step: 2, theme, stealLimit: rules.stealLimit });
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
        
        trackEvent('we_generate_start', { 
            participant_count: validParticipants.length, 
            theme, 
            rules 
        });
        
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
                        The easiest way to run your Yankee Swap or Dirty Santa Party. 
                        <span className="block mt-2 text-yellow-300 font-bold">Free • No Sign-Up • Live Dashboard</span>
                    </p>
                </div>
                
                <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true" />
                
                <div ref={generatorRef} className="max-w-4xl mx-auto -mt-10 px-4 relative z-10">
                     <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                        
                        {/* HEADER TABS */}
                        <div className="flex border-b bg-slate-50 border-slate-200">
                            {steps.map(step => {
                                const isActive = activeStep === step.id;
                                const isCompleted = activeStep > step.id;
                                
                                let tabColorClass = "";
                                let circleClass = "";

                                if (isActive) {
                                    tabColorClass = "bg-white border-b-4 border-blue-500 text-blue-700";
                                    circleClass = "bg-blue-100 text-blue-600";
                                } else if (isCompleted) {
                                    tabColorClass = "text-green-600 cursor-pointer hover:bg-slate-100";
                                    circleClass = "bg-green-100 text-green-600";
                                } else {
                                    tabColorClass = "text-slate-400";
                                    circleClass = "bg-slate-200 text-slate-500";
                                }

                                return (
                                    <button 
                                        key={step.id} 
                                        onClick={() => activeStep > step.id ? setActiveStep(step.id) : null}
                                        disabled={activeStep < step.id}
                                        className={`flex-1 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 transition-all ${tabColorClass}`}
                                    >
                                        <div className={`p-2 rounded-full ${circleClass}`}>
                                            <step.icon size={20} />
                                        </div>
                                        <span className="font-bold text-sm sm:text-base">{step.label}</span>
                                    </button>
                                );
                            })}
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
                                        onClick={() => { setParticipants([...participants, { id: crypto.randomUUID(), name: '' }]); trackEvent('we_add_row_manual'); }}
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
                                                    onClick={() => { setTheme(opt.val as WETheme); trackEvent('we_change_theme', { theme: opt.val }); }}
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
                                <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-inner p-8 md:p-12 text-center">
                                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                        <PartyPopper size={48} className="text-white" />
                                    </div>
                                    <h2 className="text-4xl font-bold mb-3 text-white drop-shadow-md">Ready to Party!</h2>
                                    <p className="text-blue-100 mb-8 text-lg max-w-xl mx-auto">
                                        We've shuffled the names and set up your live dashboard. <br/>Everything is ready for your event!
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left bg-white/10 rounded-2xl p-6 text-sm max-w-3xl mx-auto border border-white/20 shadow-inner">
                                         <div className="flex flex-col items-center text-center gap-2"><CheckCircle size={24} className="text-green-300"/> <span className="font-bold">Random Order</span></div>
                                         <div className="flex flex-col items-center text-center gap-2"><CheckCircle size={24} className="text-green-300"/> <span className="font-bold">Live Dashboard</span></div>
                                         <div className="flex flex-col items-center text-center gap-2"><CheckCircle size={24} className="text-green-300"/> <span className="font-bold">Mobile Friendly</span></div>
                                         <div className="flex flex-col items-center text-center gap-2"><CheckCircle size={24} className="text-green-300"/> <span className="font-bold">Free Printables</span></div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* FOOTER */}
                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                            {activeStep > 1 ? (
                                <button 
                                    onClick={() => setActiveStep(activeStep - 1)} 
                                    className="font-bold px-4 py-2 text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    Back
                                </button>
                            ) : <div></div>}
                            
                            {activeStep < 3 ? (
                                <button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                                    Next Step <ArrowRight size={20} />
                                </button>
                            ) : (
                                <button onClick={handleGenerate} className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-10 py-4 rounded-full shadow-xl shadow-green-900/20 transform hover:scale-105 transition-all flex items-center gap-3 animate-pulse border-4 border-green-400/50">
                                    Generate Game! <PartyPopper size={24} />
                                </button>
                            )}
                        </div>
                     </div>
                </div>

                {/* SEO CONTENT SECTION - Matching the HTML file content */}
                <div className="max-w-5xl mx-auto mt-20 px-4 space-y-16">
                    
                    {/* Visual How to Play Section */}
                    <section>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif text-center mb-12">How to Play White Elephant (Official Rules)</h2>
                        <div className="grid md:grid-cols-4 gap-8 text-center relative">
                            {/* Step 1 */}
                            <div className="relative z-10">
                                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 h-full transition-transform hover:-translate-y-2">
                                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600 rotate-3">
                                        <Gift size={32} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-800 mb-3">1. Bring a Gift</h3>
                                    <p className="text-slate-600">Everyone brings one wrapped gift within the agreed budget (e.g. $25). No peeking!</p>
                                </div>
                            </div>
                            {/* Step 2 */}
                            <div className="relative z-10">
                                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 h-full transition-transform hover:-translate-y-2">
                                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 -rotate-2">
                                        <Users size={32} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-800 mb-3">2. Draw Numbers</h3>
                                    <p className="text-slate-600">Use our <strong>free generator</strong> above to instantly randomize the turn order for everyone.</p>
                                </div>
                            </div>
                            {/* Step 3 */}
                            <div className="relative z-10">
                                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 h-full transition-transform hover:-translate-y-2">
                                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600 rotate-3">
                                        <ArrowRight size={32} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-800 mb-3">3. Open or Steal</h3>
                                    <p className="text-slate-600">Player #1 opens. Player #2 can steal #1's gift or open a new one. This continues down the line!</p>
                                </div>
                            </div>
                            {/* Step 4 */}
                            <div className="relative z-10">
                                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 h-full transition-transform hover:-translate-y-2">
                                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-600 -rotate-2">
                                        <PartyPopper size={32} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-800 mb-3">4. The Final Swap</h3>
                                    <p className="text-slate-600">After the last gift is opened, Player #1 usually gets a chance to swap with anyone.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="2345678901" data-ad-format="auto" data-full-width-responsive="true" />

                    {/* Fun Variations Section (Targeting Long Tail Keywords) */}
                    <section className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800 font-serif flex items-center gap-3 justify-center">
                                <Dices className="text-purple-600" /> Fun Game Variations
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            <div className="p-8 hover:bg-slate-50 transition-colors">
                                <h3 className="font-bold text-xl text-slate-800 mb-3 flex items-center gap-2">
                                    <Dices size={20} className="text-purple-500" /> Dice Game Rules
                                </h3>
                                <p className="text-slate-600 text-sm mb-4">Shake things up! Instead of choosing to steal, roll a die on your turn:</p>
                                <ul className="text-sm space-y-2 text-slate-600">
                                    <li><strong>1:</strong> Steal from anyone</li>
                                    <li><strong>2:</strong> Move everyone's gift to the Left</li>
                                    <li><strong>3:</strong> Move everyone's gift to the Right</li>
                                    <li><strong>4:</strong> Unwrap a new gift</li>
                                    <li><strong>5:</strong> Unwrap a new gift</li>
                                    <li><strong>6:</strong> Swap your gift with anyone</li>
                                </ul>
                            </div>
                            <div className="p-8 hover:bg-slate-50 transition-colors">
                                <h3 className="font-bold text-xl text-slate-800 mb-3 flex items-center gap-2">
                                    <BookOpen size={20} className="text-blue-500" /> Left Right Story
                                </h3>
                                <p className="text-slate-600 text-sm mb-4">Perfect for large groups! Everyone sits in a circle holding their gift.</p>
                                <p className="text-slate-600 text-sm">
                                    A host reads a special holiday story. Every time the word <strong>"LEFT"</strong> is said, everyone passes their gift left. Every time <strong>"RIGHT"</strong> is said, pass right. When the story ends, you keep what you're holding!
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Regional Names Section */}
                    <section className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
                         <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold mb-6">
                                    <MapPin size={16} className="text-red-400" /> One Game, Many Names
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 leading-tight">
                                    Is it White Elephant,<br/>Yankee Swap, or<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Dirty Santa?</span>
                                </h2>
                                <p className="text-slate-300 text-lg leading-relaxed mb-8">
                                    Depending on where you live in the United States, this holiday classic goes by different names. The good news? Our generator works perfectly for all of them!
                                </p>
                            </div>
                            <div className="grid gap-4">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                    <h3 className="text-xl font-bold text-yellow-400 mb-1">🐘 White Elephant</h3>
                                    <p className="text-slate-400 text-sm">The most common name worldwide. Traditionally implies funny, weird, or "gag" gifts that you might want to get rid of!</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                    <h3 className="text-xl font-bold text-red-400 mb-1">🎩 Yankee Swap</h3>
                                    <p className="text-slate-400 text-sm">Popular in New England (and 'The Office' fans). Rules are identical, but the focus is often on genuinely useful or desirable gifts.</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                    <h3 className="text-xl font-bold text-green-400 mb-1">🎅 Dirty Santa</h3>
                                    <p className="text-slate-400 text-sm">A Southern US tradition. The "dirty" refers to the ruthless stealing strategies! Often played for higher stakes and better gifts.</p>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Background Blobs */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px] -ml-10 -mb-10"></div>
                    </section>

                    {/* Virtual Play Guide */}
                    <section className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
                        <div className="md:w-1/2">
                            <div className="inline-block p-3 rounded-2xl bg-indigo-100 text-indigo-600 mb-6">
                                <Video size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 font-serif mb-4">Can you play virtually? Yes!</h2>
                            <p className="text-slate-600 text-lg mb-6">
                                Don't let distance stop the fun. Our tool is designed to be the perfect companion for Zoom, Teams, or Google Meet parties.
                            </p>
                            <ul className="space-y-3 text-slate-700 font-medium">
                                <li className="flex items-center gap-2"><CheckCircle size={20} className="text-green-500"/> Generate the order using this tool.</li>
                                <li className="flex items-center gap-2"><CheckCircle size={20} className="text-green-500"/> Share your screen so everyone sees the dashboard.</li>
                                <li className="flex items-center gap-2"><CheckCircle size={20} className="text-green-500"/> Participants unwrap gifts on camera.</li>
                                <li className="flex items-center gap-2"><CheckCircle size={20} className="text-green-500"/> You log the steals live for everyone to track!</li>
                            </ul>
                        </div>
                        <div className="md:w-1/2 w-full bg-slate-100 rounded-2xl p-6 border-2 border-dashed border-slate-300 text-center">
                            <p className="font-bold text-slate-500 uppercase tracking-widest text-sm mb-4">Pro Tip</p>
                            <p className="text-slate-600 italic mb-4">"We used this for our remote team party. Everyone mailed their gifts afterwards. It was chaotic and perfect!"</p>
                            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-800">
                                <span>⭐⭐⭐⭐⭐</span>
                                <span>- Sarah, HR Manager</span>
                            </div>
                        </div>
                    </section>

                    {/* Extensive FAQ Section */}
                    <section className="max-w-4xl mx-auto">
                         <h2 className="text-3xl font-bold text-slate-800 font-serif text-center mb-10 flex items-center justify-center gap-3">
                            <HelpCircle className="text-blue-500" /> Everything You Need To Know
                        </h2>
                        
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2 md:p-4 divide-y divide-slate-100">
                            <div className="px-4 md:px-8">
                                {/* Core Questions */}
                                <FaqItem question="What is a White Elephant generator?">
                                    <p>A White Elephant generator is a free digital tool that randomly assigns turn numbers to participants and helps track the game flow (who opened what, who stole from whom) to ensure fair play without needing paper slips.</p>
                                </FaqItem>
                                <FaqItem question="How does the White Elephant order generator work?">
                                    <p>Simply add all participant names, click generate, and receive a random order. You can print the turn numbers or use the live dashboard to track who opens what gift and manage steals in real-time.</p>
                                </FaqItem>
                                <FaqItem question="Is this White Elephant generator really free?">
                                    <p>Yes, completely free. No credit card, email, or account needed. Generate unlimited orders for any group size.</p>
                                </FaqItem>
                                
                                {/* Gameplay Questions */}
                                <FaqItem question="How many people can play White Elephant?">
                                    <p>White Elephant works best with <strong>5-30 people</strong>. Smaller groups (5-10) play faster, while larger groups (15-30) create more excitement and stealing opportunities. Groups larger than 40 might want to consider splitting into two circles to keep the game moving.</p>
                                </FaqItem>
                                <FaqItem question="How many times can you steal in White Elephant?">
                                    <p>Most groups limit stealing to <strong>3 times per gift</strong>. After the third steal, the gift is "locked", "dead", or "frozen" and stays with that person. Our generator allows you to customize this limit in the rules step.</p>
                                </FaqItem>
                                <FaqItem question="How much should you spend on White Elephant gifts?">
                                    <p>Most White Elephant exchanges set a budget of <strong>$20-$25</strong>. Always follow the organizer's price limit to keep things fair. If it's a "gag gift" party, the limit might be lower (e.g., $10).</p>
                                </FaqItem>
                                <FaqItem question="Can you steal back your own gift in White Elephant?">
                                    <p>Generally, no immediate steal-backs are allowed. If someone steals your gift, you must wait until your next turn (if the game loops) or steal a different gift. The "No Immediate Steal Back" rule prevents a game from getting stuck in a loop between two players.</p>
                                </FaqItem>
                                
                                {/* Comparison Questions */}
                                <FaqItem question="What's the difference between White Elephant and Secret Santa?">
                                    <p><strong>Secret Santa:</strong> You buy for a specific person assigned to you privately. <br/><strong>White Elephant:</strong> Everyone brings a generic gift, and players steal/swap them publicly during the game. White Elephant is more interactive and competitive.</p>
                                </FaqItem>
                                <FaqItem question="Is White Elephant the same as Yankee Swap?">
                                    <p>Yes, they're the same game with different regional names. "Yankee Swap" is popular in New England, while "White Elephant" is used nationwide. The rules are identical.</p>
                                </FaqItem>
                                <FaqItem question="What is Dirty Santa vs White Elephant?">
                                    <p>Same game, different names. "Dirty Santa" is popular in the Southern US. The "dirty" refers to the ruthless gift-stealing strategies players use!</p>
                                </FaqItem>
                                
                                {/* Virtual Questions */}
                                <FaqItem question="Can you play White Elephant virtually?">
                                    <p>Yes! Use our generator to create the order. Share the link via Zoom/Teams. Have participants show their gifts on camera as they open/steal them. The organizer logs the steals on the dashboard so everyone knows who has what.</p>
                                </FaqItem>
                                <FaqItem question="How do you do White Elephant over Zoom?">
                                    <p>Generate order → Share screen with the dashboard → Player 1 opens gift on camera → Organizer logs it → Player 2 steals or opens new → Repeat. Mailed gifts are sent after the party.</p>
                                </FaqItem>

                                {/* Strategy */}
                                <FaqItem question="What makes a good White Elephant gift?">
                                    <p>The best gifts are: funny but useful, weird but desirable, or surprisingly nice. Think quirky kitchen gadgets, funny books, cozy items, or trending novelty products. Avoid trash—getting a truly bad gift isn't fun for anyone.</p>
                                </FaqItem>

                                {/* NEW FAQs for Internal Linking */}
                                <FaqItem question="Can I use this for a Secret Santa exchange instead?">
                                    <p>This tool is specifically for random order generation and stealing games. For a traditional gift exchange where you buy for a specific person, use our free <a href="/generator.html" className="text-blue-600 hover:underline font-semibold">Secret Santa Generator</a>. It handles private matching and wishlists instantly!</p>
                                </FaqItem>
                                <FaqItem question="Do you have ideas for funny or good gifts?">
                                    <p>Absolutely! If you're stuck on what to bring, check out our curated list of <a href="/white-elephant-gifts-under-20.html" className="text-blue-600 hover:underline font-semibold">38 White Elephant Gifts Under $20</a> that people actually want to steal. We also have specific <a href="/streaming-gifts-2025.html" className="text-blue-600 hover:underline font-semibold">ideas for movie lovers</a>.</p>
                                </FaqItem>
                                <FaqItem question="How can I make the party more fun?">
                                    <p>Besides the gift exchange, adding a simple game can liven things up. Try our <a href="/secret-santa-bingo-guide.html" className="text-blue-600 hover:underline font-semibold">Secret Santa Bingo</a> or check out these <a href="/halloween-party-games.html" className="text-blue-600 hover:underline font-semibold">15 Party Games for Adults</a> that work great for any holiday gathering.</p>
                                </FaqItem>
                            </div>
                        </div>
                    </section>

                    <div className="text-center pb-8">
                        <h3 className="text-lg font-bold text-slate-600 mb-4">Ready to start your game?</h3>
                        <button onClick={() => { setActiveStep(1); generatorRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-all transform hover:scale-105">
                            Scroll Up to Generator
                        </button>
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
