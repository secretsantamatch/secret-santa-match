import React, { useState, useEffect, useCallback } from 'react';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import BulkAddModal from './BulkAddModal';
import BackgroundSelector from './BackgroundSelector';
import HowItWorks from './HowItWorks';
import WhyChooseUs from './WhyChooseUs';
import FaqSection from './FaqSection';
import SocialProof from './SocialProof';
import VideoTutorial from './VideoTutorial';
import ShareTool from './ShareTool';
import { generateMatches } from '../services/matchService';
import { serializeExchangeData } from '../services/urlService';
import { trackEvent } from '../services/analyticsService';
import type { Participant, Exclusion, Assignment, BackgroundOption, OutlineSizeSetting, FontSizeSetting, FontTheme } from '../types';
import { Palette, Settings, Check } from 'lucide-react';

const GeneratorPage: React.FC = () => {
    const [participants, setParticipants] = useState<Participant[]>([
        { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' },
    ]);
    const [exclusions, setExclusions] = useState<Exclusion[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [eventDetails, setEventDetails] = useState('');
    const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    
    // Customization state
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    const [selectedBgId, setSelectedBgId] = useState('christmas-lights');
    const [customBackground, setCustomBackground] = useState<string | null>(null);
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [useTextOutline, setUseTextOutline] = useState(true);
    const [outlineColor, setOutlineColor] = useState('#000000');
    const [outlineSize, setOutlineSize] = useState<OutlineSizeSetting>('normal');
    const [fontSizeSetting, setFontSizeSetting] = useState<FontSizeSetting>('normal');
    const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
    const [lineSpacing, setLineSpacing] = useState(1.5);
    const [greetingText, setGreetingText] = useState("Merry Christmas,");
    const [introText, setIntroText] = useState("You are the Secret Santa for...");
    const [wishlistLabelText, setWishlistLabelText] = useState("Their Wishlist:");

    const updateTextsFromTemplate = useCallback((bgId: string, options: BackgroundOption[]) => {
      const option = options.find(opt => opt.id === bgId);
      if (option?.cardText) {
        setGreetingText(option.cardText.greeting);
        setIntroText(option.cardText.intro);
        setWishlistLabelText(option.cardText.wishlistLabel);
      }
    }, []);

    useEffect(() => {
        fetch('/templates.json')
            .then(res => res.json())
            .then(data => {
                setBackgroundOptions(data);
                const defaultOption = data.find((opt: BackgroundOption) => opt.id === selectedBgId) || data[0];
                if (defaultOption) {
                    setTextColor(defaultOption.defaultTextColor || '#FFFFFF');
                    updateTextsFromTemplate(selectedBgId, data);
                }
            })
            .catch(err => console.error("Failed to load background templates:", err));

        // Listen for participants from Chrome extension
        const handleExtensionParticipants = (event: Event) => {
            const customEvent = event as CustomEvent;
            const injectedParticipants = customEvent.detail;
            if (Array.isArray(injectedParticipants)) {
                const newParticipants: Participant[] = injectedParticipants.map(p => ({
                    id: p.id || crypto.randomUUID(),
                    name: p.name || '',
                    interests: p.notes || '',
                    likes: '', dislikes: '', links: '', budget: p.budget || ''
                }));
                const finalParticipants = newParticipants.filter(p => p.name.trim() !== '');
                finalParticipants.push({ id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' });
                setParticipants(finalParticipants);
                trackEvent('extension_import', { count: injectedParticipants.length });
            }
        };
        window.addEventListener('ssm-participants-ready', handleExtensionParticipants);
        return () => window.removeEventListener('ssm-participants-ready', handleExtensionParticipants);
    }, []);

    useEffect(() => {
      if (backgroundOptions.length > 0) {
        updateTextsFromTemplate(selectedBgId, backgroundOptions);
      }
    }, [selectedBgId, backgroundOptions, updateTextsFromTemplate]);

    const handleBulkAdd = (names: string) => {
        const nameList = names.split('\n').map(name => name.trim()).filter(Boolean);
        const newParticipants = nameList.map(name => ({
            id: crypto.randomUUID(), name, interests: '', likes: '', dislikes: '', links: '', budget: ''
        }));
        
        const existingNames = new Set(participants.filter(p => p.name).map(p => p.name.toLowerCase()));
        const uniqueNew = newParticipants.filter(p => !existingNames.has(p.name.toLowerCase()));
        
        const currentParticipants = participants.filter(p => p.name.trim() !== '');
        setParticipants([...currentParticipants, ...uniqueNew, { id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
        setIsBulkAddModalOpen(false);
        trackEvent('bulk_add', { count: uniqueNew.length });
    };

    const handleClear = () => {
        setParticipants([{ id: crypto.randomUUID(), name: '', interests: '', likes: '', dislikes: '', links: '', budget: '' }]);
        setExclusions([]);
        setAssignments([]);
        setError(null);
        trackEvent('clear_list');
    };
    
    const handleNextStep = () => {
        const finalParticipants = participants.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);
        if (finalParticipants.length < 2) {
            setError("You need at least two participants to start a gift exchange.");
            window.scrollTo(0, 0);
            return;
        }
        setError(null);
        setStep(step + 1);
        window.scrollTo(0, 0);
    };

    const handleGenerate = () => {
        const finalParticipants = participants.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);
        if (finalParticipants.length < 2) {
            setError("You need at least two participants to start a gift exchange.");
            return;
        }

        const result = generateMatches(finalParticipants, exclusions, assignments);
        if (result.matches) {
            setError(null);
            const dataToSerialize = {
                p: finalParticipants,
                matches: result.matches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
                eventDetails,
                bgId: selectedBgId,
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
            const hash = serializeExchangeData(dataToSerialize);
            window.location.hash = hash;
            trackEvent('generate_success', { participants: finalParticipants.length, exclusions: exclusions.length, assignments: assignments.length });
        } else {
            setError(result.error);
            trackEvent('generate_fail', { error: result.error });
        }
    };
    
    const renderStepContent = () => {
        const validParticipants = participants.filter(p => p.name.trim());
        switch (step) {
            case 1:
                return (
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Step 1: Add Participant Names</h3>
                        <ParticipantManager
                            participants={participants}
                            setParticipants={setParticipants}
                            onBulkAddClick={() => setIsBulkAddModalOpen(true)}
                            onClearClick={handleClear}
                        />
                        <div className="mt-8 text-center">
                            <button onClick={handleNextStep} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                                Next: Add Details & Rules &rarr;
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Step 2: Add Details & Rules</h3>
                        <Options
                            participants={validParticipants}
                            exclusions={exclusions}
                            setExclusions={setExclusions}
                            assignments={assignments}
                            setAssignments={setAssignments}
                            eventDetails={eventDetails}
                            setEventDetails={setEventDetails}
                            trackEvent={trackEvent}
                        />
                         <div className="mt-8 flex justify-between items-center">
                            <button onClick={() => setStep(1)} className="text-slate-600 hover:text-slate-800 font-semibold">&larr; Back to Names</button>
                            <button onClick={handleNextStep} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                                Next: Customize Cards &rarr;
                            </button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Step 3: Customize Your Cards (Optional)</h3>
                        <BackgroundSelector
                            selectedBackgroundId={selectedBgId}
                            setSelectedBackgroundId={setSelectedBgId}
                            customBackground={customBackground}
                            setCustomBackground={setCustomBackground}
                            backgroundOptions={backgroundOptions}
                            onTextColorChange={setTextColor}
                        />
                        <div className="mt-8 flex justify-between items-center">
                            <button onClick={() => setStep(2)} className="text-slate-600 hover:text-slate-800 font-semibold">&larr; Back to Rules</button>
                            <button onClick={handleGenerate} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                                Generate Matches!
                            </button>
                        </div>
                    </div>
                )
            default: return null;
        }
    }

    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif mb-3">Secret Santa Generator</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">The fast, free, and private way to draw names for your gift exchange. No emails or sign-ups required.</p>
            </div>

            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert"><p>{error}</p></div>}
                {renderStepContent()}
            </div>

            <HowItWorks />
            <WhyChooseUs />
            <SocialProof />
            <VideoTutorial />
            <FaqSection />
            <ShareTool />

            {isBulkAddModalOpen && (
                <BulkAddModal
                    onClose={() => setIsBulkAddModalOpen(false)}
                    onConfirm={handleBulkAdd}
                />
            )}
        </div>
    );
};

export default GeneratorPage;
