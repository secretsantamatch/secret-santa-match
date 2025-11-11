import React, { useState, useEffect, useMemo } from 'react';
import { produce } from 'immer';
import type { Participant, Exclusion, Assignment, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';
import ParticipantManager from './ParticipantManager';
import BulkAddModal from './BulkAddModal';
import Options from './Options';
import Header from './Header';
import Footer from './Footer';
import HowItWorks from './HowItWorks';
import FaqSection from './FaqSection';
import WhyChooseUs from './WhyChooseUs';
import SocialProof from './SocialProof';
import VideoTutorial from './VideoTutorial';
import ShareTool from './ShareTool';
import FeaturedResources from './FeaturedResources';
import { generateMatches } from '../services/matchService';
import { trackEvent } from '../services/analyticsService';
import { Users, ScrollText, Palette, Shuffle, X, AlertTriangle, ArrowRight } from 'lucide-react';
import CookieConsentBanner from './CookieConsentBanner';
import { getRandomPersona } from '../services/personaService';

const GeneratorPage: React.FC = () => {
    // Core State
    const [participants, setParticipants] = useState<Participant[]>([
        { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
        { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
        { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
    ]);
    const [exclusions, setExclusions] = useState<Exclusion[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // UI State
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [loadingMessage, setLoadingMessage] = useState('Drawing names...');
    
    // Options State
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    const [eventDetails, setEventDetails] = useState('Gift exchange on Dec 25th!');
    const [selectedBackgroundId, setSelectedBackgroundId] = useState('gift-border');
    const [customBackground, setCustomBackground] = useState<string | null>(null);
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [useTextOutline, setUseTextOutline] = useState(false);
    const [outlineColor, setOutlineColor] = useState('#000000');
    const [outlineSize, setOutlineSize] = useState<OutlineSizeSetting>('normal');
    const [fontSize, setFontSize] = useState<FontSizeSetting>('normal');
    const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
    const [lineSpacing, setLineSpacing] = useState(1.2);
    const [greetingText, setGreetingText] = useState("Happy Holidays, {secret_santa}!");
    const [introText, setIntroText] = useState("You are the Secret Santa for...");
    const [wishlistLabelText, setWishlistLabelText] = useState("Gift Ideas & Wishlist");

    // PWA & Cookie State
    const [showCookieBanner, setShowCookieBanner] = useState(false);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

    // Initial load effects
    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) {
            setShowCookieBanner(true);
        } else if (consent === 'true') {
            trackEvent('page_view', { page_title: 'Generator' });
        }
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        });

        fetch('/templates.json')
            .then(res => res.json())
            .then(data => {
                setBackgroundOptions(data);
                const defaultOption = data.find((opt: BackgroundOption) => opt.id === 'gift-border') || data[0];
                if (defaultOption) {
                    setSelectedBackgroundId(defaultOption.id);
                    setTextColor(defaultOption.defaultTextColor || '#FFFFFF');
                }
            })
            .catch(err => console.error("Failed to load templates.json", err));
        
        const handleExtensionData = (event: CustomEvent) => {
             const extensionParticipants = event.detail.map((p: any) => ({
                id: p.id || crypto.randomUUID(),
                name: p.name || '',
                interests: p.notes || '',
                likes: '', dislikes: '', links: '',
                budget: p.budget || '',
            }));
            if (extensionParticipants.length > 0) {
                 setParticipants([...extensionParticipants, { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
                 trackEvent('extension_import_success', { count: extensionParticipants.length });
            }
        };
        window.addEventListener('ssm-participants-ready', handleExtensionData as EventListener);
        return () => window.removeEventListener('ssm-participants-ready', handleExtensionData as EventListener);

    }, []);

    // Update card text based on selected background
     useEffect(() => {
        if (customBackground) return;
        const selectedOption = backgroundOptions.find(opt => opt.id === selectedBackgroundId);
        if (selectedOption) {
            if (selectedOption.cardText) {
                setGreetingText(selectedOption.cardText.greeting);
                setIntroText(selectedOption.cardText.intro);
                setWishlistLabelText(selectedOption.cardText.wishlistLabel);
            }
            if (selectedOption.defaultTextColor) {
                setTextColor(selectedOption.defaultTextColor);
            }
        }
     }, [selectedBackgroundId, backgroundOptions, customBackground]);

    const handleBulkAdd = (names: string) => {
        const newNames = names.split('\n').map(name => name.trim()).filter(Boolean);
        if (newNames.length > 0) {
            const currentNonEmpty = participants.filter(p => p.name.trim() !== '');
            const currentNamesLower = new Set(currentNonEmpty.map(p => p.name.trim().toLowerCase()));
            
            const uniqueNewNames = [...new Set(newNames)] // Dedupe within the new list
                .filter(name => !currentNamesLower.has(name.trim().toLowerCase())); // Dedupe against existing list
            
            if (uniqueNewNames.length < newNames.length) {
                setError("Some duplicate names were not added.");
            } else {
                setError(null);
            }

            if (uniqueNewNames.length > 0) {
                const combined = [...currentNonEmpty, ...uniqueNewNames.map(name => ({ id: crypto.randomUUID(), name, interests: '', likes: '', dislikes: '', links: '', budget: '' }))];
                setParticipants([...combined, { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
                trackEvent('bulk_add', { count: uniqueNewNames.length });
            }
        }
        setShowBulkAdd(false);
    };

    const handleClear = () => {
        setParticipants([
            { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
            { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
            { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
        ]);
        setExclusions([]);
        setAssignments([]);
        setError(null);
        trackEvent('click_clear_all');
    };
    
    // Rules management
    const addExclusion = () => setExclusions(produce(draft => { draft.push({ p1: '', p2: '' }); }));
    const updateExclusion = (index: number, field: 'p1' | 'p2', value: string) => setExclusions(produce(draft => { draft[index][field] = value; }));
    const removeExclusion = (index: number) => setExclusions(exclusions.filter((_, i) => i !== index));

    const addAssignment = () => setAssignments(produce(draft => { draft.push({ giverId: '', receiverId: '' }); }));
    const updateAssignment = (index: number, field: 'giverId' | 'receiverId', value: string) => setAssignments(produce(draft => { draft[index][field] = value; }));
    const removeAssignment = (index: number) => setAssignments(assignments.filter((_, i) => i !== index));

    const handleGenerate = async () => {
        setError(null);
        const validParticipants = participants.filter(p => p.name.trim() !== '');
        if (validParticipants.length < 3) {
            setError("You need at least three participants to start a gift exchange.");
            setActiveStep(1);
            return;
        }

        if (selectedBackgroundId === 'plain-white' || !selectedBackgroundId) {
            setError("Please choose a theme for your cards from the 'Style Your Cards' tab.");
            setActiveStep(3);
            return;
        }
        
        setIsLoading(true);
        setLoadingMessage(getRandomPersona());

        const result = generateMatches(validParticipants, exclusions, assignments);
        
        if (!result.matches) {
            setError(result.error);
            setActiveStep(2);
            setIsLoading(false);
            trackEvent('generate_fail', { error: result.error, participants: validParticipants.length });
            return;
        }

        const exchangeData = {
            p: validParticipants,
            matches: result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
            exclusions,
            assignments,
            eventDetails,
            bgId: selectedBackgroundId,
            customBackground,
            textColor,
            useTextOutline,
            outlineColor,
            outlineSize,
            fontSizeSetting: fontSize,
            fontTheme,
            lineSpacing,
            greetingText,
            introText,
            wishlistLabelText,
        };

        try {
            const response = await fetch('/.netlify/functions/create-exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exchangeData),
            });
            
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error || 'Failed to create the exchange on the server.');
            }
            
            const { id } = await response.json();
            trackEvent('generate_success', { participants: validParticipants.length, method: 'firebase' });
            
            setTimeout(() => {
                window.location.href = `/generator.html#${id}`;
                window.location.reload(); 
            }, 500);

        } catch (apiError) {
            setError(apiError instanceof Error ? apiError.message : "Could not save the gift exchange. Please try again.");
            setIsLoading(false);
            trackEvent('generate_fail', { error: 'api_error', participants: validParticipants.length });
        }
    };
    
    const handleNextStep = () => {
        if(activeStep < 3) {
            setActiveStep(activeStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleCookieAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setShowCookieBanner(false);
        trackEvent('cookie_consent_accept');
    };

    const handleCookieDecline = () => {
        localStorage.setItem('cookie_consent', 'false');
        setShowCookieBanner(false);
    };
    
    const handleInstallClick = () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                trackEvent('pwa_install_prompt', { outcome: choiceResult.outcome });
            });
        }
    };

    const validParticipants = useMemo(() => participants.filter(p => p.name.trim() !== ''), [participants]);
    
    const steps = [
        { id: 1, label: '1. Add Participants', icon: Users },
        { id: 2, label: '2. Add Details & Rules', icon: ScrollText },
        { id: 3, label: '3. Style Your Cards', icon: Palette }
    ];

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-center p-4">
                 <img src="/logo_256.png" alt="Loading" className="w-24 h-24 animate-pulse mb-6" />
                 <h2 className="text-2xl font-bold text-slate-800 animate-pulse">{loadingMessage}</h2>
                 <p className="text-slate-500 mt-2">Just a moment...</p>
            </div>
        )
    }

    return (
        <>
            <Header />
            <main className="bg-slate-50">
                <div className="text-center py-16 px-4 bg-white border-b">
                     <div className="flex justify-center mb-4">
                        <img src="/logo_256.png" alt="Secret Santa Match Logo" className="h-20 w-20" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 font-serif">Free Secret Santa Generator</h1>
                    <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">The easiest way to organize a gift exchange. No emails or sign-ups required. Instantly draw names online, set rules, and share private links!</p>
                </div>

                <div className="max-w-5xl mx-auto px-4 md:px-8">
                    <HowItWorks />
                    <VideoTutorial />
                </div>
                
                <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
                        <div className="flex border-b mb-6">
                            {steps.map(step => (
                                <button key={step.id} onClick={() => setActiveStep(step.id)} className={`group flex items-center gap-2 font-semibold py-3 px-4 -mb-px border-b-2 transition-colors ${activeStep === step.id ? 'text-red-600 border-red-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>
                                    <step.icon size={18} className={`transition-colors ${activeStep === step.id ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    <span className="hidden sm:inline">{step.label}</span>
                                    <span className="sm:hidden">{step.id}</span>
                                </button>
                            ))}
                        </div>
                        
                        {error && (
                             <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-200 flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold">Oops! There's an issue.</h3>
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}

                        <div className={activeStep === 1 ? 'block' : 'hidden'}>
                            <ParticipantManager participants={participants} setParticipants={setParticipants} onBulkAddClick={() => setShowBulkAdd(true)} onClearClick={handleClear} setError={setError} />
                        </div>

                        <div className={activeStep === 2 ? 'block' : 'hidden'}>
                             <div className="space-y-8">
                                <div>
                                    <label htmlFor="event-details" className="text-lg font-semibold text-slate-700 block mb-2">Event Details</label>
                                    <textarea
                                      id="event-details"
                                      value={eventDetails}
                                      onChange={(e) => setEventDetails(e.target.value)}
                                      placeholder="e.g., Gift exchange at the annual holiday party on Dec 20th. Budget: $25."
                                      className="w-full p-2 border border-slate-300 rounded-md"
                                      rows={3}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Exclusions (Optional)</h3>
                                    <p className="text-slate-500 mb-4 text-sm">Prevent certain people from being matched together.</p>
                                    <div className="space-y-3">
                                        {exclusions.map((ex, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border">
                                                <select value={ex.p1} onChange={(e) => updateExclusion(index, 'p1', e.target.value)} className="w-full p-2 border rounded-md">
                                                    <option value="">Select Person 1</option>
                                                    {validParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <span className="font-bold text-slate-500">can't draw</span>
                                                <select value={ex.p2} onChange={(e) => updateExclusion(index, 'p2', e.target.value)} className="w-full p-2 border rounded-md">
                                                    <option value="">Select Person 2</option>
                                                    {validParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <button onClick={() => removeExclusion(index)} className="text-red-500 hover:text-red-700 p-2"><X size={18}/></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={addExclusion} className="mt-4 text-indigo-600 font-semibold text-sm hover:text-indigo-800">Add Exclusion</button>
                                </div>
                                 <div>
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Assignments (Optional)</h3>
                                    <p className="text-slate-500 mb-4 text-sm">Force a specific person to be another's Secret Santa.</p>
                                    <div className="space-y-3">
                                        {assignments.map((as, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border">
                                                <select value={as.giverId} onChange={(e) => updateAssignment(index, 'giverId', e.target.value)} className="w-full p-2 border rounded-md">
                                                    <option value="">Select Giver</option>
                                                    {validParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <span className="font-bold text-slate-500">must draw</span>
                                                <select value={as.receiverId} onChange={(e) => updateAssignment(index, 'receiverId', e.target.value)} className="w-full p-2 border rounded-md">
                                                    <option value="">Select Receiver</option>
                                                    {validParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <button onClick={() => removeAssignment(index)} className="text-red-500 hover:text-red-700 p-2"><X size={18}/></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={addAssignment} className="mt-4 text-indigo-600 font-semibold text-sm hover:text-indigo-800">Add Assignment</button>
                                </div>
                            </div>
                        </div>

                        <div className={activeStep === 3 ? 'block' : 'hidden'}>
                            <Options
                                participants={validParticipants}
                                eventDetails={eventDetails}
                                selectedBackgroundId={selectedBackgroundId} setSelectedBackgroundId={setSelectedBackgroundId}
                                customBackground={customBackground} setCustomBackground={setCustomBackground}
                                backgroundOptions={backgroundOptions}
                                textColor={textColor} setTextColor={setTextColor}
                                useTextOutline={useTextOutline} setUseTextOutline={setUseTextOutline}
                                outlineColor={outlineColor} setOutlineColor={setOutlineColor}
                                outlineSize={outlineSize} setOutlineSize={setOutlineSize}
                                fontSize={fontSize} setFontSize={setFontSize}
                                fontTheme={fontTheme} setFontTheme={setFontTheme}
                                lineSpacing={lineSpacing} setLineSpacing={setLineSpacing}
                                greetingText={greetingText} setGreetingText={setGreetingText}
                                introText={introText} setIntroText={setIntroText}
                                wishlistLabelText={wishlistLabelText} setWishlistLabelText={setWishlistLabelText}
                            />
                        </div>
                    </div>

                    <div className="text-center pt-4">
                        {activeStep < 3 ? (
                            <button onClick={handleNextStep} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                                Next Step <ArrowRight />
                            </button>
                        ) : (
                             <button
                                onClick={handleGenerate}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto"
                            >
                                <Shuffle /> Generate Matches!
                            </button>
                        )}
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 md:px-8">
                    <WhyChooseUs />
                    <SocialProof />
                    <ShareTool />
                    <FaqSection />
                    <FeaturedResources />
                </div>
            </main>
            <Footer showInstallButton={!!deferredInstallPrompt} onInstallClick={handleInstallClick} />
            {showBulkAdd && <BulkAddModal onConfirm={handleBulkAdd} onClose={() => setShowBulkAdd(false)} />}
            {showCookieBanner && <CookieConsentBanner onAccept={handleCookieAccept} onDecline={handleCookieDecline} />}
        </>
    );
};

export default GeneratorPage;