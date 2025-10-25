import React, { useState, useEffect, useRef } from 'react';
import type { Participant, Exclusion, Match, BackgroundOption, Assignment, FontSizeSetting, OutlineSizeSetting, FontTheme, ExchangeData } from '../types';
import Header from './Header';
import HowItWorks from './HowItWorks';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import Footer from './Footer';
import BackgroundSelector from './BackgroundSelector';
import { encodeData } from '../services/urlService';
import FaqSection from './FaqSection';
import ResourcesSection from './ResourcesSection';
import BackToTopButton from './BackToTopButton';
import BulkAddModal from './BulkAddModal';
import { driver } from "driver.js";
import { HelpCircle } from 'lucide-react';
import FeaturedResources from './FeaturedResources';

// Allow TypeScript to recognize the gtag function on the window object
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Helper function to send events to Google Analytics
const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  } else {
    console.log(`Analytics Event (gtag not found): ${eventName}`, eventParams);
  }
};


// This function determines the seasonal theme. It's now managed in App.tsx
// but we need it here to pass to the ExchangeData
const getSeasonalTheme = (): string => {
    const month = new Date().getMonth();
    if (month === 9) return 'halloween';
    if (month === 1) return 'valentines';
    if (month === 10 || month === 11) return 'christmas';
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

const defaultParticipants = [
    { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
    { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
    { id: crypto.randomUUID(), name: '', notes: '', budget: '' },
];

const GeneratorPage: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>(() => loadFromStorage<Participant[]>('ssm_participants', defaultParticipants));
  const [exclusions, setExclusions] = useState<Exclusion[]>(() => loadFromStorage<Exclusion[]>('ssm_exclusions', []));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage<Assignment[]>('ssm_assignments', []));
  const [error, setError] = useState<string>('');
  const [eventDetails, setEventDetails] = useState<string>(() => loadFromStorage<string>('ssm_eventDetails', ''));
  
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
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  
  useEffect(() => { localStorage.setItem('ssm_participants', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssm_exclusions', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssm_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssm_eventDetails', eventDetails); }, [eventDetails]);

  useEffect(() => {
    fetch('/templates.json')
      .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
      .then((data: BackgroundOption[]) => {
        setBackgroundOptions(data);
        setBackground(data.length > 1 ? data[1].id : (data.length > 0 ? data[0].id : ''));
      })
      .catch(error => {
        console.error('Failed to load theme templates:', error);
        setError('Could not load card themes. Please try refreshing the page.');
      });
  }, []);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    if (background) {
        trackEvent('select_theme', { theme_id: background });
    }
  }, [background]);

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

  // Onboarding Tour Logic
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        { element: '#step-1-participants', popover: { title: 'Step 1: Add Your Group', description: "Start by adding everyone's name. Click 'Details' for wishlists and budgets, or use 'Bulk Add' to paste a list!" } },
        { element: '#step-2-rules', popover: { title: 'Step 2: Set the Rules', description: 'Add party details and set \'Exclusions\' to prevent people (like couples) from drawing each other. You can also force specific matches with \'Assignments\'.' } },
        { element: '#step-3-styling', popover: { title: 'Step 3: Get Creative!', description: 'Style the printable cards! Choose a festive theme, upload your own background, and customize the text. See a live preview on the right.' } },
        { element: '#generate-button', popover: { title: 'Step 4: Generate!', description: "When you're ready, click here to magically draw the names. Good luck!" } }
      ],
      onCloseClick: () => {
        localStorage.setItem('ssm_hasSeenTour', 'true');
        driverObj.destroy();
      },
    });
    driverObj.drive();
  }

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('ssm_hasSeenTour');
    if (!hasSeenTour) {
        const tourTimeout = setTimeout(() => {
            startTour();
        }, 1500);
        return () => clearTimeout(tourTimeout);
    }
  }, []);


  const handleGenerateMatches = () => {
    setError('');
    const validParticipants = participants.filter(p => p.name.trim() !== '');
    const duplicateNames = validParticipants
      .map(p => p.name.trim().toLowerCase())
      .filter((name, index, self) => self.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      setError(`Duplicate names found: ${[...new Set(duplicateNames)].join(', ')}. Please ensure all names are unique.`);
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
    const maxAttempts = 100;

    while (attempts < maxAttempts && !generatedMatches) {
      attempts++;
      // FIX: Explicitly type the Map. This helps TypeScript correctly infer the types
      // of 'giver' and 'receiver' later, preventing the 'property id does not exist on type unknown' error.
      const participantMap: Map<string, Participant> = new Map(validParticipants.map(p => [p.id, p]));
      const assignedMatches: Match[] = [];
      const assignedGiverIds = new Set<string>();
      const assignedReceiverIds = new Set<string>();

      // FIX: Cast `assignments` to `Assignment[]` to prevent type inference issues.
      for(const assignment of (assignments as Assignment[])) {
          const giver = participantMap.get(assignment.giverId);
          const receiver = participantMap.get(assignment.receiverId);
          if (giver && receiver) {
              // FIX: Ensure giver and receiver conform to Participant type for the Match
              assignedMatches.push({ giver: giver as Participant, receiver: receiver as Participant });
              assignedGiverIds.add(giver.id);
              assignedReceiverIds.add(receiver.id);
          }
      }
      
      const remainingGivers = validParticipants.filter(p => !assignedGiverIds.has(p.id));
      let remainingReceivers = validParticipants.filter(p => !assignedReceiverIds.has(p.id));
      
      for (let i = remainingReceivers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingReceivers[i], remainingReceivers[j]] = [remainingReceivers[j], remainingReceivers[i]];
      }

      const currentMatches: Match[] = [];
      const availableReceivers = new Set(remainingReceivers);
      let possible = true;

      // FIX: Cast `remainingGivers` to `Participant[]` to ensure `giver` is correctly typed.
      for (const giver of (remainingGivers as Participant[])) {
        // FIX: Cast Array.from result to Participant[] to fix type inference issues.
        const potentialReceivers = (Array.from(availableReceivers) as Participant[]).filter(receiver => {
          if (giver.id === receiver.id) return false;
          return !exclusions.some(ex => (ex.p1 === giver.id && ex.p2 === receiver.id) || (ex.p2 === giver.id && ex.p1 === receiver.id));
        });

        if (potentialReceivers.length > 0) {
          const receiver = potentialReceivers[Math.floor(Math.random() * potentialReceivers.length)];
          // FIX: Explicitly cast to ensure type correctness when pushing to `currentMatches`.
          currentMatches.push({ giver: giver as Participant, receiver: receiver as Participant });
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
        trackEvent('generate_matches', {
            participant_count: validParticipants.length,
            exclusion_count: exclusions.length,
            assignment_count: assignments.length
        });

        const exchangeData: ExchangeData = {
            p: validParticipants,
            matches: generatedMatches.map(m => ({ g: m.giver.id, r: m.receiver.id })),
            eventDetails,
            bgId: background,
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
            pageTheme: getSeasonalTheme(),
        };
        const encodedData = encodeData(exchangeData);
        window.location.hash = encodedData;
    } else {
      setError('Could not find a valid match combination. Please try again or simplify your rules.');
    }
    setIsGenerating(false);
  };
  
  const handleClearParticipants = () => {
      setParticipants(defaultParticipants);
  };

  const handleBulkAdd = (names: string) => {
      const newParticipants = names
          .split('\n')
          .map(name => name.trim())
          .filter(name => name.length > 0)
          .map(name => ({
              id: crypto.randomUUID(),
              name: name,
              notes: '',
              budget: ''
          }));

      if (newParticipants.length > 0) {
          const currentParticipants = participants.filter(p => p.name.trim() !== '' || p.notes.trim() !== '' || p.budget.trim() !== '');
          setParticipants([...currentParticipants, ...newParticipants]);
      }
      setShowBulkAddModal(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <Header />
        <HowItWorks />
        <FeaturedResources />
        <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
          
          <div id="step-1-participants" className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
              <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">1</span>
              Add Participants <span className="text-[var(--primary-color)] ml-2">*</span>
              <button onClick={startTour} className="ml-3 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Show help tour">
                <HelpCircle size={20} />
              </button>
            </h2>
            <p className="text-gray-600 mb-6 ml-11">Enter each person's name. Click 'Details' to add gift ideas and a spending budget.</p>
            <ParticipantManager 
              participants={participants} 
              setParticipants={setParticipants}
              onBulkAddClick={() => setShowBulkAddModal(true)}
              onClearClick={handleClearParticipants}
            />
          </div>

          <div id="step-2-rules" className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">2</span>
                Add Details & Rules
            </h2>
            <p className="text-gray-600 mb-6 ml-11">Include event details or prevent people from drawing each other.</p>
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
          
          <div id="step-3-styling" className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Style Your Cards <span className="text-[var(--primary-color)] ml-2">*</span>
            </h2>
             <BackgroundSelector 
                participants={participants}
                eventDetails={eventDetails}
                backgroundOptions={backgroundOptions}
                selectedBackground={background}
                setSelectedBackground={setBackground}
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

          <div className="text-center pt-4">
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
            
            <button id="generate-button" onClick={handleGenerateMatches} disabled={isGenerating} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
              {isGenerating ? 'Generating...' : '🎁 Generate Matches'}
            </button>
          </div>

        </main>
      </div>

      <FaqSection />
      <ResourcesSection />
      
      <Footer />
      
      {showBulkAddModal && <BulkAddModal onClose={() => setShowBulkAddModal(false)} onConfirm={handleBulkAdd} />}

      <BackToTopButton />
    </div>
  );
}

export default GeneratorPage;
