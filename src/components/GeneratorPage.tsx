import React, { useState, useEffect, useMemo } from 'react';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import BulkAddModal from './BulkAddModal';
import BackgroundSelector from './BackgroundSelector';
import ShareLinksModal from './ShareLinksModal';
import Header from './Header';
import Footer from './Footer';
import HowItWorks from './HowItWorks';
import WhyChooseUs from './WhyChooseUs';
import FaqSection from './FaqSection';
import SocialProof from './SocialProof';
import VideoTutorial from './VideoTutorial';
import ShareTool from './ShareTool';
import CookieConsentBanner from './CookieConsentBanner';
import BackToTopButton from './BackToTopButton';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import { generateMatches } from '../services/matchService';
import { serializeExchangeData, parseExchangeData } from '../services/urlService';
import { trackEvent } from '../services/analyticsService';
import type { Participant, Exclusion, Assignment, Match, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme, ExchangeData } from '../types';
import { Loader2, AlertTriangle, Lock } from 'lucide-react';

type View = 'generator' | 'reveal' | 'organizer' | 'loading' | 'error';

// Sub-component for the reveal view
const RevealView: React.FC<{ exchangeData: ExchangeData, participantId: string }> = ({ exchangeData, participantId }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const match = useMemo(() => {
        const matchInfo = exchangeData.matches.find(m => m.g === participantId);
        if (!matchInfo) return null;
        return {
            giver: exchangeData.p.find(p => p.id === matchInfo.g)!,
            receiver: exchangeData.p.find(p => p.id === matchInfo.r)!,
        };
    }, [exchangeData, participantId]);

    if (!match) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-md"><AlertTriangle className="mx-auto text-red-500 w-12 h-12" /><p className="mt-4">Could not find your match in this exchange. The link might be incorrect.</p></div>;
    }

    return (
        <div className="max-w-md mx-auto">
             <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 font-serif">Your Secret Santa Match!</h1>
                <p className="text-slate-600 mt-2">Click the card to reveal who you're getting a gift for.</p>
            </div>
            <PrintableCard
                match={match}
                eventDetails={exchangeData.eventDetails}
                isNameRevealed={isRevealed}
                onReveal={() => { if (!isRevealed) { setIsRevealed(true); trackEvent('reveal_match'); }}}
                backgroundOptions={exchangeData.backgroundOptions}
                bgId={exchangeData.bgId}
                bgImg={exchangeData.customBackground}
                txtColor={exchangeData.textColor}
                outline={exchangeData.useTextOutline}
                outColor={exchangeData.outlineColor}
                outSize={exchangeData.outlineSize}
                fontSize={exchangeData.fontSizeSetting}
                font={exchangeData.fontTheme}
                line={exchangeData.lineSpacing}
                greet={exchangeData.greetingText}
                intro={exchangeData.introText}
                wish={exchangeData.wishlistLabelText}
                showWishlistLink={true}
            />
             <div className="mt-8 text-center bg-slate-100 p-4 rounded-lg">
                <p className="font-semibold flex items-center justify-center gap-2"><Lock size={16}/> This is a private link.</p>
                <p className="text-sm text-slate-600">Only you can see this page. Don't share it!</p>
            </div>
        </div>
    );
};

