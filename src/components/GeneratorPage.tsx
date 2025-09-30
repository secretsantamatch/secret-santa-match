import React, { useState, useRef, useEffect } from 'react';
import type { Participant, Exclusion, Match, BackgroundOption, Assignment, FontSizeSetting, OutlineSizeSetting, FontTheme, ExchangeData } from '../types';
import { encodeData } from '../services/urlService';
import Header from './Header';
import HowItWorks from './HowItWorks';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import Footer from './Footer';
import BlogPromo from './BlogPromo';
import FaqSection from './FaqSection';
import BackToTopButton from './BackToTopButton';
import BulkAddModal from './BulkAddModal';

const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;

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

const defaultParticipants: Participant[] = [
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
  const [exchangeDate, setExchangeDate] = useState<string>(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7); // Default to one week from now
    return today.toISOString().split('T')[0];
  });

  const [duplicateNameIds, setDuplicateNameIds] = useState<Set<string>>(new Set());
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ssm_theme') || getSeasonalTheme();
  });
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  const participantsRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    localStorage.setItem('ssm_theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  
  useEffect(() => { localStorage.setItem('ssm_participants', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssm_exclusions', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssm_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssm_eventDetails', eventDetails); }, [eventDetails]);
  useEffect(() => { localStorage.setItem('ssm_exchangeDate', exchangeDate); }, [exchangeDate]);


    useEffect(() => {
        const nameMap = new Map<string, string[]>();
        participants.forEach(p => {
            const trimmedName = p.name.trim().toLowerCase();
            if (trimmedName) {
                if (!nameMap.has(trimmedName)) {
                    nameMap.set(trimmedName, []);
                }
                nameMap.get(trimmedName)!.push(p.id);
            }
        });

        const duplicates = new Set<string>();
        nameMap.forEach(ids => {
            if (ids.length > 1) {
                ids.forEach(id => duplicates.add(id));
            }
        });
        setDuplicateNameIds(duplicates);
    }, [participants]);

  const handleStepClick = (stepNumber: number) => {
    let targetRef: React.RefObject<HTMLDivElement> | null = null;
    if (stepNumber === 1) targetRef = participantsRef;
    if (stepNumber === 2) targetRef = rulesRef;

    if (targetRef?.current) {
      if (stepNumber === 2) {
        setIsRulesExpanded(true);
      }
      
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetRef.current.classList.add('highlight-section');
      setTimeout(() => {
        targetRef.current?.classList.remove('highlight-section');
      }, 1200);
    }
  };

  const handleGenerateMatches = () => {
    setError('');
    const validParticipants = participants.filter(p => p.name.trim() !== '');
    
    if (duplicateNameIds.size > 0) {
      setError(`Duplicate names found. Please ensure all names are unique before generating matches.`);
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
    let generatedMatches: Match[] | null = null; let attempts = 0; const maxAttempts = 100;
    while (attempts < maxAttempts && !generatedMatches) {
      attempts++;
      const participantMap = new Map(validParticipants.map(p => [p.id, p]));
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
      for (let i = remainingReceivers.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [remainingReceivers[i], remainingReceivers[j]] = [remainingReceivers[j], remainingReceivers[i]]; }
      const currentMatches: Match[] = []; const availableReceivers = new Set(remainingReceivers); let possible = true;
      for (const giver of remainingGivers) {
        const potentialReceivers = Array.from(availableReceivers).filter(receiver => giver.id !== receiver.id && !exclusions.some(ex => (ex.p1 === giver.id && ex.p2 === receiver.id) || (ex.p2 === giver.id && ex.p1 === receiver.id)));
        if (potentialReceivers.length > 0) {
          const receiver = potentialReceivers[Math.floor(Math.random() * potentialReceivers.length)];
          currentMatches.push({ giver, receiver });
          availableReceivers.delete(receiver);
        } else { possible = false; break; }
      }
      if (possible) generatedMatches = [...assignedMatches, ...currentMatches];
    }
    if (generatedMatches) { 
        setError(''); 
        const data: ExchangeData = {
            p: participants,
            m: generatedMatches,
            e: exclusions,
            a: assignments,
            d: eventDetails,
            t: exchangeDate
        };
        const encodedData = encodeData(data);
        window.location.hash = encodedData;
    }
    else { setError('Could not find a valid match combination. Try again or simplify your rules.'); }
    setIsGenerating(false);
  };
  
  const handleClear = () => setShowClearConfirmation(true);
  
  const confirmClear = () => {
    setParticipants(defaultParticipants); setExclusions([]); setAssignments([]); setError(''); setEventDetails('');
    ['ssm_participants', 'ssm_exclusions', 'ssm_assignments', 'ssm_eventDetails', 'ssm_exchangeDate'].forEach(k => localStorage.removeItem(k));
    setShowClearConfirmation(false); window.scrollTo(0, 0);
  };
  
  const handleBulkAdd = (names: string) => {
    const newParticipants = names.split('\n').map(name => name.trim()).filter(Boolean).map(name => ({ id: crypto.randomUUID(), name, notes: '', budget: '' }));
    if (newParticipants.length > 0) {
      const currentParticipants = participants.filter(p => p.name.trim());
      setParticipants([...currentParticipants, ...newParticipants]);
    }
    setShowBulkAddModal(false);
  };
  
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <Header />
        <HowItWorks onStepClick={handleStepClick} />
        <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
          
          <div ref={participantsRef} className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">1</span>
              Add Names <span className="text-[var(--primary-color)] ml-2">*</span>
            </h2>
            <ParticipantManager 
              participants={participants} 
              setParticipants={setParticipants} 
              onBulkAddClick={() => setShowBulkAddModal(true)}
              duplicateNameIds={duplicateNameIds}
            />
          </div>
          
          <div ref={rulesRef} className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <button onClick={() => setIsRulesExpanded(!isRulesExpanded)} className="w-full text-left flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
                    <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">2</span>
                    Details &amp; Rules <span className="text-gray-500 font-normal text-lg ml-2">(Optional)</span>
                </h2>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-500 transition-transform duration-300 ${isRulesExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isRulesExpanded ? 'max-h-[1000px] pt-6' : 'max-h-0'}`}>
                <Options participants={participants.filter(p => p.name.trim() !== '')} exclusions={exclusions} setExclusions={setExclusions} assignments={assignments} setAssignments={setAssignments} eventDetails={eventDetails} setEventDetails={setEventDetails} exchangeDate={exchangeDate} setExchangeDate={setExchangeDate} />
            </div>
          </div>
          
          <div className="text-center pt-4">
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={handleGenerateMatches} disabled={isGenerating} className="flex-1 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform disabled:opacity-50">
                    {isGenerating ? 'Generating...' : '🎁 Generate & Get Share Links'}
                </button>
                <button onClick={handleClear} className="flex items-center justify-center gap-3 bg-[var(--danger-color)] hover:bg-[var(--danger-color-hover)] text-white font-bold py-3 px-6 text-lg rounded-full shadow-lg transform hover:scale-105 transition-transform">
                    <ClearIcon />
                    Clear Form
                </button>
            </div>
          </div>
        </main>
      </div>
      <FaqSection />
      <BlogPromo />
      <Footer theme={theme} setTheme={setTheme} />

      {showBulkAddModal && <BulkAddModal onClose={() => setShowBulkAddModal(false)} onConfirm={handleBulkAdd} />}
      
      {showClearConfirmation && ( <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"><div className="mx-auto bg-red-100 rounded-full h-16 w-16 flex items-center justify-center"><svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div><h2 className="text-3xl font-bold text-slate-800 font-serif mt-5 mb-2">Are you sure?</h2><p className="text-gray-600 mb-6">This will permanently clear all participants and rules. This action cannot be undone.</p><div className="flex justify-center gap-4"><button onClick={() => setShowClearConfirmation(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">Cancel</button><button onClick={confirmClear} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">Yes, Clear Everything</button></div></div></div> )}
      <BackToTopButton />
    </div>
  );
}

export default GeneratorPage;
