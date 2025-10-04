
import React, { useState, useRef, useEffect } from 'react';
import type { Participant, Exclusion, Match, BackgroundOption, Assignment, FontSizeSetting, OutlineSizeSetting, FontTheme, CardStyleData, ExchangeData } from '../types';
import Header from './Header';
import HowItWorks from './HowItWorks';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import BackgroundSelector from './BackgroundSelector';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';
import BulkAddModal from './BulkAddModal';
import { encodeData } from '../services/urlService';
import FaqSection from './FaqSection';
import BlogPromo from './BlogPromo';

const getSeasonalTheme = (): string => {
    const month = new Date().getMonth();
    if (month === 9) return 'halloween';
    if (month === 1) return 'valentines';
    if (month >= 10) return 'christmas';
    return 'default';
};

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
  const [participants, setParticipants] = useState<Participant[]>(() => loadFromStorage<Participant[]>('ssm_participants_v2', defaultParticipants));
  const [exclusions, setExclusions] = useState<Exclusion[]>(() => loadFromStorage<Exclusion[]>('ssm_exclusions_v2', []));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage<Assignment[]>('ssm_assignments_v2', []));
  const [error, setError] = useState<string>('');
  const [eventDetails, setEventDetails] = useState<string>(() => loadFromStorage<string>('ssm_eventDetails_v2', ''));
  
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
  
  const [exchangeDate, setExchangeDate] = useState('');
  const [exchangeTime, setExchangeTime] = useState('');
  const [globalBudget, setGlobalBudget] = useState('');
  const [pageTheme, setPageTheme] = useState(getSeasonalTheme());
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [theme, setTheme] = useState(getSeasonalTheme());
  const [duplicateNameIds, setDuplicateNameIds] = useState<Set<string>>(new Set());
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  
  useEffect(() => { localStorage.setItem('ssm_participants_v2', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssm_exclusions_v2', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssm_assignments_v2', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssm_eventDetails_v2', eventDetails); }, [eventDetails]);

  useEffect(() => {
    fetch('/templates.json')
      .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
      .then((data: BackgroundOption[]) => {
        setBackgroundOptions(data);
        if (data.length > 1) setBackground(data[1].id);
      })
      .catch(error => {
        console.error('Failed to load theme templates:', error);
        setError('Could not load card themes. Please try refreshing the page.');
      });
  }, []);

  useEffect(() => {
    if (!background || !backgroundOptions.length) return;
    const selectedTheme = backgroundOptions.find(opt => opt.id === background);
    if (selectedTheme) {
        setTextColor(selectedTheme.defaultTextColor);
        setGreetingText(selectedTheme.cardText?.greeting || 'Hello, {secret_santa}!');
        setIntroText(selectedTheme.cardText?.intro || 'You are the Secret Santa for...');
        setWishlistLabelText(selectedTheme.cardText?.wishlistLabel || 'Gift Ideas & Notes:');
    }
  }, [background, backgroundOptions]);

  const handleGlobalBudgetChange = (budget: string) => {
    const sanitizedBudget = budget.replace(/[^0-9.]/g, '');
    setGlobalBudget(sanitizedBudget);
    setParticipants(prev => prev.map(p => ({ ...p, budget: sanitizedBudget })));
  };
  
  const handleGenerateMatches = () => {
    setError('');
    const validParticipants = participants.filter(p => p.name.trim() !== '');

    const nameCounts = new Map<string, string[]>();
    validParticipants.forEach(p => {
        const lowerCaseName = p.name.trim().toLowerCase();
        nameCounts.set(lowerCaseName, (nameCounts.get(lowerCaseName) || []).concat(p.id));
    });
    
    const newDuplicateNameIds = new Set<string>();
    let duplicateNames: string[] = [];
    nameCounts.forEach((ids, name) => {
        if (ids.length > 1) {
            ids.forEach(id => newDuplicateNameIds.add(id));
            duplicateNames.push(participants.find(p => p.id === ids[0])!.name);
        }
    });

    setDuplicateNameIds(newDuplicateNameIds);
    if (newDuplicateNameIds.size > 0) {
        setError(`Duplicate names found: ${duplicateNames.join(', ')}. Please ensure all names are unique.`);
        return;
    }

    if (validParticipants.length < 2) {
      setError('Please add at least two participants.');
      return;
    }
    
    if (assignments.length >= validParticipants.length) {
      setError('You cannot have as many "must match" rules as participants. Please remove at least one rule.');
      return;
    }

    setIsGenerating(true);
    let generatedMatches: Match[] | null = null;
    let attempts = 0;

    while (attempts < 100 && !generatedMatches) {
        attempts++;
        const participantMap = new Map(validParticipants.map(p => [p.id, p]));
        const assignedMatches: Match[] = [];
        const assignedGiverIds = new Set<string>();
        const assignedReceiverIds = new Set<string>();

        for (const assignment of assignments) {
            const giver = participantMap.get(assignment.giverId);
            const receiver = participantMap.get(assignment.receiverId);
            if (giver && receiver) {
                assignedMatches.push({ giver, receiver });
                assignedGiverIds.add(giver.id);
                assignedReceiverIds.add(receiver.id);
            }
        }

        const remainingGivers = validParticipants.filter(p => !assignedGiverIds.has(p.id));
        const remainingReceivers = [...validParticipants.filter(p => !assignedReceiverIds.has(p.id))];
        
        // Fisher-Yates shuffle
        for (let i = remainingReceivers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingReceivers[i], remainingReceivers[j]] = [remainingReceivers[j], remainingReceivers[i]];
        }
        
        let currentMatches: Match[] = [];
        let availableReceivers = new Set(remainingReceivers);
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
        const cardStyle: CardStyleData = { backgroundId: background, customBackground, textColor, useTextOutline, outlineColor, outlineSize, fontSizeSetting, fontTheme, lineSpacing, greetingText, introText, wishlistLabelText };
        const participantMap = new Map(validParticipants.map((p, i) => [p.id, i]));
        const data: ExchangeData = {
            p: validParticipants.map(({ id, ...rest }) => rest),
            m: generatedMatches.map(m => ({ g: participantMap.get(m.giver.id)!, r: participantMap.get(m.receiver.id)! })),
            style: cardStyle,
            e: eventDetails || undefined,
            rd: exchangeDate || undefined,
            rt: exchangeTime || undefined,
            th: pageTheme,
        };
        const encodedData = encodeData(data);
        window.location.hash = encodedData;
    } else {
        setError('Could not find a valid match combination. This can happen with many exclusions or required matches. Please try generating again or simplify your rules.');
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
    setPageTheme(getSeasonalTheme());
    localStorage.removeItem('ssm_participants_v2');
    localStorage.removeItem('ssm_exclusions_v2');
    localStorage.removeItem('ssm_assignments_v2');
    localStorage.removeItem('ssm_eventDetails_v2');
    setShowClearConfirmation(false);
    window.scrollTo(0, 0);
  };
  
  const handleBulkAdd = (names: string) => {
    const newParticipants = names.split('\n').map(name => name.trim()).filter(Boolean)
        .map(name => ({ id: crypto.randomUUID(), name, notes: '', budget: globalBudget }));
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
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <button onClick={() => setIsRulesExpanded(!isRulesExpanded)} className="w-full p-6 md:p-8 flex justify-between items-center text-left" aria-expanded={isRulesExpanded}>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center">
                    <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">2</span>
                    Details & Rules <span className="text-gray-500 text-xl ml-2 font-normal">(Optional)</span>
                </h2>
                <svg className={`w-6 h-6 text-gray-500 transform transition-transform duration-300 ${isRulesExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {isRulesExpanded && (
                  <div className="px-6 md:px-8 pb-8 animate-fade-in-down">
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
              )}
            </div>

            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center mb-6">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Style Your Cards <span className="text-gray-500 text-xl ml-2 font-normal">(Optional)</span>
            </h2>
             <BackgroundSelector 
                participants={participants} eventDetails={eventDetails} backgroundOptions={backgroundOptions} selectedBackground={background}
                setSelectedBackground={setBackground} customBackground={customBackground} setCustomBackground={setCustomBackground}
                textColor={textColor} setTextColor={setTextColor} useTextOutline={useTextOutline} setUseTextOutline={setUseTextOutline}
                outlineColor={outlineColor} setOutlineColor={setOutlineColor} outlineSize={outlineSize} setOutlineSize={setOutlineSize}
                fontSizeSetting={fontSizeSetting} setFontSizeSetting={setFontSizeSetting} fontTheme={fontTheme} setFontTheme={setFontTheme}
                lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} greetingText={greetingText} setGreetingText={setGreetingText}
                introText={introText} setIntroText={setIntroText} wishlistLabelText={wishlistLabelText} setWishlistLabelText={setWishlistLabelText}
             />
            </div>

            <div className="text-center pt-4">
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
                
                <button onClick={handleGenerateMatches} disabled={isGenerating} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
                    {isGenerating ? 'Generating...' : '🎁 Generate & Get Share Links'}
                </button>
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
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
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
