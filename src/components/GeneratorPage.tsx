import React, { useState, useEffect } from 'react';
import { 
  Participant, Exclusion, Assignment, Match, BackgroundOption, 
  FontSizeSetting, OutlineSizeSetting, FontTheme, ExchangeData 
} from '../types';
import { encodeData } from '../services/urlService';
import Header from './Header';
import HowItWorks from './HowItWorks';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import BackgroundSelector from './BackgroundSelector';
import FaqSection from './FaqSection';
import BlogPromo from './BlogPromo';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';
import BulkAddModal from './BulkAddModal';

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

const defaultParticipants: Participant[] = [
  { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
  { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
  { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
];

const GeneratorPage: React.FC = () => {
  // State for participants and rules
  const [participants, setParticipants] = useState<Participant[]>(() => loadFromStorage<Participant[]>('ssg_participants', defaultParticipants));
  const [exclusions, setExclusions] = useState<Exclusion[]>(() => loadFromStorage<Exclusion[]>('ssg_exclusions', []));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage<Assignment[]>('ssg_assignments', []));
  const [duplicateNameIds, setDuplicateNameIds] = useState<Set<string>>(new Set());
  
  // State for event details and options
  const [eventDetails, setEventDetails] = useState<string>(() => loadFromStorage<string>('ssg_eventDetails', ''));
  const [exchangeDate, setExchangeDate] = useState<string>(() => loadFromStorage<string>('ssg_exchangeDate', ''));
  const [exchangeTime, setExchangeTime] = useState<string>(() => loadFromStorage<string>('ssg_exchangeTime', ''));
  const [globalBudget, setGlobalBudget] = useState<string>(() => loadFromStorage<string>('ssg_globalBudget', ''));
  const [pageTheme, setPageTheme] = useState<string>(() => loadFromStorage<string>('ssg_pageTheme', 'default'));
  
  // State for card styling
  const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
  const [backgroundId, setBackgroundId] = useState<string>('default-christmas');
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [useTextOutline, setUseTextOutline] = useState(true);
  const [outlineColor, setOutlineColor] = useState<string>('#265343');
  const [outlineSize, setOutlineSize] = useState<OutlineSizeSetting>('normal');
  const [fontSizeSetting, setFontSizeSetting] = useState<FontSizeSetting>('normal');
  const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
  const [lineSpacing, setLineSpacing] = useState<number>(1.2);
  const [greetingText, setGreetingText] = useState('Hello, {secret_santa}!');
  const [introText, setIntroText] = useState('You are the Secret Santa for...');
  const [wishlistLabelText, setWishlistLabelText] = useState('Gift Ideas & Notes:');
  
  // UI State
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  
  // --- Local Storage Hooks ---
  useEffect(() => { localStorage.setItem('ssg_participants', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssg_exclusions', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssg_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssg_eventDetails', JSON.stringify(eventDetails)); }, [eventDetails]);
  useEffect(() => { localStorage.setItem('ssg_exchangeDate', JSON.stringify(exchangeDate)); }, [exchangeDate]);
  useEffect(() => { localStorage.setItem('ssg_exchangeTime', JSON.stringify(exchangeTime)); }, [exchangeTime]);
  useEffect(() => { localStorage.setItem('ssg_globalBudget', JSON.stringify(globalBudget)); }, [globalBudget]);
  useEffect(() => { localStorage.setItem('ssg_pageTheme', JSON.stringify(pageTheme)); }, [pageTheme]);

  // Set page theme
  useEffect(() => { document.documentElement.dataset.theme = pageTheme; }, [pageTheme]);
  
  // Fetch background templates
  useEffect(() => {
    fetch('/templates.json')
      .then(res => res.json())
      .then((data: BackgroundOption[]) => {
        setBackgroundOptions(data);
        if (data.length > 0 && !backgroundOptions.some(b => b.id === backgroundId)) {
          setBackgroundId(data[0].id);
        }
      }).catch(err => {
        console.error("Failed to load templates.json", err);
        setError("Could not load card themes. Please try refreshing.");
      });
  }, []);

  // Update text styles when background changes
  useEffect(() => {
    if (!backgroundId || backgroundOptions.length === 0) return;
    const theme = backgroundOptions.find(opt => opt.id === backgroundId);
    if (theme) {
      setTextColor(theme.defaultTextColor);
      if (theme.cardText) {
        setGreetingText(theme.cardText.greeting || 'Hello, {secret_santa}!');
        setIntroText(theme.cardText.intro || 'You are the Secret Santa for...');
        setWishlistLabelText(theme.cardText.wishlistLabel || 'Gift Ideas & Notes:');
      }
    }
  }, [backgroundId, backgroundOptions]);

  // Global budget handler
  const handleGlobalBudgetChange = (budget: string) => {
      setGlobalBudget(budget);
      setParticipants(prev => prev.map(p => ({ ...p, budget })));
  };

  // Duplicate name check
  useEffect(() => {
    const names = new Map<string, string[]>();
    participants.forEach(p => {
      const name = p.name.trim().toLowerCase();
      if (name) {
        if (!names.has(name)) names.set(name, []);
        names.get(name)!.push(p.id);
      }
    });
    const duplicates = new Set<string>();
    for (const ids of names.values()) {
      if (ids.length > 1) {
        ids.forEach(id => duplicates.add(id));
      }
    }
    setDuplicateNameIds(duplicates);
  }, [participants]);

  const handleGenerate = () => {
    setError('');
    const validParticipants = participants.filter(p => p.name.trim() !== '');

    if (validParticipants.length < 2) {
      setError('Please add at least two participants.');
      return;
    }

    if (duplicateNameIds.size > 0) {
        setError('Please ensure all participant names are unique.');
        return;
    }

    if (assignments.length > validParticipants.length) {
        setError('There are more "must match" rules than participants.');
        return;
    }

    if (!greetingText.includes('{secret_santa}')) {
        setError("The Greeting text must include {secret_santa} so the giver's name appears on their card.");
        return;
    }

    setIsGenerating(true);

    let generatedMatches: Match[] | null = null;
    let attempts = 0;
    const maxAttempts = 100;
    
    // --- Matching Logic (adapted from old App.tsx) ---
    while (attempts < maxAttempts && !generatedMatches) {
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
      
      let remainingGivers = validParticipants.filter(p => !assignedGiverIds.has(p.id));
      let remainingReceivers = validParticipants.filter(p => !assignedReceiverIds.has(p.id));
      
      // Shuffle receivers
      for (let i = remainingReceivers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingReceivers[i], remainingReceivers[j]] = [remainingReceivers[j], remainingReceivers[i]];
      }

      const currentMatches: Match[] = [];
      const availableReceivers = new Set<Participant>(remainingReceivers);
      let possible = true;

      for (const giver of remainingGivers) {
        const potentialReceivers = Array.from(availableReceivers).filter(receiver => {
          if (giver.id === receiver.id) return false;
          const isExcluded = exclusions.some(ex =>
            (ex.p1 === giver.id && ex.p2 === receiver.id) || (ex.p2 === giver.id && ex.p1 === receiver.id)
          );
          return !isExcluded;
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
    // --- End Matching Logic ---
    
    if (generatedMatches) {
        const participantIdToIndexMap = new Map<string, number>(validParticipants.map((p, i) => [p.id, i]));
        
        const dataToEncode: ExchangeData = {
            p: validParticipants.map(({ name, notes, budget }) => ({ name, notes, budget })),
            m: generatedMatches.map(match => ({
                g: participantIdToIndexMap.get(match.giver.id)!,
                r: participantIdToIndexMap.get(match.receiver.id)!,
            })),
            style: {
                backgroundId, customBackground, textColor, useTextOutline, outlineColor, outlineSize,
                fontSizeSetting, fontTheme, lineSpacing, greetingText, introText, wishlistLabelText
            },
            e: eventDetails || undefined,
            rd: exchangeDate || undefined,
            rt: exchangeTime || undefined,
            th: pageTheme || undefined,
        };

        try {
            const encodedData = encodeData(dataToEncode);
            window.location.hash = encodedData;
        } catch(e) {
            setError("Failed to generate the shareable link. Please try again.");
        }
    } else {
      setError('Could not find a valid match combination. This can happen with many exclusions or required matches. Please try again or simplify your rules.');
    }
    setIsGenerating(false);
  };
  
  const handleClear = () => setShowClearConfirmation(true);
  
  const confirmClear = () => {
    setParticipants(defaultParticipants);
    setExclusions([]);
    setAssignments([]);
    setError('');
    setEventDetails('');
    setExchangeDate('');
    setExchangeTime('');
    setGlobalBudget('');
    
    ['ssg_participants', 'ssg_exclusions', 'ssg_assignments', 'ssg_eventDetails', 'ssg_exchangeDate', 'ssg_exchangeTime', 'ssg_globalBudget', 'ssg_pageTheme'].forEach(key => localStorage.removeItem(key));
    
    setShowClearConfirmation(false);
    window.scrollTo(0, 0);
  };
  
  const handleBulkAdd = (names: string) => {
    const newParticipants = names.split('\n').map(name => name.trim()).filter(Boolean).map(name => ({
        id: crypto.randomUUID(), name, notes: '', budget: globalBudget
    }));

    if (newParticipants.length > 0) {
        const currentParticipants = participants.filter(p => p.name.trim() !== '');
        setParticipants([...currentParticipants, ...newParticipants]);
    }
    setShowBulkAddModal(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <Header />
        <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
          <HowItWorks />
          
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
              <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">1</span>
              Add Participants <span className="text-[var(--primary-color)] ml-2">*</span>
            </h2>
            <p className="text-gray-600 mb-6 ml-11">Enter the names of everyone participating.</p>
            <ParticipantManager 
              participants={participants} 
              setParticipants={setParticipants}
              onBulkAddClick={() => setShowBulkAddModal(true)}
              duplicateNameIds={duplicateNameIds}
            />
          </div>

          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">2</span>
                Add Details & Rules
            </h2>
            <p className="text-gray-600 mb-6 ml-11">Include event details or prevent people from drawing each other.</p>
            <Options 
              participants={participants.filter(p => p.name.trim() !== '')} 
              exclusions={exclusions} setExclusions={setExclusions} 
              assignments={assignments} setAssignments={setAssignments}
              eventDetails={eventDetails} setEventDetails={setEventDetails} 
              exchangeDate={exchangeDate} setExchangeDate={setExchangeDate}
              exchangeTime={exchangeTime} setExchangeTime={setExchangeTime}
              globalBudget={globalBudget} onGlobalBudgetChange={handleGlobalBudgetChange}
              pageTheme={pageTheme} setPageTheme={setPageTheme}
            />
          </div>
          
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Style the Reveal Card <span className="text-[var(--primary-color)] ml-2">*</span>
            </h2>
             <p className="text-gray-600 mb-6 ml-11">Customize the card each person sees when they click their private link.</p>
             <BackgroundSelector 
                participants={participants} eventDetails={eventDetails} backgroundOptions={backgroundOptions}
                selectedBackground={backgroundId} setSelectedBackground={setBackgroundId}
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
                 <button onClick={handleGenerate} disabled={isGenerating} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
                    {isGenerating ? 'Generating...' : '🎁 Generate Private Links'}
                 </button>
                 <button onClick={handleClear} className="bg-[var(--danger-color)] hover:bg-[var(--danger-color-hover)] text-white font-bold py-2 px-6 rounded-full shadow-md transform hover:scale-105 transition-transform duration-200 ease-in-out">
                    Clear All
                </button>
            </div>
          </div>
        </main>
      </div>

      <FaqSection />
      <BlogPromo />
      
      <Footer theme={pageTheme} setTheme={setPageTheme} />
      
      {showBulkAddModal && <BulkAddModal onClose={() => setShowBulkAddModal(false)} onConfirm={handleBulkAdd} />}

      {showClearConfirmation && (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="mx-auto bg-red-100 rounded-full h-16 w-16 flex items-center justify-center">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 font-serif mt-5 mb-2">Are you sure?</h2>
            <p className="text-gray-600 mb-6">This will permanently clear all participants and rules. This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
                <button onClick={() => setShowClearConfirmation(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">Cancel</button>
                <button onClick={confirmClear} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">Yes, Clear Everything</button>
            </div>
          </div>
        </div>
      )}

      <BackToTopButton />
    </div>
  );
};

export default GeneratorPage;
