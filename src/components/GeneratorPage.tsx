import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Participant, Exclusion, Match, BackgroundOption, Assignment, FontSizeSetting, OutlineSizeSetting, FontTheme, ExchangeData } from '../types';
import Header from './Header';
import HowItWorks from './HowItWorks';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import Footer from './Footer';
import BackgroundSelector from './BackgroundSelector';
import BlogPromo from './BlogPromo';
import FaqSection from './FaqSection';
import BackToTopButton from './BackToTopButton';
import BulkAddModal from './BulkAddModal';

const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;

const getSeasonalTheme = (): string => {
    const month = new Date().getMonth();
    if (month === 9) return 'halloween';
    if (month === 1) return 'valentines';
    if (month >= 10 || month <= 0) return 'christmas';
    return 'default';
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (key === 'ssm_participants' && Array.isArray(parsed) && parsed.length === 0) {
        return defaultValue;
      }
      return parsed;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

const defaultParticipants: Participant[] = [
    { id: crypto.randomUUID(), name: '', email: '', notes: '', budget: '' },
    { id: crypto.randomUUID(), name: '', email: '', notes: '', budget: '' },
    { id: crypto.randomUUID(), name: '', email: '', notes: '', budget: '' },
];

interface GeneratorPageProps {
    onGenerate: (data: ExchangeData) => void;
    error: string;
}

const GeneratorPage: React.FC<GeneratorPageProps> = ({ onGenerate, error: initialError }) => {
  const [participants, setParticipants] = useState<Participant[]>(() => loadFromStorage<Participant[]>('ssm_participants', defaultParticipants));
  const [exclusions, setExclusions] = useState<Exclusion[]>(() => loadFromStorage<Exclusion[]>('ssm_exclusions', []));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage<Assignment[]>('ssm_assignments', []));
  const [error, setError] = useState<string>(initialError);
  const [eventDetails, setEventDetails] = useState<string>(() => loadFromStorage<string>('ssm_eventDetails', ''));
  const [exchangeDate, setExchangeDate] = useState<string>(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  });
  
  const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
  const [background, setBackground] = useState<string>('');
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string>('#265343');
  const [useTextOutline, setUseTextOutline] = useState(false);
  const [outlineColor, setOutlineColor] = useState<string>('#FFFFFF');
  const [outlineSize, setOutlineSize] = useState<OutlineSizeSetting>('normal');
  const [fontSizeSetting, setFontSizeSetting] = useState<FontSizeSetting>('normal');
  const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
  const [lineSpacing, setLineSpacing] = useState<number>(1.0);
  const [greetingText, setGreetingText] = useState('Hello, {secret_santa}!');
  const [introText, setIntroText] = useState('You are the Secret Santa for...');
  const [wishlistLabelText, setWishlistLabelText] = useState('Gift Ideas & Notes:');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [theme, setTheme] = useState(getSeasonalTheme());

  const participantRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  const duplicateNameIds = useMemo(() => {
    const nameCounts = new Map<string, string[]>();
    participants.forEach(p => {
        const trimmedName = p.name.trim().toLowerCase();
        if (trimmedName) {
            if (!nameCounts.has(trimmedName)) {
                nameCounts.set(trimmedName, []);
            }
            nameCounts.get(trimmedName)!.push(p.id);
        }
    });

    const duplicates = new Set<string>();
    for (const ids of nameCounts.values()) {
        if (ids.length > 1) {
            ids.forEach(id => duplicates.add(id));
        }
    }
    return duplicates;
  }, [participants]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  
  useEffect(() => { localStorage.setItem('ssm_participants', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssm_exclusions', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssm_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssm_eventDetails', eventDetails); }, [eventDetails]);


  useEffect(() => {
    fetch('/templates.json')
      .then(response => response.json())
      .then((data: BackgroundOption[]) => {
        setBackgroundOptions(data);
        if (data.length > 1) setBackground(data[1].id);
        else if (data.length > 0) setBackground(data[0].id);
      })
      .catch(error => console.error('Failed to load theme templates:', error));
  }, []);

  useEffect(() => {
    if (backgroundOptions.length === 0 || !background) return;
    const selectedTheme = backgroundOptions.find(opt => opt.id === background);
    if (selectedTheme) {
        setTextColor(selectedTheme.defaultTextColor);
        if (selectedTheme.cardText) {
            setGreetingText(selectedTheme.cardText.greeting || 'Hello, {secret_santa}!');
            setIntroText(selectedTheme.cardText.intro || 'You are the Secret Santa for...');
            setWishlistLabelText(selectedTheme.cardText.wishlistLabel || 'Gift Ideas & Notes:');
        }
    }
  }, [background, backgroundOptions]);

  const handleHowItWorksClick = (step: number) => {
    let targetRef: React.RefObject<HTMLDivElement> | null = null;
    if (step === 1) targetRef = participantRef;
    if (step === 2) {
      targetRef = rulesRef;
      setIsRulesExpanded(true);
    }
    if (step === 3) targetRef = cardsRef;

    if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetRef.current.classList.add('highlight-section');
        setTimeout(() => {
            targetRef?.current?.classList.remove('highlight-section');
        }, 1200);
    }
  };

  const handleGenerateMatches = () => {
    setError('');
    const validParticipants = participants.filter(p => p.name.trim() !== '');

    if (duplicateNameIds.size > 0) {
      setError(`Duplicate names found. Please ensure all names are unique.`);
      return;
    }

    if (validParticipants.length < 2) {
      setError('Please add at least two participants with names.');
      return;
    }
    
    if (assignments.length > validParticipants.length) {
        setError('There are more "must match" rules than participants.');
        return;
    }

    setIsGenerating(true);
    let generatedMatches: Match[] | null = null;
    let attempts = 0;
    while (attempts < 100 && !generatedMatches) {
      attempts++;
      const participantMap = new Map<string, Participant>(validParticipants.map(p => [p.id, p]));
      const assignedMatches: Match[] = [];
      const assignedGiverIds = new Set<string>();
      const assignedReceiverIds = new Set<string>();

      for(const assignment of assignments) {
          const giver = participantMap.get(assignment.giverId);
          const receiver = participantMap.get(assignment.receiverId);
          if (giver && receiver) {
              assignedMatches.push({ giver, receiver });
              assignedGiverIds.add(giver.id);
              assignedReceiverIds.add(receiver.id);
          }
      }
      
      const remainingGivers = validParticipants.filter(p => !assignedGiverIds.has(p.id));
      let remainingReceivers = validParticipants.filter(p => !assignedReceiverIds.has(p.id));
      remainingReceivers = remainingReceivers.sort(() => Math.random() - 0.5);

      const currentMatches: Match[] = [];
      const availableReceivers = new Set<Participant>(remainingReceivers);
      let possible = true;

      for (const giver of remainingGivers) {
        const potentialReceivers = Array.from(availableReceivers).filter(receiver => {
          if (giver.id === receiver.id) return false;
          return !exclusions.some(ex => (ex.p1 === giver.id && ex.p2 === receiver.id) || (ex.p2 === giver.id && ex.p1 === receiver.id));
        });

        if (potentialReceivers.length > 0) {
          const receiver = potentialReceivers[Math.floor(Math.random() * potentialReceivers.length)];
          currentMatches.push({ giver, receiver });
          availableReceivers.delete(receiver);
        } else {
          possible = false;
          break;
        }
      }
      if (possible && currentMatches.length === remainingGivers.length) {
        generatedMatches = [...assignedMatches, ...currentMatches];
      }
    }

    if (generatedMatches) {
        const participantIdMap = new Map(validParticipants.map((p, i) => [p.id, i]));
        const exchangeData: ExchangeData = {
            p: validParticipants.map(({ id, ...rest }) => rest),
            m: generatedMatches.map(m => ({
                g: participantIdMap.get(m.giver.id)!,
                r: participantIdMap.get(m.receiver.id)!,
            })),
            e: eventDetails,
            d: new Date(exchangeDate).toISOString(),
            // Pass PDF styling options through the data object
            pdf: {
                bgId: background,
                bgCustom: customBackground,
                textColor: textColor,
                useOutline: useTextOutline,
                outlineColor: outlineColor,
                outlineSize: outlineSize,
                font: fontTheme,
                fontSize: fontSizeSetting,
                lineSpacing: lineSpacing,
                greeting: greetingText,
                intro: introText,
                wishlist: wishlistLabelText,
            }
        };

        onGenerate(exchangeData);
    } else {
      setError('Could not find a valid match combination. Please try again or simplify your rules.');
    }
    setIsGenerating(false);
  };
  
  const confirmClear = () => {
    setParticipants(defaultParticipants);
    setExclusions([]);
    setAssignments([]);
    setError('');
    setEventDetails('');
    localStorage.clear();
    setShowClearConfirmation(false);
    // Go to the home page by removing the hash
    if (window.location.hash) {
        window.location.hash = '';
    }
    window.scrollTo(0, 0);
  };
  
    const handleBulkAdd = (names: string) => {
        const newParticipants = names.split('\n').map(name => name.trim()).filter(Boolean).map(name => ({
            id: crypto.randomUUID(), name, email: '', notes: '', budget: ''
        }));
        if (newParticipants.length > 0) {
            const currentParticipants = participants.filter(p => p.name.trim() !== '');
            setParticipants([...currentParticipants, ...newParticipants]);
        }
        setShowBulkAddModal(false);
    };

  return (
    <>
      <Header />
      <HowItWorks onStepClick={handleHowItWorksClick} />
      <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
        
        <div ref={participantRef} className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 flex items-center">
            <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">1</span>
            Add Participants <span className="text-[var(--primary-color)] ml-2">*</span>
          </h2>
          <ParticipantManager 
            participants={participants} 
            setParticipants={setParticipants}
            onBulkAddClick={() => setShowBulkAddModal(true)}
            duplicateNameIds={duplicateNameIds}
          />
        </div>

        <div ref={rulesRef}>
          <Options 
            participants={participants.filter(p => p.name.trim() !== '')} 
            exclusions={exclusions} 
            setExclusions={setExclusions} 
            assignments={assignments}
            setAssignments={setAssignments}
            eventDetails={eventDetails} 
            setEventDetails={setEventDetails} 
            exchangeDate={exchangeDate}
            setExchangeDate={setExchangeDate}
            isExpanded={isRulesExpanded}
            setIsExpanded={setIsRulesExpanded}
          />
        </div>
        
        <div ref={cardsRef} className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
           <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 flex items-center">
              <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
              Style Your Cards (Optional)
          </h2>
           <p className="text-gray-600 mb-6 ml-11">Choose a theme for the printable PDF gift tags.</p>
           <BackgroundSelector 
              participants={participants} eventDetails={eventDetails} backgroundOptions={backgroundOptions}
              selectedBackground={background} setSelectedBackground={setBackground}
              customBackground={customBackground} setCustomBackground={setCustomBackground}
              textColor={textColor} setTextColor={setTextColor}
              useTextOutline={useTextOutline} setUseTextOutline={setUseTextOutline}
              outlineColor={outlineColor} setOutlineColor={setOutlineColor}
              outlineSize={outlineSize} setOutlineSize={setOutlineSize}
              fontSizeSetting={fontSizeSetting} setFontSizeSetting={setFontSizeSetting}
              fontTheme={fontTheme} setFontTheme={setFontTheme}
              lineSpacing={lineSpacing} setLineSpacing={setLineSpacing}
              greetingText={greetingText} setGreetingText={setGreetingText}
              introText={introText} setIntroText={setIntroText}
              wishlistLabelText={wishlistLabelText} setWishlistLabelText={setWishlistLabelText}
           />
        </div>

        <div className="text-center pt-4">
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleGenerateMatches} disabled={isGenerating} className="flex-1 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
                {isGenerating ? 'Generating...' : '🎁 Generate Matches'}
              </button>
               <button onClick={() => setShowClearConfirmation(true)} className="flex items-center justify-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-full shadow-sm transition-colors text-base">
                    <ClearIcon />
                    Clear All
                </button>
          </div>
        </div>
      </main>
      <FaqSection />
      <BlogPromo />
      <Footer theme={theme} setTheme={setTheme} />
      {showBulkAddModal && <BulkAddModal onClose={() => setShowBulkAddModal(false)} onConfirm={handleBulkAdd} />}
      {showClearConfirmation && (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="mx-auto bg-red-100 rounded-full h-16 w-16 flex items-center justify-center">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 font-serif mt-5 mb-2">Are you sure?</h2>
            <p className="text-gray-600 mb-6">This will permanently clear all participants, rules, and matches. This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
                <button onClick={() => setShowClearConfirmation(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">Cancel</button>
                <button onClick={confirmClear} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">Yes, Clear Everything</button>
            </div>
          </div>
        </div>
      )}
      <BackToTopButton />
    </>
  );
}

export default GeneratorPage;
