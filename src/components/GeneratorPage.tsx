import React, { useState, useEffect, useMemo, useRef } from 'react';
import { produce } from 'immer';
import type { Participant, Exclusion, Assignment, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme, ExchangeData } from '../types';
import ParticipantManager from './ParticipantManager';
import RulesManager from './RulesManager'; // Import the new component
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
import ConfirmationModal from './ConfirmationModal';
import { generateMatches } from '../services/matchService';
import { trackEvent } from '../services/analyticsService';
import { Users, ScrollText, Palette, Shuffle, X, AlertTriangle, ArrowRight, Save } from 'lucide-react';
import CookieConsentBanner from './CookieConsentBanner';
import { getRandomPersona } from '../services/personaService';
import AdBanner from './AdBanner';

interface GeneratorPageProps {
  onComplete: (data: ExchangeData) => void;
  initialData?: ExchangeData;
}

const GeneratorPage: React.FC<GeneratorPageProps> = ({ onComplete, initialData }) => {
    const isEditMode = !!initialData;
    
    // Core State
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [exclusions, setExclusions] = useState<Exclusion[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // UI State
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [loadingMessage, setLoadingMessage] = useState('Drawing names...');
    const [isShuffleConfirmOpen, setIsShuffleConfirmOpen] = useState(false);
    const generatorRef = useRef<HTMLDivElement>(null);
    
    // Options State
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    const [eventDetails, setEventDetails] = useState('');
    const [selectedBackgroundId, setSelectedBackgroundId] = useState('gift-border');
    const [customBackground, setCustomBackground] = useState<string | null>(null);
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [useTextOutline, setUseTextOutline] = useState(false);
    const [outlineColor, setOutlineColor] = useState('#000000');
    const [outlineSize, setOutlineSize] = useState<OutlineSizeSetting>('normal');
    const [fontSize, setFontSize] = useState<FontSizeSetting>('normal');
    const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
    const [lineSpacing, setLineSpacing] = useState(1.2);
    const [greetingText, setGreetingText] = useState("");
    const [introText, setIntroText] = useState("");
    const [wishlistLabelText, setWishlistLabelText] = useState("");

    // PWA & Cookie State
    const [showCookieBanner, setShowCookieBanner] = useState(false);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

    // Initial data population effect
    useEffect(() => {
        if (isEditMode && initialData) {
            // FIX: Provide robust fallbacks for ALL fields to prevent `undefined` state
            // when loading older exchange data that may be missing newer properties.
            setParticipants(initialData.p ?? []);
            setExclusions(initialData.exclusions ?? []);
            setAssignments(initialData.assignments ?? []);
            setEventDetails(initialData.eventDetails ?? 'Gift exchange on Dec 25th!');
            setSelectedBackgroundId(initialData.bgId ?? 'gift-border');
            setCustomBackground(initialData.customBackground ?? null);
            setTextColor(initialData.textColor ?? '#265343'); // Default for gift-border
            setUseTextOutline(initialData.useTextOutline ?? false);
            setOutlineColor(initialData.outlineColor ?? '#000000');
            setOutlineSize(initialData.outlineSize ?? 'normal');
            setFontSize(initialData.fontSizeSetting ?? 'normal');
            setFontTheme(initialData.fontTheme ?? 'classic');
            setLineSpacing(initialData.lineSpacing ?? 1.2);
            setGreetingText(initialData.greetingText ?? "Happy Holidays, {secret_santa}!");
            setIntroText(initialData.introText ?? "You are the Secret Santa for...");
            setWishlistLabelText(initialData.wishlistLabelText ?? "Gift Ideas & Wishlist");
        } else {
            // Default state for new generator
             setParticipants([
                { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
                { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
                { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
            ]);
            setEventDetails('Gift exchange on Dec 25th!');
            setGreetingText("Happy Holidays, {secret_santa}!");
            setIntroText("You are the Secret Santa for...");
            setWishlistLabelText("Gift Ideas & Wishlist");
        }
    }, [isEditMode, initialData]);

    // General setup effects
    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) setShowCookieBanner(true);
        else if (consent === 'true') trackEvent('page_view', { page_title: isEditMode ? 'Edit_Game' : 'Generator' });
        
        window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredInstallPrompt(e); });

        fetch('/templates.json')
            .then(res => res.json()).then(data => setBackgroundOptions(data))
            .catch(err => console.error("Failed to load templates.json", err));
    }, [isEditMode]);

    // ... (rest of the component logic: handleBulkAdd, handleClear, rules management, etc.) remains largely the same
     const handleBulkAdd = (names: string) => {
        const newNames = names.split('\n').map(name => name.trim()).filter(Boolean);
        if (newNames.length > 0) {
            const currentNonEmpty = participants.filter(p => p.name.trim() !== '');
            const currentNamesLower = new Set(currentNonEmpty.map(p => p.name.trim().toLowerCase()));
            
            const uniqueNewNames = [...new Set(newNames)] 
                .filter(name => !currentNamesLower.has(name.trim().toLowerCase())); 
            
            if (uniqueNewNames.length < newNames.length) setError("Some duplicate names were not added.");
            else setError(null);

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
    
    const addExclusion = () => setExclusions(produce(draft => { draft.push({ p1: '', p2: '' }); }));
    const updateExclusion = (index: number, field: 'p1' | 'p2', value: string) => setExclusions(produce(draft => { draft[index][field] = value; }));
    const removeExclusion = (index: number) => setExclusions(exclusions.filter((_, i) => i !== index));

    const addAssignment = () => setAssignments(produce(draft => { draft.push({ giverId: '', receiverId: '' }); }));
    const updateAssignment = (index: number, field: 'giverId' | 'receiverId', value: string) => setAssignments(produce(draft => { draft[index][field] = value; }));
    const removeAssignment = (index: number) => setAssignments(assignments.filter((_, i) => i !== index));

    const handleSubmit = async (forceReshuffle = false) => {
        setError(null);
        const validParticipants = participants.filter(p => p.name.trim() !== '');
        if (validParticipants.length < 3) {
            setError("You need at least three participants.");
            setActiveStep(1);
            return;
        }
        
        setIsLoading(true);
        setLoadingMessage(isEditMode ? 'Saving changes...' : getRandomPersona());

        try {
            let needsReshuffle = forceReshuffle;
            if (isEditMode && initialData && !forceReshuffle) {
                const initialPIds = new Set(initialData.p.map(p => p.id));
                const currentPIds = new Set(validParticipants.map(p => p.id));
                const participantsChanged = initialPIds.size !== currentPIds.size || ![...initialPIds].every(id => currentPIds.has(id));
                const rulesChanged = JSON.stringify(initialData.exclusions) !== JSON.stringify(exclusions) || JSON.stringify(initialData.assignments) !== JSON.stringify(assignments);
                
                if (participantsChanged || rulesChanged) {
                    setIsLoading(false);
                    setIsShuffleConfirmOpen(true);
                    return; // Wait for user confirmation
                }
            }

            let finalMatches = isEditMode && initialData ? initialData.matches : [];
            if (!isEditMode || needsReshuffle) {
                setLoadingMessage('Generating matches...');
                const result = generateMatches(validParticipants, exclusions, assignments);
                if (!result.matches) {
                    throw new Error(result.error || 'Failed to generate matches.');
                }
                finalMatches = result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id }));
            }

            // DEFINITIVE FIX: Sanitize the entire payload to ensure no `undefined` values are ever sent to Firestore.
            // This prevents server crashes when updating older exchanges that are missing newer data fields.
            const sanitizedParticipants = validParticipants.map(p => ({
                id: p.id,
                name: p.name ?? '',
                interests: p.interests ?? '',
                likes: p.likes ?? '',
                dislikes: p.dislikes ?? '',
                links: p.links ?? '',
                budget: p.budget ?? '',
            }));

            const sanitizedExclusions = exclusions.map(ex => ({
                p1: ex.p1 ?? '',
                p2: ex.p2 ?? ''
            }));
            
            const sanitizedAssignments = assignments.map(as => ({
                giverId: as.giverId ?? '',
                receiverId: as.receiverId ?? ''
            }));

            const exchangePayload = {
                p: sanitizedParticipants,
                matches: finalMatches,
                exclusions: sanitizedExclusions,
                assignments: sanitizedAssignments,
                eventDetails,
                bgId: selectedBackgroundId,
                customBackground, textColor, useTextOutline, outlineColor, outlineSize,
                fontSizeSetting: fontSize, fontTheme, lineSpacing,
                greetingText, introText, wishlistLabelText,
                views: (isEditMode && initialData?.views) || {},
            };
            
            setLoadingMessage(isEditMode ? 'Saving...' : 'Creating your game...');
            const url = isEditMode ? '/.netlify/functions/update-exchange' : '/.netlify/functions/create-exchange';
            const body = isEditMode ? { exchangeId: initialData.id, data: exchangePayload } : exchangePayload;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} the exchange (Status: ${response.status}).`;
                try {
                    const errorBody = await response.json();
                    if (errorBody && errorBody.error) {
                        errorMessage = errorBody.error;
                    }
                } catch (e) {
                    console.error("The server returned a non-JSON error response. This is likely due to a server-side crash or a routing issue.");
                    errorMessage = "The server returned an unexpected error. Please check your connection and try again. If the problem persists, the service may be temporarily unavailable.";
                }
                throw new Error(errorMessage);
            }
            
            const { id } = isEditMode ? { id: initialData.id } : await response.json();
            trackEvent(isEditMode ? 'update_success' : 'generate_success', { participants: validParticipants.length });
            
            const fullDataForState: ExchangeData = { ...exchangePayload, id, backgroundOptions };
            onComplete(fullDataForState);

        } catch (apiError) {
            const message = apiError instanceof Error ? apiError.message : "An unknown error occurred.";
            setError(message);
            setActiveStep(isEditMode ? activeStep : 2); // Go to rules step on creation error
            setIsLoading(false);
            trackEvent(isEditMode ? 'update_fail' : 'generate_fail', { error: message });
        }
    };
    
    // ... (rest of the component, including JSX)
    const handleNextStep = () => {
        if(activeStep < 3) {
            setActiveStep(activeStep + 1);
            generatorRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            <ConfirmationModal
                isOpen={isShuffleConfirmOpen}
                onClose={() => setIsShuffleConfirmOpen(false)}
                onConfirm={() => handleSubmit(true)}
                title="Reshuffle Matches?"
                message="You've changed participants or rules. To ensure a valid draw, all matches must be reshuffled. Do you want to continue?"
                confirmText="Yes, Reshuffle"
            />
            <Header />
            <main className="bg-slate-50">
                <div className="text-center py-16 px-4 bg-white border-b">
                     <div className="flex justify-center mb-4">
                        <img src="/logo_256.png" alt="Secret Santa Match Logo" className="h-20 w-20" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-red-700 font-serif">
                        {isEditMode ? 'Edit Your Gift Exchange' : 'Free Secret Santa Generator'}
                    </h1>
                    <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
                        {isEditMode ? 'Update participants, rules, or card styles below and save your changes.' : 'The easiest way to organize a gift exchange. No emails or sign-ups required!'}
                    </p>
                </div>

                {!isEditMode && <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="YOUR_AD_SLOT_ID_1" data-ad-format="auto" data-full-width-responsive="true" />}

                {!isEditMode && <div className="max-w-5xl mx-auto px-4 md:px-8"><HowItWorks /><VideoTutorial /></div>}
                
                <div ref={generatorRef} className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
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
                                <div><h3 className="font-bold">Oops! There's an issue.</h3><p>{error}</p></div>
                            </div>
                        )}

                        <div className={activeStep === 1 ? 'block' : 'hidden'}><ParticipantManager participants={participants} setParticipants={setParticipants} onBulkAddClick={() => setShowBulkAdd(true)} onClearClick={handleClear} setError={setError} /></div>
                        <div className={activeStep === 2 ? 'block' : 'hidden'}>
                            <RulesManager
                                participants={validParticipants}
                                exclusions={exclusions}
                                addExclusion={addExclusion}
                                updateExclusion={updateExclusion}
                                removeExclusion={removeExclusion}
                                assignments={assignments}
                                addAssignment={addAssignment}
                                updateAssignment={updateAssignment}
                                removeAssignment={removeAssignment}
                                eventDetails={eventDetails}
                                setEventDetails={setEventDetails}
                            />
                        </div>
                        <div className={activeStep === 3 ? 'block' : 'hidden'}><Options participants={validParticipants} eventDetails={eventDetails} selectedBackgroundId={selectedBackgroundId} setSelectedBackgroundId={setSelectedBackgroundId} customBackground={customBackground} setCustomBackground={setCustomBackground} backgroundOptions={backgroundOptions} textColor={textColor} setTextColor={setTextColor} useTextOutline={useTextOutline} setUseTextOutline={setUseTextOutline} outlineColor={outlineColor} setOutlineColor={setOutlineColor} outlineSize={outlineSize} setOutlineSize={setOutlineSize} fontSize={fontSize} setFontSize={setFontSize} fontTheme={fontTheme} setFontTheme={setFontTheme} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} greetingText={greetingText} setGreetingText={setGreetingText} introText={introText} setIntroText={setIntroText} wishlistLabelText={wishlistLabelText} setWishlistLabelText={setWishlistLabelText} /></div>
                    </div>

                    <div className="text-center pt-4">
                        {activeStep < 3 ? (
                            <button onClick={handleNextStep} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                                Next Step <ArrowRight />
                            </button>
                        ) : (
                             <button onClick={() => handleSubmit()} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                                {isEditMode ? <><Save /> Update Game</> : <><Shuffle /> Generate Matches!</>}
                            </button>
                        )}
                    </div>
                </div>

                {!isEditMode && (
                    <div className="max-w-5xl mx-auto px-4 md:px-8">
                        <WhyChooseUs />
                        <AdBanner data-ad-client="ca-pub-3037944530219260" data-ad-slot="YOUR_AD_SLOT_ID_2" data-ad-format="auto" data-full-width-responsive="true" />
                        <SocialProof />
                        <ShareTool />
                        <FaqSection />
                        <FeaturedResources />
                    </div>
                )}
            </main>
            <Footer />
            {showBulkAdd && <BulkAddModal onConfirm={handleBulkAdd} onClose={() => setShowBulkAdd(false)} />}
            {showCookieBanner && <CookieConsentBanner onAccept={handleCookieAccept} onDecline={handleCookieDecline} />}
        </>
    );
};

export default GeneratorPage;