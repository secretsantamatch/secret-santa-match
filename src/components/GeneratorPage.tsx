import React, { useState, useEffect } from 'react';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import BackgroundSelector from './BackgroundSelector';
import FaqSection from './FaqSection';
import Footer from './Footer';
import Header from './Header';
import HowItWorks from './HowItWorks';
import SocialProof from './SocialProof';
import WhyChooseUs from './WhyChooseUs';
import VideoTutorial from './VideoTutorial';
import ShareTool from './ShareTool';
import BulkAddModal from './BulkAddModal';
import ResourcesSection from './ResourcesSection';
import type { Participant, Exclusion, Assignment, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme, ExchangeData } from '../types';
import { generateMatches } from '../services/matchService';
import { encodeData } from '../services/urlService';
import { trackEvent } from '../services/analyticsService';

const GeneratorPage: React.FC = () => {
    const [participants, setParticipants] = useState<Participant[]>([
        { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
    ]);
    const [exclusions, setExclusions] = useState<Exclusion[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [eventDetails, setEventDetails] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    
    // Styling state
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    const [selectedBackground, setSelectedBackground] = useState('plain-white');
    const [customBackground, setCustomBackground] = useState<string | null>(null);
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [useTextOutline, setUseTextOutline] = useState(true);
    const [outlineColor, setOutlineColor] = useState('#000000');
    const [outlineSize, setOutlineSize] = useState<OutlineSizeSetting>('thin');
    const [fontSizeSetting, setFontSizeSetting] = useState<FontSizeSetting>('normal');
    const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
    const [lineSpacing, setLineSpacing] = useState(1.5);
    const [greetingText, setGreetingText] = useState("Hello, {secret_santa}!");
    const [introText, setIntroText] = useState("You are the Secret Santa for...");
    const [wishlistLabelText, setWishlistLabelText] = useState("Their Wishlist & Ideas");

    useEffect(() => {
        fetch('/templates.json')
            .then(res => res.json())
            .then(data => {
                setBackgroundOptions(data);
                if (data.length > 0) {
                    setSelectedBackground(data[0].id);
                }
            })
            .catch(err => console.error("Failed to load background templates:", err));
    }, []);

    const handleBulkAdd = (names: string) => {
        const newNames = names.split('\n').map(name => name.trim()).filter(Boolean);
        if (newNames.length > 0) {
            const newParticipants = newNames.map(name => ({ id: crypto.randomUUID(), name, interests: '', likes: '', dislikes: '', links: '', budget: '' }));
            const currentParticipants = participants.filter(p => p.name.trim() !== '');
            setParticipants([...currentParticipants, ...newParticipants, { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
        }
        setShowBulkAddModal(false);
    };

    const handleClear = () => {
        setParticipants([{ id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
        setExclusions([]);
        setAssignments([]);
    };
    
    const handleSubmit = async () => {
        setError(null);
        setIsGenerating(true);
        trackEvent('click_generate_matches');

        const validParticipants = participants.filter(p => p.name.trim() !== '');

        if (validParticipants.length < 3) {
            setError("You need at least 3 participants.");
            setIsGenerating(false);
            return;
        }

        try {
            // Step 1: Generate matches
            const result = generateMatches(validParticipants, exclusions, assignments);
            if (result.error || !result.matches) {
                throw new Error(result.error || "Failed to generate matches.");
            }

            // Step 2: Create wishlist vaults on the backend
            const response = await fetch('/.netlify/functions/create-wishlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participants: validParticipants }),
            });

            if (!response.ok) {
                throw new Error('Could not create wishlists on the server.');
            }
            
            const { wishlistIds } = await response.json();
            
            // Step 3: Add wishlist IDs to participant data
            const participantsWithWishlistIds = validParticipants.map(p => {
                const found = wishlistIds.find((w: any) => w.participantId === p.id);
                return { ...p, wishlistId: found?.wishlistId };
            });

            // Step 4: Encode and redirect
            const exchangeData: ExchangeData = {
                p: participantsWithWishlistIds,
                matches: result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
                exclusions,
                assignments,
                eventDetails,
                exchangeDate: '', 
                exchangeTime: '',
                backgroundOptions,
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

            const encoded = encodeData(exchangeData);
            if (encoded) {
                window.location.hash = `${encoded}?page=success`;
            } else {
                throw new Error("There was an error creating your shareable link.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            trackEvent('generation_error', { error_message: errorMessage });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">The Easiest Free Secret Santa Generator</h1>
                    <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">Instantly draw names for your gift exchange online. No emails, no sign-ups required—just pure holiday fun!</p>
                </div>

                <HowItWorks />
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-6 rounded-md" role="alert">
                        <p className="font-bold">Oops! There was a problem.</p>
                        <p>{error}</p>
                    </div>
                )}
                
                <form onSubmit={e => e.preventDefault()}>
                    <div className="space-y-12">
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                             <h2 className="text-3xl font-bold text-slate-800 font-serif mb-6 text-center">1. Add Participants</h2>
                            <ParticipantManager participants={participants} setParticipants={setParticipants} onBulkAddClick={() => setShowBulkAddModal(true)} onClearClick={handleClear} />
                        </div>
                        
                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                            <h2 className="text-3xl font-bold text-slate-800 font-serif mb-6 text-center">2. Add Details & Rules (Optional)</h2>
                            <Options participants={participants.filter(p => p.name.trim() !== '')} exclusions={exclusions} setExclusions={setExclusions} assignments={assignments} setAssignments={setAssignments} eventDetails={eventDetails} setEventDetails={setEventDetails} trackEvent={trackEvent} />
                        </div>

                        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                            <h2 className="text-3xl font-bold text-slate-800 font-serif mb-6 text-center">3. Customize Your Cards (Optional)</h2>
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
                    <div className="text-center mt-12">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isGenerating || participants.filter(p => p.name.trim() !== '').length < 3}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            {isGenerating ? 'Drawing Names...' : 'Generate Matches!'}
                        </button>
                         {participants.filter(p => p.name.trim() !== '').length < 3 && <p className="text-slate-500 mt-2 text-sm">Please add at least 3 participants.</p>}
                    </div>
                </form>
                
                <WhyChooseUs />
                <VideoTutorial />
                <SocialProof />
                <ResourcesSection />
                <ShareTool />
                <FaqSection />
            </main>
            <Footer />
            {showBulkAddModal && <BulkAddModal onClose={() => setShowBulkAddModal(false)} onConfirm={handleBulkAdd} />}
        </>
    );
};

export default GeneratorPage;
