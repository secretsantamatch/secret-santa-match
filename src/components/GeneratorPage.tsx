

import React, { useState, useEffect, useRef } from 'react';
import type { Participant, Exclusion, Assignment, Match, ExchangeData, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import BulkAddModal from './BulkAddModal';
import Header from './Header';
import Footer from './Footer';
import HowItWorks from './HowItWorks';
import FaqSection from './FaqSection';
import { encodeData } from '../services/urlService';
import BackgroundSelector from './BackgroundSelector';
import WhyChooseUs from './WhyChooseUs';
import SocialProof from './SocialProof';
import VideoTutorial from './VideoTutorial';
import FeaturedResources from './FeaturedResources';
import ShareTool from './ShareTool';
import BackToTopButton from './BackToTopButton';

// Analytics helper
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  } else {
    console.log(`Analytics Event (gtag not found): ${eventName}`, eventParams);
  }
};


const GeneratorPage: React.FC = () => {
    // State for participants and rules
    const [participants, setParticipants] = useState<Participant[]>([
        { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
        { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
        { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
    ]);
    const [exclusions, setExclusions] = useState<Exclusion[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [eventDetails, setEventDetails] = useState('');
    const [exchangeDate, setExchangeDate] = useState('');
    const [exchangeTime, setExchangeTime] = useState('');
    const [pageTheme, setPageTheme] = useState('default');
    
    // State for styling
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    const [selectedBackground, setSelectedBackground] = useState('plain-white');
    const [customBackground, setCustomBackground] = useState<string | null>(null);
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [useTextOutline, setUseTextOutline] = useState(true);
    const [outlineColor, setOutlineColor] = useState('#000000');
    const [outlineSize, setOutlineSize] = useState<OutlineSizeSetting>('normal');
    const [fontSizeSetting, setFontSizeSetting] = useState<FontSizeSetting>('normal');
    const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
    const [lineSpacing, setLineSpacing] = useState(1.5);
    const [greetingText, setGreetingText] = useState("Happy Holidays, {secret_santa}!");
    const [introText, setIntroText] = useState("You are the Secret Santa for...");
    const [wishlistLabelText, setWishlistLabelText] = useState("Gift Ideas & Wishlist");

    // UI State
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('participants'); // 'participants', 'rules', 'styles'
    
    const resultsRef = useRef<HTMLDivElement>(null);

    // Listen for data from Chrome Extension on initial load
    useEffect(() => {
        const handleExtensionData = (event: CustomEvent) => {
            const incomingData = event.detail;
            if (incomingData && Array.isArray(incomingData) && incomingData.length > 0) {
                const incomingParticipants: Participant[] = incomingData.map((p: any) => ({
                    id: p.id || crypto.randomUUID(),
                    name: p.name || '',
                    notes: p.notes || '',
                    budget: p.budget || '',
                }));

                // If the default participants are empty, replace them. Otherwise, add to the list.
                const hasDefaultNames = participants.some(p => p.name.trim() !== '');
                if (hasDefaultNames) {
                     setParticipants(prev => [...prev.filter(p => p.name.trim() !== ''), ...incomingParticipants]);
                } else {
                    setParticipants(incomingParticipants);
                }
            }
        };

        // The content script will dispatch this event with the data
        window.addEventListener('ssm-participants-ready', handleExtensionData as EventListener);

        return () => {
            window.removeEventListener('ssm-participants-ready', handleExtensionData as EventListener);
        };
    }, [participants]); // Rerun if participants changes to handle adding to existing list vs replacing

    // Fetch background options on mount
    useEffect(() => {
        fetch('/templates.json')
            .then(res => res.json())
            .then(data => {
                setBackgroundOptions(data);
                // Set initial styles based on a default theme if available
                const defaultTheme = data.find((opt: BackgroundOption) => opt.id === 'gift-border');
                if (defaultTheme) {
                    setSelectedBackground(defaultTheme.id);
                    setTextColor(defaultTheme.defaultTextColor || '#FFFFFF');
                    if (defaultTheme.cardText?.greeting) setGreetingText(defaultTheme.cardText.greeting);
                    if (defaultTheme.cardText?.intro) setIntroText(defaultTheme.cardText.intro);
                    if (defaultTheme.cardText?.wishlistLabel) setWishlistLabelText(defaultTheme.cardText.wishlistLabel);
                }
            })
            .catch(err => console.error("Failed to load background templates:", err));
    }, []);

    // Update styles when selected background changes
    useEffect(() => {
        if (customBackground) return;
        const selectedOption = backgroundOptions.find(opt => opt.id === selectedBackground);
        if (selectedOption) {
            setTextColor(selectedOption.defaultTextColor || '#FFFFFF');
            if (selectedOption.cardText?.greeting) setGreetingText(selectedOption.cardText.greeting);
            if (selectedOption.cardText?.intro) setIntroText(selectedOption.cardText.intro);
            if (selectedOption.cardText?.wishlistLabel) setWishlistLabelText(selectedOption.cardText.wishlistLabel);
        }
    }, [selectedBackground, backgroundOptions, customBackground]);


    const handleBulkAdd = (names: string) => {
        const newNames = names.split('\n').map(name => name.trim()).filter(name => name !== '');
        const newParticipants: Participant[] = newNames.map(name => ({
            id: crypto.randomUUID(),
            name,
            notes: '',
            budget: ''
        }));
        setParticipants(prev => [...prev.filter(p => p.name.trim() !== ''), ...newParticipants]);
        setShowBulkAddModal(false);
        trackEvent('bulk_add_participants', { count: newParticipants.length });
    };

    const handleClearParticipants = () => {
        setParticipants([
            { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
            { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
            { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
        ]);
        setExclusions([]);
        setAssignments([]);
    };
    
    const generateMatches = (): Match[] | null => {
        const validParticipants = participants.filter(p => p.name.trim() !== '');
        if (validParticipants.length < 3) {
            setError("You need at least 3 participants to start a gift exchange.");
            return null;
        }

        let matches: Match[] = [];
        const maxRetries = 100;

        for (let i = 0; i < maxRetries; i++) {
            let givers = [...validParticipants];
            let receivers = [...validParticipants];
            let tempMatches: Match[] = [];
            let possible = true;

            // Handle assignments first
            const assignedGiverIds = new Set(assignments.map(a => a.giverId));
            const assignedReceiverIds = new Set(assignments.map(a => a.receiverId));

            for (const assignment of assignments) {
                const giver = givers.find(p => p.id === assignment.giverId);
                const receiver = receivers.find(p => p.id === assignment.receiverId);
                if (giver && receiver) {
                    tempMatches.push({ giver, receiver });
                }
            }

            givers = givers.filter(p => !assignedGiverIds.has(p.id));
            receivers = receivers.filter(p => !assignedReceiverIds.has(p.id));

            // Shuffle remaining receivers
            receivers.sort(() => Math.random() - 0.5);

            for (const giver of givers) {
                let foundMatch = false;
                for (let j = 0; j < receivers.length; j++) {
                    const receiver = receivers[j];
                    const isSelf = giver.id === receiver.id;
                    const isExcluded = exclusions.some(ex =>
                        (ex.p1 === giver.id && ex.p2 === receiver.id) ||
                        (ex.p1 === receiver.id && ex.p2 === giver.id)
                    );
                    
                    if (!isSelf && !isExcluded) {
                        tempMatches.push({ giver, receiver });
                        receivers.splice(j, 1);
                        foundMatch = true;
                        break;
                    }
                }

                if (!foundMatch) {
                    possible = false;
                    break;
                }
            }
            
            if (possible && tempMatches.length === validParticipants.length) {
                matches = tempMatches;
                break;
            }
        }

        if (matches.length !== validParticipants.length) {
            setError("Could not generate valid matches with the current rules. Try removing some exclusions or assignments.");
            return null;
        }

        return matches;
    };

    const handleGenerateExchange = () => {
        setError(null);
        trackEvent('click_generate_button');
        
        const matches = generateMatches();
        if (!matches) {
            window.scrollTo(0, 0);
            return;
        }
        
        const validParticipants = participants.filter(p => p.name.trim() !== '');
        
        const exchangeData: ExchangeData = {
            matches: matches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
            p: validParticipants,
            eventDetails,
            exchangeDate,
            exchangeTime,
            pageTheme,
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
            backgroundOptions,
        };

        const encoded = encodeData(exchangeData);
        if (encoded) {
            window.location.hash = encoded;
        } else {
            setError("There was an error creating your shareable link.");
        }
    };

    const tabs = [
        { id: 'participants', label: '1. Add Participants', icon: '👥' },
        { id: 'rules', label: '2. Add Details & Rules', icon: '📜' },
        { id: 'styles', label: '3. Style Your Cards', icon: '🎨' }
    ];

    return (
        <>
            <Header />
            <div className="bg-slate-50">
                <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                    <section className="text-center py-8">
                        <div className="flex justify-center items-center gap-4 mb-4">
                            <img src="/logo_256.png" alt="Secret Santa Generator Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-red-700 font-serif">Free Secret Santa Generator</h1>
                        <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">The easiest way to organize a gift exchange. No emails or sign-ups required. Instantly draw names online, set rules, and share private links!</p>
                    </section>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="mb-8 border-b border-slate-200">
                            <nav className="flex flex-wrap -mb-px">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`shrink-0 border-b-4 font-semibold p-4 transition-colors text-sm sm:text-base ${
                                            activeTab === tab.id
                                                ? 'border-red-600 text-red-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <span className="mr-2">{tab.icon}</span> {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className={activeTab === 'participants' ? 'block' : 'hidden'}>
                            <ParticipantManager
                                participants={participants}
                                setParticipants={setParticipants}
                                onBulkAddClick={() => setShowBulkAddModal(true)}
                                onClearClick={handleClearParticipants}
                            />
                        </div>

                        <div className={activeTab === 'rules' ? 'block' : 'hidden'}>
                            <Options
                                participants={participants.filter(p => p.name.trim() !== '')}
                                exclusions={exclusions}
                                setExclusions={setExclusions}
                                assignments={assignments}
                                setAssignments={setAssignments}
                                eventDetails={eventDetails}
                                setEventDetails={setEventDetails}
                            />
                        </div>
                        
                        <div className={activeTab === 'styles' ? 'block' : 'hidden'}>
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
                    
                     <div className="mt-10 text-center">
                        <button 
                            onClick={handleGenerateExchange}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-5 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3 mx-auto"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707-1.707A1 1 0 00.879 11.293l3.5 3.5a1 1 0 001.414 0l3.5-3.5a1 1 0 00-1.414-1.414L7.95 9.879L6.243 11.586V8a4 4 0 118 0v3.586l-1.707-1.707A1 1 0 0011.121 11.293l3.5 3.5a1 1 0 001.414 0l3.5-3.5a1 1 0 00-1.414-1.414L16.243 11.586V8a6 6 0 00-6-6z" /></svg>
                             Generate Matches
                        </button>
                    </div>

                </main>
                <HowItWorks />
                <VideoTutorial />
                <WhyChooseUs />
                <SocialProof />
                <ShareTool />
                <FaqSection />
                <FeaturedResources />
                <Footer />
                <BackToTopButton />
            </div>
            
            {showBulkAddModal && (
                <BulkAddModal
                    onClose={() => setShowBulkAddModal(false)}
                    onConfirm={handleBulkAdd}
                />
            )}
        </>
    );
};

export default GeneratorPage;