// Sub-component for the organizer's master view
const OrganizerView: React.FC<{ exchangeData: ExchangeData }> = ({ exchangeData }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    const matches: Match[] = useMemo(() => exchangeData.matches.map(m => ({
        giver: exchangeData.p.find(p => p.id === m.g)!,
        receiver: exchangeData.p.find(p => p.id === m.r)!,
    })).filter(match => match.giver && match.receiver), [exchangeData]);

    return (
        <>
            <section className="text-center my-8">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Your Secret Santa Event!</h1>
                <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">
                    This is your master page. Bookmark it to see all matches.
                </p>
                 <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all"
                >
                    Share & Download Links
                </button>
            </section>
            
            <div className="my-12">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-6 text-center">Master Match List</h2>
                <ResultsDisplay matches={matches} />
            </div>

            <div className="my-12">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-6 text-center">Printable Cards Preview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {matches.map(match => (
                        <PrintableCard
                            key={match.giver.id}
                            match={match}
                            eventDetails={exchangeData.eventDetails}
                            isNameRevealed={true}
                            backgroundOptions={exchangeData.backgroundOptions}
                            bgId={exchangeData.bgId}
                            bgImg={exchangeData.customBackground}
                            txtColor={exchangeData.textColor}
                            outline={exchangeData.useTextOutline}
                            outColor={exchangeData.outlineColor}
                            outSize={exchangeData.outlineSize}
                            fontSize={exchangeData.fontSizeSetting}
                            font={exchangeData.fontTheme}
                            line={exchangeData.lineSpacing}
                            greet={exchangeData.greetingText}
                            intro={exchangeData.introText}
                            wish={exchangeData.wishlistLabelText}
                            showWishlistLink={true}
                        />
                    ))}
                </div>
            </div>
            {isShareModalOpen && (
                 <ShareLinksModal
                    onClose={() => setIsShareModalOpen(false)}
                    exchangeData={exchangeData}
                />
            )}
        </>
    );
};

