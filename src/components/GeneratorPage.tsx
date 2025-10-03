import React, { useState, useRef, useEffect } from 'react';
// Fix: Corrected import paths for types and components.
import type { Participant, Exclusion, Match, BackgroundOption, Assignment, FontSizeSetting, OutlineSizeSetting, FontTheme, ExchangeData, CardStyle, MatchById } from '../types';
import Header from './Header';
import HowItWorks from './HowItWorks';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import BackgroundSelector from './BackgroundSelector';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';
import BulkAddModal from './BulkAddModal';
import FaqSection from './FaqSection';
import BlogPromo from './BlogPromo';
import { encodeData } from '../services/urlService';

// Fix: Defined missing ClearIcon component.
const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;

const getSeasonalTheme = (): string => {
    const month = new Date().getMonth(); // 0 = Jan, 1 = Feb, etc.
    if (month === 9) return 'halloween'; // October
    if (month === 1) return 'valentines'; // February
    if (month === 10 || month === 11) return 'christmas'; // Nov, Dec
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


function GeneratorPage() {
  const [participants, setParticipants] = useState<Participant[]>(() => loadFromStorage<Participant[]>('ssm_participants', defaultParticipants));
  const [exclusions, setExclusions] = useState<Exclusion[]>(() => loadFromStorage<Exclusion[]>('ssm_exclusions', []));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage<Assignment[]>('ssm_assignments', []));
  const [error, setError] = useState<string>('');
  const [eventDetails, setEventDetails] = useState<string>(() => loadFromStorage<string>('ssm_eventDetails', ''));
  const [globalBudget, setGlobalBudget] = useState<string>(() => loadFromStorage<string>('ssm_globalBudget', ''));
  const [revealAtDate, setRevealAtDate] = useState<string>('');
  const [revealAtTime, setRevealAtTime] = useState<string>('');
  const [pageTheme, setPageTheme] = useState<string>('default');
  
  const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
  const [background, setBackground] = useState<string>('');
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string>('#265343');
  const [useTextOutline, setUseTextOutline] = useState(true);
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
  const [duplicateNameIds, setDuplicateNameIds] = useState<Set<string>>(new Set());
  const [rulesSectionOpen, setRulesSectionOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  
  // --- Local Storage Hooks ---
  useEffect(() => { localStorage.setItem('ssm_participants', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssm_exclusions', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssm_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssm_eventDetails', eventDetails); }, [eventDetails]);
  useEffect(() => { localStorage.setItem('ssm_globalBudget', globalBudget); }, [globalBudget]);

  const handleGlobalBudgetChange = (budget: string) => {
    setGlobalBudget(budget);
    if (budget.trim() !== '') {
        setParticipants(prev => prev.map(p => ({...p, budget: budget})))
    }
  }


  useEffect(() => {
    fetch('/templates.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data: BackgroundOption[]) => {
        setBackgroundOptions(data);
        if (data.length > 1) {
          setBackground(data[1].id);
        } else if (data.length > 0) {
          setBackground(data[0].id);
        }
      })
      .catch(error => {
        console.error('Failed to load theme templates:', error);
        setError('Could not load card themes. Please try refreshing the page.');
      });
  }, []);

  useEffect(() => {
    if (backgroundOptions.length === 0 || !background) return;
    const selectedTheme = backgroundOptions.find(opt => opt.id === background);
    if (selectedTheme) {
        setTextColor(selectedTheme.defaultTextColor);
        // Fix: Set a contrasting outline color to prevent blurry text
        setOutlineColor('#FFFFFF'); 
        if (selectedTheme.cardText) {
            setGreetingText(selectedTheme.cardText.greeting || 'Hello, {secret_santa}!');
            setIntroText(selectedTheme.cardText.intro || 'You are the Secret Santa for...');
            setWishlistLabelText(selectedTheme.cardText.wishlistLabel || 'Gift Ideas & Notes:');
        }
    }
  }, [background, backgroundOptions]);

  const validateAndGetParticipants = (): Participant[] | null => {
    setError('');
    setDuplicateNameIds(new Set());
    const validParticipants = participants
      .map(p => ({...p, name: p.name.trim()}))
      .filter(p => p.name !== '');
      
    if (validParticipants.length < 2) {
      setError('Please add at least two participants with names.');
      return null;
    }

    const nameCounts = new Map<string, string[]>();
    validParticipants.forEach(p => {
        const lowerName = p.name.toLowerCase();
        if (!nameCounts.has(lowerName)) {
            nameCounts.set(lowerName, []);
        }
        nameCounts.get(lowerName)!.push(p.id);
    });

    const duplicates = new Set<string>();
    for (const [name, ids] of nameCounts.entries()) {
        if (ids.length > 1) {
            ids.forEach(id => duplicates.add(id));
        }
    }

    if (duplicates.size > 0) {
        setError("Duplicate names found. Please ensure all names are unique.");
        setDuplicateNameIds(duplicates);
        return null;
    }
    
    if (assignments.length > validParticipants.length) {
        setError('There are more "must match" rules than participants.');
        return null;
    }
    return validParticipants;
  }

  const handleGenerateMatches = () => {
    const validParticipants = validateAndGetParticipants();
    if (!validParticipants) return;

    if (!greetingText.includes('{secret_santa}')) {
      setError("The Greeting text must include {secret_santa} so the giver's name appears. Please add it back.");
      return;
    }

    setIsGenerating(true);

    let generatedMatches: Match[] | null = null;
    let attempts = 0;
    const maxAttempts = 100;

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
      
      const remainingGivers = validParticipants.filter(p => !assignedGiverIds.has(p.id));
      const remainingReceivers = validParticipants.filter(p => !assignedReceiverIds.has(p.id));
      
      let shuffledReceivers = [...remainingReceivers];
      for (let i = shuffledReceivers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledReceivers[i], shuffledReceivers[j]] = [shuffledReceivers[j], shuffledReceivers[i]];
      }

      const currentMatches: Match[] = [];
      let possible = true;

      for (const giver of remainingGivers) {
        let foundReceiver = false;
        for (let i = 0; i < shuffledReceivers.length; i++) {
          const receiver = shuffledReceivers[i];
          if (giver.id === receiver.id) continue;
          
          const isExcluded = exclusions.some(ex =>
            (ex.p1 === giver.id && ex.p2 === receiver.id) ||
            (ex.p2 === giver.id && ex.p1 === receiver.id)
          );

          if (!isExcluded) {
            currentMatches.push({ giver, receiver });
            shuffledReceivers.splice(i, 1);
            foundReceiver = true;
            break;
          }
        }
        if (!foundReceiver) {
          possible = false;
          break;
        }
      }
      
      if (possible) {
        generatedMatches = [...assignedMatches, ...currentMatches];
      }
    }

    if (generatedMatches) {
      setError('');
      
      // Fix: Corrected property names for CardStyle to match type definition.
      const style: CardStyle = {
        bgId: background,
        customBg: customBackground,
        textColor: textColor,
        useOutline: useTextOutline,
        outlineColor: outlineColor,
        outlineSize: outlineSize,
        fontSetting: fontSizeSetting,
        fontTheme: fontTheme,
        lineSpacing: lineSpacing,
        greeting: greetingText,
        intro: introText,
        wishlistLabel: wishlistLabelText,
      };

      let revealTimestamp: number | undefined;
      if (revealAtDate) {
        // Combine date and time, defaulting to midnight UTC if time is missing
        const dateTimeString = `${revealAtDate}T${revealAtTime || '00:00'}:00Z`;
        const revealDate = new Date(dateTimeString);
        // Check if the date is valid before setting the timestamp
        if (!isNaN(revealDate.getTime())) {
          revealTimestamp = revealDate.getTime();
        }
      }

      // Fix: Corrected data structure for ExchangeData to match type definitions.
      // Kept participant IDs for URL sharing and used string IDs for matches.
      const exchangeData: ExchangeData = {
        p: validParticipants,
        m: generatedMatches.map(m => ({
          g: m.giver.id,
          r: m.receiver.id,
        })),
        details: eventDetails,
        style: style,
        revealAt: revealTimestamp,
      };
      
      try {
        const encodedData = encodeData(exchangeData);
        window.location.hash = encodedData;
        
      } catch (e) {
        console.error("Encoding error:", e);
        setError("Could not generate the shareable links. Please try again.");
      }
    } else {
      setError('Could not find a valid match combination. This can happen with many exclusions or just by chance. Please try again or simplify your rules.');
    }
    setIsGenerating(false);
  };
  
  const handleClear = () => {
      setShowClearConfirmation(true);
  };
  
  const confirmClear = () => {
    setParticipants(defaultParticipants);
    setExclusions([]);
    setAssignments([]);
    setError('');
    setEventDetails('');
    setGlobalBudget('');
    setRevealAtDate('');
    setRevealAtTime('');

    localStorage.removeItem('ssm_participants');
    localStorage.removeItem('ssm_exclusions');
    localStorage.removeItem('ssm_assignments');
    localStorage.removeItem('ssm_eventDetails');
    localStorage.removeItem('ssm_globalBudget');
    
    setShowClearConfirmation(false);
    // Go back to the generator page if on a results page
    if (window.location.hash) {
      window.location.hash = '';
    }
    window.scrollTo(0, 0);
  };
  
  const handleBulkAdd = (names: string) => {
      const newParticipants = names
          .split('\n')
          .map(name => name.trim())
          .filter(name => name.length > 0)
          .map(name => ({
              id: crypto.randomUUID(), name, notes: '',
              budget: globalBudget || ''
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
        <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
          
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 flex items-center">
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

          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <button onClick={() => setRulesSectionOpen(!rulesSectionOpen)} className="w-full text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
                  <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">2</span>
                  Details & Rules
                  <span className="text-gray-500 font-normal text-xl ml-2">(Optional)</span>
                   <svg
                    className={`w-6 h-6 text-gray-400 transform transition-transform duration-300 ml-auto ${rulesSectionOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </h2>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${rulesSectionOpen ? 'max-h-[1000px] mt-6' : 'max-h-0'}`}>
              {/* Fix: Removed pageTheme and setPageTheme props which are not defined in OptionsProps. */}
              <Options 
                participants={participants.filter(p => p.name.trim() !== '')} 
                exclusions={exclusions} 
                setExclusions={setExclusions} 
                assignments={assignments}
                setAssignments={setAssignments}
                eventDetails={eventDetails} 
                setEventDetails={setEventDetails} 
                globalBudget={globalBudget}
                setGlobalBudget={handleGlobalBudgetChange}
                revealAtDate={revealAtDate}
                setRevealAtDate={setRevealAtDate}
                revealAtTime={revealAtTime}
                setRevealAtTime={setRevealAtTime}
              />
            </div>
          </div>
          
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Style Your Cards <span className="text-gray-500 font-normal text-xl ml-2">(Optional)</span>
            </h2>
             <p className="text-gray-600 mb-6 ml-11">Choose a theme and color for the printable cards and private links.</p>
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
             />
          </div>

          <div className="text-center pt-4">
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
            
             <button onClick={handleGenerateMatches} disabled={isGenerating} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
               {isGenerating ? 'Generating...' : '🎁 Generate & Get Share Links'}
             </button>
             <div className="mt-8">
                <button onClick={handleClear} className="text-sm text-gray-500 hover:text-red-600 font-semibold flex items-center justify-center gap-2 mx-auto">
                    <ClearIcon />
                    Clear Everything & Start Over
                </button>
            </div>
          </div>
        </main>
      </div>

      <FaqSection />
      <BlogPromo />
      
      <Footer theme={theme} setTheme={setTheme} />
      
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
                <button onClick={() => setShowClearConfirmation(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">
                    Cancel
                </button>
                <button onClick={confirmClear} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                    Yes, Clear Everything
                </button>
            </div>
          </div>
        </div>
      )}

      <BackToTopButton />
    </div>
  );
}

export default GeneratorPage;
