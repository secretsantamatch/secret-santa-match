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
import ShareButtons from './ShareButtons';

const RerollIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M5.52 15.88A8.01 8.01 0 0012 20a8 8 0 100-16 7.92 7.92 0 00-6.48 3.52M20 20v-5h-5" /></svg>;
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
      return JSON.parse(saved);
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
  const [participants, setParticipants] = useState<Participant[]>(() => loadFromStorage<Participant[]>('ssm_participants_v2', defaultParticipants));
  const [exclusions, setExclusions] = useState<Exclusion[]>(() => loadFromStorage<Exclusion[]>('ssm_exclusions_v2', []));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage<Assignment[]>('ssm_assignments_v2', []));
  const [matches, setMatches] = useState<Match[] | null>(null);
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
  const [revealDate, setRevealDate] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [theme, setTheme] = useState(getSeasonalTheme());
  const [generatedLinks, setGeneratedLinks] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});
  const [duplicateNameIds, setDuplicateNameIds] = useState<Set<string>>(new Set());

  const resultsRef = useRef<HTMLDivElement>(null);

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
        if (data.length > 0) {
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
        setGreetingText(selectedTheme.cardText?.greeting || 'Hello, {secret_santa}!');
        setIntroText(selectedTheme.cardText?.intro || 'You are the Secret Santa for...');
        setWishlistLabelText(selectedTheme.cardText?.wishlistLabel || 'Gift Ideas & Notes:');
    }
  }, [background, backgroundOptions]);

  useEffect(() => {
    if (matches && !isGenerating) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [matches, isGenerating]);
  
  const handleGenerateMatches = () => {
    setError('');
    setGeneratedLinks([]);
    const validParticipants = participants.filter(p => p.name.trim() !== '');

    const nameCounts = new Map<string, string[]>();
    validParticipants.forEach(p => {
        const lowerCaseName = p.name.trim().toLowerCase();
        if (!nameCounts.has(lowerCaseName)) {
            nameCounts.set(lowerCaseName, []);
        }
        nameCounts.get(lowerCaseName)?.push(p.id);
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
        setMatches(null);
        return;
    }

    if (validParticipants.length < 2) {
      setError('Please add at least two participants.');
      setMatches(null);
      return;
    }

    setIsGenerating(true);
    setMatches(null);

    let generatedMatches: Match[] | null = null;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts && !generatedMatches) {
      attempts++;
      
      let localMatches: Match[] = [];
      let receivers = [...validParticipants];
      
      let possible = true;
      for (const giver of validParticipants) {
        let potentialReceivers = receivers.filter(receiver => {
          if (giver.id === receiver.id) return false;
          
          const isExcluded = exclusions.some(ex =>
            (ex.p1 === giver.id && ex.p2 === receiver.id) ||
            (ex.p2 === giver.id && ex.p1 === receiver.id)
          );
          if (isExcluded) return false;
          
          const mustMatch = assignments.find(a => a.giverId === giver.id);
          if (mustMatch && mustMatch.receiverId !== receiver.id) return false;
          
          if(assignments.some(a => a.receiverId === receiver.id && a.giverId !== giver.id)) return false;

          return true;
        });
        
        if (potentialReceivers.length > 0) {
          const receiver = potentialReceivers[Math.floor(Math.random() * potentialReceivers.length)];
          localMatches.push({ giver, receiver });
          receivers = receivers.filter(r => r.id !== receiver.id);
        } else {
          possible = false;
          break;
        }
      }
      
      if (possible && localMatches.length === validParticipants.length) {
        generatedMatches = localMatches;
      }
    }

    if (generatedMatches) {
        setMatches(generatedMatches);
        setError('');
        
        const cardStyle: CardStyleData = {
            backgroundId: background, customBackground, textColor, useTextOutline, outlineColor,
            outlineSize, fontSizeSetting, fontTheme, lineSpacing, greetingText, introText, wishlistLabelText
        };

        const participantMap = new Map(validParticipants.map((p, i) => [p.id, i]));
        
        const data: ExchangeData = {
            p: validParticipants.map(({ id, ...rest }) => rest),
            m: generatedMatches.map(m => ({ g: participantMap.get(m.giver.id)!, r: participantMap.get(m.receiver.id)! })),
            style: cardStyle,
            e: eventDetails,
            rd: revealDate || undefined
        };
        const encodedData = encodeData(data);
        const baseUrl = window.location.origin + window.location.pathname;
        const newLinks = validParticipants.map((p) => {
            const pIndex = participantMap.get(p.id)!;
            return `${baseUrl}#${encodedData}?id=${pIndex}`;
        });
        setGeneratedLinks(newLinks);
    } else {
        setError('Could not find a valid match combination. This can happen with many exclusions or required matches. Please try again or simplify your rules.');
        setMatches(null);
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
    setMatches(null);
    setError('');
    setEventDetails('');
    setGeneratedLinks([]);
    setRevealDate('');
    localStorage.removeItem('ssm_participants_v2');
    localStorage.removeItem('ssm_exclusions_v2');
    localStorage.removeItem('ssm_assignments_v2');
    localStorage.removeItem('ssm_eventDetails_v2');
    setShowClearConfirmation(false);
    window.scrollTo(0, 0);
  };
  
  const handleBulkAdd = (names: string) => {
    const newParticipants = names.split('\n').map(name => name.trim()).filter(Boolean)
        .map(name => ({ id: crypto.randomUUID(), name, notes: '', budget: '' }));
    if (newParticipants.length > 0) {
        const currentParticipants = participants.filter(p => p.name.trim() !== '');
        setParticipants([...currentParticipants, ...newParticipants]);
    }
    setShowBulkAddModal(false);
  };
  
  const handleCopy = (link: string, index: number) => {
    navigator.clipboard.writeText(link).then(() => {
        setCopySuccess(prev => ({ ...prev, [index]: true }));
        setTimeout(() => setCopySuccess(prev => ({ ...prev, [index]: false })), 2000);
    });
  };

  const allCopied = matches && Object.values(copySuccess).filter(Boolean).length === matches.length;
  
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <Header />
        <HowItWorks />
        <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
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
                <p className="text-gray-600 mb-6 ml-11">Include event details, set rules, or schedule a reveal date.</p>
                <Options 
                    participants={participants.filter(p => p.name.trim() !== '')} 
                    exclusions={exclusions} 
                    setExclusions={setExclusions} 
                    assignments={assignments}
                    setAssignments={setAssignments}
                    eventDetails={eventDetails} 
                    setEventDetails={setEventDetails} 
                />
                <div className="mt-6">
                    <label htmlFor="reveal-date" className="block text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        Reveal Date (Optional)
                    </label>
                    <input type="datetime-local" id="reveal-date" value={revealDate} onChange={e => setRevealDate(e.target.value)} className="p-2 border border-gray-300 rounded-md"/>
                    <p className="text-sm text-gray-500 mt-1">If set, participants won't see their match until this date and time.</p>
                </div>
            </div>

            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Style Cards for Private Links <span className="text-gray-500 text-xl ml-2">(Optional)</span>
            </h2>
             <p className="text-gray-600 mb-6 ml-11">Choose a theme and colors for the private links you'll share.</p>
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
                
                {matches ? (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button onClick={handleGenerateMatches} disabled={isGenerating} className="flex items-center justify-center gap-3 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
                          <RerollIcon />
                          {isGenerating ? 'Generating...' : 'Generate Again'}
                      </button>
                      <button onClick={handleClear} className="flex items-center justify-center gap-3 bg-[var(--danger-color)] hover:bg-[var(--danger-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
                          <ClearIcon />
                          Clear All
                      </button>
                  </div>
                ) : (
                   <button onClick={handleGenerateMatches} disabled={isGenerating} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
                     {isGenerating ? 'Generating...' : '🎁 Generate Private Links'}
                   </button>
                )}
            </div>

            {matches && matches.length > 0 && generatedLinks.length > 0 && (
              <div ref={resultsRef} className="pt-4 space-y-8">
                  <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">Success! Your Links are Ready.</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Copy each person's unique link below and send it to them privately via text, email, or your favorite messenger app. <strong className="text-slate-700">Their link will only show them who they are buying a gift for.</strong></p>
                    </div>
                    {allCopied && (
                        <div className="mb-4 p-4 text-center bg-green-50 text-green-800 border border-green-200 rounded-lg">
                            <h3 className="font-bold">All links copied! 🎉</h3>
                            <p className="text-sm">Time to spread the holiday cheer!</p>
                        </div>
                    )}
                    <div className="space-y-3 max-w-3xl mx-auto">
                        {matches.map((match, index) => (
                            <div key={match.giver.id} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 gap-3">
                                <div className="font-bold text-slate-800">{match.giver.name}'s Link</div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <input type="text" readOnly value={generatedLinks[index]} className="w-full text-sm p-2 border border-gray-300 rounded-md bg-white truncate" />
                                    <button onClick={() => handleCopy(generatedLinks[index], index)} className={`w-28 text-center font-semibold py-2 px-4 rounded-md transition-colors text-white ${copySuccess[index] ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-800'}`}>
                                        {copySuccess[index] ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200 text-center">
                        <h3 className="font-semibold text-amber-800 text-lg mb-3">Please consider sharing!</h3>
                        <p className="text-amber-900 text-sm mb-4">If this free tool made your life easier, a share helps others find it too!</p>
                        <ShareButtons participantCount={participants.length} />
                    </div>
                  </div>
              </div>
            )}
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