const GeneratorPage: React.FC = () => {
    const [view, setView] = useState<View>('loading');
    const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // State for participants and rules
    const [participants, setParticipants] = useState<Participant[]>([
        { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }
    ]);
    const [exclusions, setExclusions] = useState<Exclusion[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [eventDetails, setEventDetails] = useState('');

    // State for modals
    const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
    
    // State for errors and loading
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // State for card styling
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    const [selectedBackground, setSelectedBackground] = useState('gift-border');
    const [customBackground, setCustomBackground] = useState<string | null>(null);
    const [textColor, setTextColor] = useState('#265343');
    const [useTextOutline, setUseTextOutline] = useState(false);
    const [outlineColor, setOutlineColor] = useState('#FFFFFF');
    const [outlineSize, setOutlineSize] = useState<OutlineSizeSetting>('thin');
    const [fontSizeSetting, setFontSizeSetting] = useState<FontSizeSetting>('normal');
    const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
    const [lineSpacing, setLineSpacing] = useState(1.5);
    const [greetingText, setGreetingText] = useState("Hello, {secret_santa}!");
    const [introText, setIntroText] = useState("You are the Secret Santa for...");
    const [wishlistLabelText, setWishlistLabelText] = useState("Gift Ideas & Notes:");

    // State for cookie consent
    const [showConsentBanner, setShowConsentBanner] = useState(false);
    
    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) setShowConsentBanner(true);
        else if (consent === 'granted') window.consentGranted = true;
    }, []);

    useEffect(() => {
        let isMounted = true;
        
        const processUrl = (bgOptions: BackgroundOption[]) => {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            const hash = window.location.hash.slice(1);

            if (hash) {
                const parsedData = parseExchangeData(hash);
                if (parsedData) {
                    if (!isMounted) return;
                    const fullData = { ...parsedData, backgroundOptions: bgOptions };
                    setExchangeData(fullData);
                    if (id) {
                        setParticipantId(id);
                        setView('reveal');
                    } else {
                        setView('organizer');
                    }
                } else {
                    setErrorMessage("Could not read data from the URL. It might be corrupted.");
                    setView('error');
                }
            } else {
                 setView('generator');
            }
        };

        fetch('/templates.json')
            .then(res => res.json())
            .then((data: BackgroundOption[]) => {
                if(isMounted) {
                    setBackgroundOptions(data);
                    if (data.length > 0) {
                        const defaultOption = data.find(opt => opt.id === 'gift-border') || data[0];
                        setSelectedBackground(defaultOption.id);
                        setTextColor(defaultOption.defaultTextColor || '#333333');
                        if (defaultOption.cardText) {
                            setGreetingText(defaultOption.cardText.greeting);
                            setIntroText(defaultOption.cardText.intro);
                            setWishlistLabelText(defaultOption.cardText.wishlistLabel);
                        }
                    }
                    processUrl(data);
                }
            })
            .catch(err => {
                console.error("Failed to load background templates:", err);
                setErrorMessage("Failed to load required application assets.");
                if(isMounted) setView('error');
            });
            
        return () => { isMounted = false; };

    }, []);
    
    const handleAcceptCookies = () => {
        localStorage.setItem('cookie_consent', 'granted');
        window.consentGranted = true;
        setShowConsentBanner(false);
        trackEvent('consent_accept');
    };

    const handleDeclineCookies = () => {
        localStorage.setItem('cookie_consent', 'denied');
        window.consentGranted = false;
        setShowConsentBanner(false);
        trackEvent('consent_decline');
    };

    const handleBulkAdd = (names: string) => {
        const newParticipants = names.split('\n')
            .map(name => name.trim())
            .filter(name => name)
            .map(name => ({ id: crypto.randomUUID(), name, interests: '', likes: '', dislikes: '', links: '', budget: '' }));

        if (newParticipants.length > 0) {
            const currentNonEmpty = participants.filter(p => p.name.trim() !== '');
            setParticipants([...currentNonEmpty, ...newParticipants, { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
        }
        setIsBulkAddModalOpen(false);
    };

    const handleClear = () => {
        setParticipants([{ id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
        setExclusions([]);
        setAssignments([]);
    };
    
    const handleGenerateMatches = async () => {
        setError('');
        setIsLoading(true);
        const validParticipants = participants.filter(p => p.name.trim() !== '');
        
        if (validParticipants.length < 3) {
            setError("You need at least 3 participants for a Secret Santa exchange.");
            setIsLoading(false);
            return;
        }

        try {
            // Step 1: Generate matches
            const matchesResult = generateMatches(validParticipants, exclusions, assignments);
            
            if (matchesResult.error || !matchesResult.matches) {
                throw new Error(matchesResult.error || "Failed to generate valid matches.");
            }

            // Step 2: Create wishlists in the backend
            const wishlistResponse = await fetch('/.netlify/functions/create-wishlists', {
                method: 'POST',
                body: JSON.stringify({ participants: validParticipants })
            });
            if (!wishlistResponse.ok) {
                throw new Error('Could not create wishlists. Please try again.');
            }
            const { wishlistIds } = await wishlistResponse.json();

            // Step 3: Add wishlist IDs to participants
            const participantsWithWishlists = validParticipants.map(p => {
                const mapping = wishlistIds.find((w: any) => w.participantId === p.id);
                return { ...p, wishlistId: mapping?.wishlistId };
            });

            // Step 4: Prepare data for URL
            const dataForUrl: Omit<ExchangeData, 'backgroundOptions'> = {
                p: participantsWithWishlists,
                matches: matchesResult.matches.map((m: Match) => ({ g: m.giver.id, r: m.receiver.id })),
                eventDetails,
                bgId: selectedBackground,
                customBackground,
                textColor,
                useTextOutline,
                outlineColor,
                outlineSize,
                fontSizeSetting,
                fontTheme,
                lineSpacing,
                greetingText,
                introText,
                wishlistLabelText,
            };

            const fullData: ExchangeData = { ...dataForUrl, backgroundOptions };
            const hash = serializeExchangeData(dataForUrl);
            
            // Step 5: Update URL and view
            const newUrl = window.location.pathname + '#' + hash;
            window.history.pushState({}, '', newUrl);
            
            setExchangeData(fullData);
            setView('organizer');
            trackEvent('generate_success', { num_participants: validParticipants.length, num_exclusions: exclusions.length });

        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during matching.");
            trackEvent('generate_error', { error_message: e instanceof Error ? e.message : String(e) });
        } finally {
            setIsLoading(false);
        }
    };
    
    const validParticipantCount = participants.filter(p => p.name.trim() !== '').length;
    
    const renderGenerator = () => (
         <div className="space-y-12">
             <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-6">1. Add Participants</h2>
                <ParticipantManager 
                    participants={participants}
                    setParticipants={setParticipants}
                    onBulkAddClick={() => setIsBulkAddModalOpen(true)}
                    onClearClick={handleClear}
                />
             </div>
             <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                 <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-6">2. Add Details & Rules</h2>
                <Options 
                    participants={participants.filter(p => p.name.trim() !== '')}
                    exclusions={exclusions}
                    setExclusions={setExclusions}
                    assignments={assignments}
                    setAssignments={setAssignments}
                    eventDetails={eventDetails}
                    setEventDetails={setEventDetails}
                    trackEvent={trackEvent}
                />
             </div>
              <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                 <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-6">3. Design Your Reveal Cards</h2>
                 <BackgroundSelector
                    participants={participants}
                    eventDetails={eventDetails}
                    backgroundOptions={backgroundOptions}
                    selectedBackground={selectedBackground}
                    setSelectedBackground={setSelectedBackground}
                    customBackground={customBackground}
                    setCustomBackground={setCustomBackground}
                    textColor={textColor}
                    setTextColor={setTextColor}
                    useTextOutline={useTextOutline}
                    setUseTextOutline={setUseTextOutline}
                    outlineColor={outlineColor}
                    setOutlineColor={setOutlineColor}
                    outlineSize={outlineSize}
                    setOutlineSize={setOutlineSize}
                    fontSizeSetting={fontSizeSetting}
                    setFontSizeSetting={setFontSizeSetting}
                    fontTheme={fontTheme}
                    setFontTheme={setFontTheme}
                    lineSpacing={lineSpacing}
                    setLineSpacing={setLineSpacing}
                    greetingText={greetingText}
                    setGreetingText={setGreetingText}
                    introText={introText}
                    setIntroText={setIntroText}
                    wishlistLabelText={wishlistLabelText}
                    setWishlistLabelText={setWishlistLabelText}
                    trackEvent={trackEvent}
                 />
              </div>
        </div>
    );
    
    const renderContent = () => {
        switch (view) {
            case 'loading':
                return <div className="text-center py-20"><Loader2 className="animate-spin h-12 w-12 text-red-600 mx-auto" /></div>;
            case 'error':
                 return <div className="text-center p-8 bg-white rounded-lg shadow-md"><AlertTriangle className="mx-auto text-red-500 w-12 h-12" /><p className="mt-4">{errorMessage}</p></div>;
            case 'reveal':
                return <RevealView exchangeData={exchangeData!} participantId={participantId!} />;
            case 'organizer':
                return <OrganizerView exchangeData={exchangeData!} />;
            case 'generator':
            default:
                return (
                    <>
                        <section className="text-center my-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Free Secret Santa Generator</h1>
                            <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">
                                The easiest way to organize a gift exchange. No emails, no sign-ups, and 100% private.
                            </p>
                        </section>
                        {renderGenerator()}
                        <div className="text-center my-12">
                            {error && <p className="text-red-600 bg-red-50 p-3 rounded-md text-sm mb-4">{error}</p>}
                            <button 
                                onClick={handleGenerateMatches}
                                disabled={isLoading || validParticipantCount < 3}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-10 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all disabled:bg-slate-400 disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="animate-spin inline-block" /> : `Generate Matches (${validParticipantCount})`}
                            </button>
                            {validParticipantCount < 3 && <p className="text-slate-500 text-sm mt-2">Add at least 3 participants to generate matches.</p>}
                        </div>
                        <HowItWorks />
                        <WhyChooseUs />
                        <SocialProof />
                        <VideoTutorial />
                        <FaqSection />
                        <ShareTool />
                    </>
                );
        }
    };

    return (
        <div className="bg-slate-50">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                {renderContent()}
            </main>
            <Footer />
            <BackToTopButton />

            {isBulkAddModalOpen && (
                <BulkAddModal 
                    onClose={() => setIsBulkAddModalOpen(false)}
                    onConfirm={handleBulkAdd}
                />
            )}
            
            {showConsentBanner && (
                <CookieConsentBanner onAccept={handleAcceptCookies} onDecline={handleDeclineCookies} />
            )}
        </div>
    );
};

export default GeneratorPage;