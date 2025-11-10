import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, FileText, Palette, Check } from 'lucide-react';
import type { Participant, Exclusion, Assignment, Match, BackgroundOption, ExchangeData } from '../types';
import { generateMatches } from '../services/matchService';
import { serializeExchangeData, parseExchangeData } from '../services/urlService';
import { trackEvent } from '../services/analyticsService';

import Header from './Header';
import Footer from './Footer';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import BackgroundSelector from './BackgroundSelector';
import BulkAddModal from './BulkAddModal';
import ShareLinksModal from './ShareLinksModal';
import HowItWorks from './HowItWorks';
import WhyChooseUs from './WhyChooseUs';
import FaqSection from './FaqSection';
import CookieConsentBanner from './CookieConsentBanner';
import SocialProof from './SocialProof';
import VideoTutorial from './VideoTutorial';
import ShareTool from './ShareTool';
import FindWishlistModal from './FindWishlistModal';
import PrintableCard from './PrintableCard';

const GeneratorPage: React.FC = () => {
    // Participant and Rule State
    const [participants, setParticipants] = useState<Participant[]>([{ id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
    const [exclusions, setExclusions] = useState<Exclusion[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [eventDetails, setEventDetails] = useState('');
    
    // UI/Flow State
    const [activeTab, setActiveTab] = useState('participants');
    const [error, setError] = useState<string | null>(null);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareModalInitialView, setShareModalInitialView] = useState<string | null>(null);
    const [exchangeDataForModal, setExchangeDataForModal] = useState<ExchangeData | null>(null);
    const [showFindWishlistModal, setShowFindWishlistModal] = useState(false);
    
    // Display State (for reveal/organizer views)
    const [view, setView] = useState<'generator' | 'participant' | 'organizer'>('generator');
    const [displayData, setDisplayData] = useState<ExchangeData | null>(null);
    const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);

    // Card Styling State
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    const [selectedBackground, setSelectedBackground] = useState('gift-border');
    const [customBackground, setCustomBackground] = useState<string | null>(null);
    const [textColor, setTextColor] = useState('#265343');
    const [useTextOutline, setUseTextOutline] = useState(false);
    const [outlineColor, setOutlineColor] = useState('#ffffff');
    const [outlineSize, setOutlineSize] = useState<'thin' | 'normal' | 'thick'>('normal');
    const [fontSizeSetting, setFontSizeSetting] = useState<'normal' | 'large' | 'extra-large'>('normal');
    const [fontTheme, setFontTheme] = useState<'classic' | 'elegant' | 'modern' | 'whimsical'>('classic');
    const [lineSpacing, setLineSpacing] = useState(1.5);
    const [greetingText, setGreetingText] = useState("Hello, {secret_santa}!");
    const [introText, setIntroText] = useState("You are the Secret Santa for...");
    const [wishlistLabelText, setWishlistLabelText] = useState("Gift Ideas & Notes:");

    // PWA & Consent State
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);
    const [showConsentBanner, setShowConsentBanner] = useState(false);

    // --- Effects ---

    // Load background themes from JSON
    useEffect(() => {
        fetch('/templates.json')
            .then(res => res.json())
            .then((data: BackgroundOption[]) => {
                setBackgroundOptions(data);
                const defaultOption = data.find(opt => opt.id === 'gift-border');
                if (defaultOption) {
                    setSelectedBackground(defaultOption.id);
                    setTextColor(defaultOption.defaultTextColor || '#265343');
                    if (defaultOption.cardText) {
                        setGreetingText(defaultOption.cardText.greeting);
                        setIntroText(defaultOption.cardText.intro);
                        setWishlistLabelText(defaultOption.cardText.wishlistLabel);
                    }
                }
            })
            .catch(err => console.error("Failed to load background templates", err));
    }, []);

    // Check URL for existing data on load
    useEffect(() => {
        const handleUrlData = () => {
            const hash = window.location.hash.slice(1);
            const params = new URLSearchParams(window.location.search);
            const participantId = params.get('id');

            if (hash) {
                const data = parseExchangeData(hash);
                if (data) {
                    const fullData = { ...data, backgroundOptions };
                    setDisplayData(fullData);
                    if (participantId) {
                        setView('participant');
                        setCurrentParticipantId(participantId);
                    } else {
                        setView('organizer');
                    }
                }
            } else {
                setView('generator');
            }
        };
        if (backgroundOptions.length > 0) {
            handleUrlData();
        }
    }, [backgroundOptions]);

    // Analytics Consent
    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) {
            setShowConsentBanner(true);
        } else if (consent === 'granted') {
            window.consentGranted = true;
            trackEvent('page_view');
        }
    }, []);

    // PWA Install prompt listener
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            if(window.matchMedia('(display-mode: standalone)').matches === false) {
                 setShowInstallButton(true);
            }
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // --- Event Handlers ---

    const handleInstallClick = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
            trackEvent('pwa_install_attempt', { outcome: choiceResult.outcome });
            setShowInstallButton(false);
        });
    };

    const handleConsent = (granted: boolean) => {
        localStorage.setItem('cookie_consent', granted ? 'granted' : 'denied');
        setShowConsentBanner(false);
        const consentState = granted ? 'granted' : 'denied';
        window.gtag?.('consent', 'update', { 'analytics_storage': consentState });
        if (granted) {
            window.consentGranted = true;
            trackEvent('page_view');
        }
    };

    const handleBulkAdd = (names: string) => {
        const newNames = names.split('\n').map(name => name.trim()).filter(name => name);
        if (newNames.length > 0) {
            const newParticipants = newNames.map(name => ({ id: crypto.randomUUID(), name, interests: '', likes: '', dislikes: '', links: '', budget: '' }));
            const currentNonEmpty = participants.filter(p => p.name.trim() !== '');
            setParticipants([...currentNonEmpty, ...newParticipants, { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
        }
        setShowBulkAddModal(false);
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear all participants?")) {
            setParticipants([{ id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
            setExclusions([]);
            setAssignments([]);
        }
    };

    const navigateTabs = (direction: 'next' | 'prev') => {
        const tabs = ['participants', 'details', 'style'];
        const currentIndex = tabs.indexOf(activeTab);
        let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (direction === 'next' && activeTab === 'participants') {
            const filteredParticipants = participants.filter(p => p.name.trim() !== '');
            if (filteredParticipants.length < 2) {
                setError("You need at least two participants.");
                return;
            }
        }

        setError(null);
        if (nextIndex >= 0 && nextIndex < tabs.length) {
            setActiveTab(tabs[nextIndex]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGenerateMatches = async (initialView?: 'print' | 'share') => {
        setError(null);
        const validParticipants = participants.filter(p => p.name.trim() !== '');
        
        const { matches: generatedMatches, error: matchError } = generateMatches(validParticipants, exclusions, assignments);
        
        if (matchError || !generatedMatches) {
            setError(matchError || "Failed to generate matches. Please check your exclusions and try again.");
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/create-wishlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participants: validParticipants })
            });
            if (!response.ok) throw new Error("Could not create wishlists on the server.");

            const { wishlistIds } = await response.json();
            const participantsWithWishlists = validParticipants.map(p => {
                const wish = wishlistIds.find((w: any) => w.participantId === p.id);
                return { ...p, wishlistId: wish ? wish.wishlistId : undefined };
            });

            const finalMatches: Match[] = generatedMatches.map((m: Match) => ({
                giver: participantsWithWishlists.find(p => p.id === m.giver.id)!,
                receiver: participantsWithWishlists.find(p => p.id === m.receiver.id)!,
            }));

            const dataToSerialize: Omit<ExchangeData, 'backgroundOptions'> = {
                p: participantsWithWishlists,
                matches: finalMatches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
                eventDetails,
                bgId: selectedBackground,
                customBackground, textColor, useTextOutline, outlineColor, outlineSize,
                fontSizeSetting, fontTheme, lineSpacing, greetingText, introText, wishlistLabelText,
            };

            const fullExchangeData = { ...dataToSerialize, backgroundOptions };
            setExchangeDataForModal(fullExchangeData);

            // Navigate to organizer view in-app
            setDisplayData(fullExchangeData);
            setView('organizer');
            window.location.hash = serializeExchangeData(dataToSerialize);

            // Open the share modal
            setShareModalInitialView(initialView || null);
            setShowShareModal(true);

            trackEvent('generate_matches', {
                participant_count: validParticipants.length,
                exclusion_count: exclusions.length,
                assignment_count: assignments.length,
            });
        } catch(err) {
            setError(err instanceof Error ? err.message : "A server error occurred. Please try again.");
            console.error(err);
        }
    };

    // --- Render Functions ---

    const renderGenerator = () => (
        <>
            <section className="text-center my-8">
                <div className="flex justify-center items-center gap-4 mb-4">
                    <img src="/logo_256.png" alt="Secret Santa Generator Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Free Secret Santa Generator</h1>
                <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">
                    The easiest way to organize a gift exchange. No emails or sign-ups required. Instantly draw names, set rules, and share private links!
                </p>
            </section>
            
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 relative">
                {/* Tab Navigation */}
                <div className="mb-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('participants')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-semibold text-sm ${activeTab === 'participants' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            <Users className="-ml-0.5 mr-2 h-5 w-5" /><span>1. Add Participants</span>
                        </button>
                        <button onClick={() => setActiveTab('details')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-semibold text-sm ${activeTab === 'details' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            <FileText className="-ml-0.5 mr-2 h-5 w-5" /><span>2. Add Details & Rules</span>
                        </button>
                        <button onClick={() => setActiveTab('style')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-semibold text-sm ${activeTab === 'style' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            <Palette className="-ml-0.5 mr-2 h-5 w-5" /><span>3. Style Your Cards</span>
                        </button>
                    </nav>
                </div>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert"><p>{error}</p></div>}
                
                {/* FIX: Refactored AnimatePresence to resolve a TypeScript typing error with motion.div props. */}
                <AnimatePresence mode="wait">
                    {activeTab === 'participants' && (
                        <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <ParticipantManager participants={participants} setParticipants={setParticipants} onBulkAddClick={() => setShowBulkAddModal(true)} onClearClick={handleClear} />
                        </motion.div>
                    )}
                    {activeTab === 'details' && (
                        <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <Options participants={participants.filter(p => p.name.trim() !== '')} exclusions={exclusions} setExclusions={setExclusions} assignments={assignments} setAssignments={setAssignments} eventDetails={eventDetails} setEventDetails={setEventDetails} trackEvent={trackEvent} />
                        </motion.div>
                    )}
                    {activeTab === 'style' && (
                        <motion.div key="style" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <BackgroundSelector participants={participants} eventDetails={eventDetails} backgroundOptions={backgroundOptions} selectedBackground={selectedBackground} setSelectedBackground={setSelectedBackground} customBackground={customBackground} setCustomBackground={setCustomBackground} textColor={textColor} setTextColor={setTextColor} useTextOutline={useTextOutline} setUseTextOutline={setUseTextOutline} outlineColor={outlineColor} setOutlineColor={setOutlineColor} outlineSize={outlineSize} setOutlineSize={setOutlineSize} fontSizeSetting={fontSizeSetting} setFontSizeSetting={setFontSizeSetting} fontTheme={fontTheme} setFontTheme={setFontTheme} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} greetingText={greetingText} setGreetingText={setGreetingText} introText={introText} setIntroText={setIntroText} wishlistLabelText={wishlistLabelText} setWishlistLabelText={setWishlistLabelText} trackEvent={trackEvent} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Floating Navigation */}
            <div className="sticky bottom-4 z-20 mt-8">
                <div className="max-w-md mx-auto bg-white/80 backdrop-blur-lg rounded-full shadow-2xl border p-2 flex items-center justify-between">
                    <button onClick={() => navigateTabs('prev')} disabled={activeTab === 'participants'} className="py-2 px-5 text-gray-600 font-semibold rounded-full hover:bg-gray-200 disabled:opacity-50">Back</button>
                    {activeTab !== 'style' ? (
                        <button onClick={() => navigateTabs('next')} className="py-3 px-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-colors shadow">Next Step &rarr;</button>
                    ) : (
                        <button onClick={() => handleGenerateMatches()} className="py-3 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-colors shadow flex items-center gap-2">
                            <Check /> Generate Matches
                        </button>
                    )}
                </div>
            </div>

            <HowItWorks />
            <WhyChooseUs />
            <VideoTutorial />
            <FaqSection />
            <ShareTool />
        </>
    );

    const renderParticipantView = () => {
        if (!displayData) return null;
        const match = displayData.matches.find(m => m.g === currentParticipantId);
        if (!match) return <div>Match not found for this participant.</div>;
        
        const fullMatch: Match = {
            giver: displayData.p.find(p => p.id === match.g)!,
            receiver: displayData.p.find(p => p.id === match.r)!,
        };

        return (
            <div className="max-w-md mx-auto my-12">
                 <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif text-center mb-2">Your Secret Santa Reveal!</h1>
                 <p className="text-slate-600 text-center mb-6">You are the Secret Santa for...</p>
                 <PrintableCard
                    match={fullMatch}
                    eventDetails={displayData.eventDetails}
                    isNameRevealed={true}
                    backgroundOptions={backgroundOptions}
                    bgId={displayData.bgId}
                    bgImg={displayData.customBackground}
                    txtColor={displayData.textColor}
                    outline={displayData.useTextOutline}
                    outColor={displayData.outlineColor}
                    outSize={displayData.outlineSize}
                    fontSize={displayData.fontSizeSetting}
                    font={displayData.fontTheme}
                    line={displayData.lineSpacing}
                    greet={displayData.greetingText}
                    intro={displayData.introText}
                    wish={displayData.wishlistLabelText}
                    showWishlistLink={true}
                />
            </div>
        );
    };

    const renderOrganizerView = () => {
        if (!displayData) return null;
        return (
             <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif text-center mb-2">Success! Matches Generated.</h1>
                <p className="text-slate-600 text-center mb-8">This is your private organizer page. Share the links below with each participant.</p>
                <button onClick={() => setShowShareModal(true)} className="block mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg">
                    Re-Open Share & Download Links
                </button>
            </div>
        );
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <Header onFindWishlistClick={() => setShowFindWishlistModal(true)} />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                {view === 'generator' && renderGenerator()}
                {view === 'participant' && renderParticipantView()}
                {view === 'organizer' && renderOrganizerView()}
            </main>
            
            {showBulkAddModal && <BulkAddModal onClose={() => setShowBulkAddModal(false)} onConfirm={handleBulkAdd} />}
            {showShareModal && displayData && <ShareLinksModal exchangeData={{...displayData, backgroundOptions}} onClose={() => setShowShareModal(false)} initialView={shareModalInitialView} />}
            {showFindWishlistModal && <FindWishlistModal onClose={() => setShowFindWishlistModal(false)} />}
            
            <Footer showInstallButton={showInstallButton} onInstallClick={handleInstallClick} />
            {showConsentBanner && <CookieConsentBanner onAccept={() => handleConsent(true)} onDecline={() => handleConsent(false)} />}
        </div>
    );
};

export default GeneratorPage;