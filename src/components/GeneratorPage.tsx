import React, { useState, useRef, useEffect } from 'react';
import type { Participant, Exclusion, Match, BackgroundOption, Assignment, FontSizeSetting, OutlineSizeSetting, FontTheme, MatchById, ExchangeData, CardStyle } from '../types';
import Header from './Header';
import HowItWorks from './HowItWorks';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import BackgroundSelector from './BackgroundSelector';
import BulkAddModal from './BulkAddModal';
import { encodeData } from '../services/urlService';
import FaqSection from './FaqSection';
import BlogPromo from './BlogPromo';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';

const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h--3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
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

const getSeasonalTheme = (): string => {
    const month = new Date().getMonth();
    if (month === 9) return 'halloween';
    if (month === 1) return 'valentines';
    return 'christmas';
};

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
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);

  const [globalBudget, setGlobalBudget] = useState<string>(() => loadFromStorage<string>('ssm_globalBudget', ''));
  const [exchangeDate, setExchangeDate] = useState<string>(() => loadFromStorage<string>('ssm_exchangeDate', ''));
  const [revealTime, setRevealTime] = useState<string>(() => loadFromStorage<string>('ssm_revealTime', ''));
  const [pageTheme, setPageTheme] = useState<string>(() => loadFromStorage<string>('ssm_pageTheme', getSeasonalTheme()));
  const [duplicateNameIds, setDuplicateNameIds] = useState<Set<string>>(new Set());
  const [siteTheme, setSiteTheme] = useState(getSeasonalTheme());


  useEffect(() => { document.documentElement.dataset.theme = siteTheme; }, [siteTheme]);
  useEffect(() => { localStorage.setItem('ssm_participants', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssm_exclusions', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssm_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssm_eventDetails', JSON.stringify(eventDetails)); }, [eventDetails]);
  useEffect(() => { localStorage.setItem('ssm_globalBudget', JSON.stringify(globalBudget)); }, [globalBudget]);
  useEffect(() => { localStorage.setItem('ssm_exchangeDate', JSON.stringify(exchangeDate)); }, [exchangeDate]);
  useEffect(() => { localStorage.setItem('ssm_revealTime', JSON.stringify(revealTime)); }, [revealTime]);
  useEffect(() => { localStorage.setItem('ssm_pageTheme', JSON.stringify(pageTheme)); }, [pageTheme]);
  
  const handleGlobalBudgetChange = (budget: string) => {
    setGlobalBudget(budget);
    setParticipants(prev => prev.map(p => ({ ...p, budget })));
  };

  useEffect(() => {
    fetch('/templates.json')
      .then(response => response.json())
      .then((data: BackgroundOption[]) => {
        setBackgroundOptions(data);
        if (data.length > 1) {
            const defaultTheme = data[1];
            setBackground(defaultTheme.id);
            setTextColor(defaultTheme.defaultTextColor);
            setOutlineColor('#FFFFFF');
        }
      });
  }, []);

  const handleSetSelectedBackground = (id: string) => {
    setBackground(id);
    const selectedTheme = backgroundOptions.find(opt => opt.id === id);
    if (selectedTheme) {
        setTextColor(selectedTheme.defaultTextColor);
        setOutlineColor('#FFFFFF');
    }
  };

  const handleGenerateMatches = () => {
    setError('');
    const validParticipants = participants.filter(p => p.name.trim() !== '');

    const nameCounts = new Map<string, string[]>();
    validParticipants.forEach(p => {
        const name = p.name.trim().toLowerCase();
        if (!nameCounts.has(name)) nameCounts.set(name, []);
        nameCounts.get(name)!.push(p.id);
    });

    const dupIds = new Set<string>();
    for (const ids of nameCounts.values()) {
        if (ids.length > 1) ids.forEach(id => dupIds.add(id));
    }
    setDuplicateNameIds(dupIds);

    if (dupIds.size > 0) {
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
      const { success, matches } = tryGenerate(validParticipants, exclusions, assignments);
      if (success) generatedMatches = matches;
    }

    if (generatedMatches) {
        const matchesById: MatchById[] = generatedMatches.map(m => ({ g: m.giver.id, r: m.receiver.id }));
        
        let revealTimestamp: number | undefined = undefined;
        if (exchangeDate) {
            const revealDateStr = exchangeDate + 'T' + (revealTime || '00:00:00');
            const revealDate = new Date(revealDateStr);
            if (!isNaN(revealDate.getTime())) revealTimestamp = revealDate.getTime();
        }

        const cardStyle: CardStyle = {
            bgId: background, bgImg: customBackground, txtColor: textColor, useOutline: useTextOutline,
            outColor: outlineColor, outSize: outlineSize, fontSize: fontSizeSetting, font: fontTheme,
            line: lineSpacing, greet: greetingText, intro: introText, wish: wishlistLabelText,
        };

        const exchangeData: ExchangeData = {
            // Fix: Include all participant data, including ID, and apply global budget if needed.
            p: validParticipants.map(p => ({ ...p, budget: p.budget || globalBudget })),
            m: matchesById,
            details: eventDetails,
            style: cardStyle,
            th: pageTheme,
            revealAt: revealTimestamp,
            rt: revealTime
        };

        const encodedData = encodeData(exchangeData);
        window.location.hash = encodedData;
    } else {
      setError('Could not find a valid match combination. This can happen with many exclusions. Please try again or simplify your rules.');
    }
    setIsGenerating(false);
  };
  
  const tryGenerate = (participants: Participant[], exclusions: Exclusion[], assignments: Assignment[]) => {
      const participantMap = new Map<string, Participant>(participants.map(p => [p.id, p]));
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
      
      const remainingGivers = participants.filter(p => !assignedGiverIds.has(p.id));
      let remainingReceivers = participants.filter(p => !assignedReceiverIds.has(p.id));
      remainingReceivers = remainingReceivers.sort(() => Math.random() - 0.5);

      const currentMatches: Match[] = [];
      const availableReceivers = new Set<Participant>(remainingReceivers);

      for (const giver of remainingGivers) {
        const potentialReceivers = Array.from(availableReceivers).filter(receiver => 
            giver.id !== receiver.id && 
            !exclusions.some(ex => (ex.p1 === giver.id && ex.p2 === receiver.id) || (ex.p2 === giver.id && ex.p1 === receiver.id))
        );
        if (potentialReceivers.length > 0) {
          const receiver = potentialReceivers[Math.floor(Math.random() * potentialReceivers.length)];
          currentMatches.push({ giver, receiver });
          availableReceivers.delete(receiver);
        } else {
          return { success: false, matches: [] };
        }
      }
      return { success: true, matches: [...assignedMatches, ...currentMatches] };
  };

  const confirmClear = () => {
    setParticipants(defaultParticipants);
    setExclusions([]); setAssignments([]); setError('');
    setEventDetails(''); setGlobalBudget(''); setExchangeDate(''); setRevealTime('');
    setDuplicateNameIds(new Set());
    Object.keys(localStorage).forEach(key => { if(key.startsWith('ssm_')) localStorage.removeItem(key); });
    setShowClearConfirmation(false);
    window.scrollTo(0, 0);
  };
  
  const handleBulkAdd = (names: string) => {
    const newParticipants = names.split('\n').map(name => name.trim()).filter(name => name).map(name => ({
        id: crypto.randomUUID(), name, notes: '', budget: globalBudget
    }));
    if (newParticipants.length > 0) {
        const currentParticipants = participants.filter(p => p.name.trim() !== '');
        setParticipants([...currentParticipants, ...newParticipants]);
    }
    setShowBulkAddModal(false);
  };

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <Header />
        <HowItWorks />
        <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
          
          <div id="participants-section" className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
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

          <div id="rules-section" className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <button onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)} className="w-full p-6 md:p-8 text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">2</span>
                  Details & Rules <span className="text-base font-normal text-gray-500 ml-2">(Optional)</span>
                </div>
                <svg className={`w-6 h-6 text-gray-500 transform transition-transform duration-300 ${isDetailsCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </h2>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isDetailsCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`}>
              <div className="p-6 md:p-8 pt-0">
                <Options 
                  participants={participants.filter(p => p.name.trim() !== '')} 
                  exclusions={exclusions} setExclusions={setExclusions} 
                  assignments={assignments} setAssignments={setAssignments}
                  eventDetails={eventDetails} setEventDetails={setEventDetails} 
                  globalBudget={globalBudget} setGlobalBudget={handleGlobalBudgetChange}
                  exchangeDate={exchangeDate} setExchangeDate={setExchangeDate}
                  revealTime={revealTime} setRevealTime={setRevealTime}
                  pageTheme={pageTheme} setPageTheme={setPageTheme}
                />
              </div>
            </div>
          </div>
          
          <div id="style-section" className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Style Your Cards & Reveal Page
            </h2>
             <BackgroundSelector 
                participants={participants} eventDetails={eventDetails} backgroundOptions={backgroundOptions}
                selectedBackground={background} setSelectedBackground={handleSetSelectedBackground}
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
               <button onClick={handleGenerateMatches} disabled={isGenerating} className="flex-grow bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
                 {isGenerating ? 'Generating...' : '🎁 Generate & Get Share Links'}
               </button>
               <button title="Clear all data and start over" onClick={() => setShowClearConfirmation(true)} className="flex items-center justify-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 px-6 text-lg rounded-full shadow-sm transition-colors">
                  <ClearIcon />
              </button>
            </div>
          </div>
        </main>
      </div>
      <FaqSection />
      <BlogPromo />
      <Footer theme={siteTheme} setTheme={setSiteTheme} />
      {showBulkAddModal && <BulkAddModal onClose={() => setShowBulkAddModal(false)} onConfirm={handleBulkAdd} />}
      {showClearConfirmation && (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="mx-auto bg-red-100 rounded-full h-16 w-16 flex items-center justify-center"><svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
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
