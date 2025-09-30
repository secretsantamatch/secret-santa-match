import React, { useState, useRef, useEffect } from 'react';
import type { Participant, Exclusion, Match, BackgroundOption, Assignment, FontSizeSetting, OutlineSizeSetting, FontTheme } from './types';
import Header from './components/Header';
import HowItWorks from './components/HowItWorks';
import ParticipantManager from './components/ParticipantManager';
import Options from './components/Options';
import ResultsDisplay from './components/ResultsDisplay';
import Footer from './components/Footer';
import BackgroundSelector from './components/BackgroundSelector';
import { generateIndividualCardsPdf, generateMasterListPdf } from './services/pdfService';
import ShareButtons from './components/ShareButtons';
import BlogPromo from './components/BlogPromo';
import FaqSection from './components/FaqSection';
import BackToTopButton from './components/BackToTopButton';
import BulkAddModal from './components/BulkAddModal';

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
      const parsed = JSON.parse(saved);
      // Prevent loading an empty participant list, which can happen from a bad save
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


function App() {
  const [participants, setParticipants] = useState<Participant[]>(() => loadFromStorage<Participant[]>('ssm_participants', defaultParticipants));
  const [exclusions, setExclusions] = useState<Exclusion[]>(() => loadFromStorage<Exclusion[]>('ssm_exclusions', []));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage<Assignment[]>('ssm_assignments', []));
  const [matches, setMatches] = useState<Match[] | null>(null);
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
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showDownloadOptionsModal, setShowDownloadOptionsModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [showDownloadConfirmationModal, setShowDownloadConfirmationModal] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [theme, setTheme] = useState(getSeasonalTheme());

  const resultsRef = useRef<HTMLDivElement>(null);
  const downloadModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  
  // --- Local Storage Hooks ---
  useEffect(() => { localStorage.setItem('ssm_participants', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssm_exclusions', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssm_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssm_eventDetails', eventDetails); }, [eventDetails]);


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
        if (selectedTheme.cardText) {
            setGreetingText(selectedTheme.cardText.greeting || 'Hello, {secret_santa}!');
            setIntroText(selectedTheme.cardText.intro || 'You are the Secret Santa for...');
            setWishlistLabelText(selectedTheme.cardText.wishlistLabel || 'Gift Ideas & Notes:');
        }
    }
  }, [background, backgroundOptions]);


  useEffect(() => {
    if (matches && !isGenerating) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [matches, isGenerating]);
  
    useEffect(() => {
    if (showDownloadOptionsModal) {
      const timer = setTimeout(() => setModalAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setModalAnimating(false);
    }
  }, [showDownloadOptionsModal]);
  
  useEffect(() => {
    if (showDownloadOptionsModal) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          const focusableElements = downloadModalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements || focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              event.preventDefault();
            }
          }
        }
      };
      
      downloadModalRef.current?.focus();
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showDownloadOptionsModal]);


  const handleGenerateMatches = () => {
    setError('');
    const validParticipants = participants.filter((p: Participant) => p.name.trim() !== '');

    const duplicateNames = validParticipants
      .map((p: Participant) => p.name.trim().toLowerCase())
      .filter((name, index, self) => self.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      setError(`Duplicate names found: ${[...new Set<string>(duplicateNames)].join(', ')}. Please ensure all names are unique.`);
      setMatches(null);
      return;
    }

    if (validParticipants.length < 2) {
      setError('Please add at least two participants with names.');
      setMatches(null);
      return;
    }
    
    if (assignments.length > validParticipants.length) {
        setError('There are more "must match" rules than participants.');
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
      
      const participantMap = new Map<string, Participant>(validParticipants.map((p: Participant) => [p.id, p]));
      
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
      
      const remainingGivers = validParticipants.filter((p: Participant) => !assignedGiverIds.has(p.id));
      const remainingReceivers = validParticipants.filter((p: Participant) => !assignedReceiverIds.has(p.id));
      
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
            (ex.p1 === giver.id && ex.p2 === receiver.id) ||
            (ex.p2 === giver.id && ex.p1 === receiver.id)
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

    if (generatedMatches) {
      setMatches(generatedMatches);
      setError('');
    } else {
      setError('Could not find a valid match combination. This can happen with many exclusions, required matches, or just by chance. Please try again or simplify your rules.');
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

    localStorage.removeItem('ssm_participants');
    localStorage.removeItem('ssm_exclusions');
    localStorage.removeItem('ssm_assignments');
    localStorage.removeItem('ssm_eventDetails');
    
    setShowClearConfirmation(false);
    window.scrollTo(0, 0);
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
            // Remove any initial/empty placeholder participants before adding the new ones.
            const currentParticipants = participants.filter(p => p.name.trim() !== '' || p.notes.trim() !== '' || p.budget.trim() !== '');
            setParticipants([...currentParticipants, ...newParticipants]);
        }
        setShowBulkAddModal(false);
    };

  const performPdfGeneration = async (generationFn: () => Promise<void>) => {
    let loadingTimer: number | null = null;
    try {
      loadingTimer = window.setTimeout(() => {
        setIsPdfLoading(true);
      }, 500);

      await generationFn();

    } catch (err) {
      console.error("PDF Generation failed:", err);
      setError("Sorry, something went wrong while generating the PDF. Please try again.");
    } finally {
      if (loadingTimer) clearTimeout(loadingTimer);
      setIsPdfLoading(false);
    }
  };


  const handleDownload = async (type: 'cards' | 'list' | 'both') => {
      if (!matches) return;
      setError('');
      if (!greetingText.includes('{secret_santa}')) {
          setError("The Greeting text must include {secret_santa} so the giver's name appears. Please add it back before downloading.");
          return;
      }
      
      setShowDownloadOptionsModal(false);

      await performPdfGeneration(async () => {
        if (type === 'cards' || type === 'both') {
            await generateIndividualCardsPdf({ 
                matches, 
                eventDetails, 
                backgroundOptions,
                backgroundId: background,
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
                wishlistLabelText
              });
        }
        if (type === 'list' || type === 'both') {
            generateMasterListPdf({ matches, eventDetails });
        }
      });

      setShowDownloadConfirmationModal(true);
  };

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
              exclusions={exclusions} 
              setExclusions={setExclusions} 
              assignments={assignments}
              setAssignments={setAssignments}
              eventDetails={eventDetails} 
              setEventDetails={setEventDetails} 
            />
          </div>
          
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Style Your Cards <span className="text-[var(--primary-color)] ml-2">*</span>
            </h2>
             <p className="text-gray-600 mb-6 ml-11">Choose a theme and color for the printable cards.</p>
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
            
            {matches ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={handleGenerateMatches} disabled={isGenerating} className="flex items-center justify-center gap-3 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
                      <RerollIcon />
                      {isGenerating ? 'Generating...' : 'Generate Again'}
                  </button>
                  <button onClick={handleClear} className="flex items-center justify-center gap-3 bg-[var(--danger-color)] hover:bg-[var(--danger-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out">
                      <ClearIcon />
                      Clear
                  </button>
              </div>
            ) : (
               <button onClick={handleGenerateMatches} disabled={isGenerating} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out disabled:opacity-50 disabled:scale-100">
                 {isGenerating ? 'Generating...' : '🎁 Generate Matches'}
               </button>
            )}
          </div>

          {matches && matches.length > 0 && (
            <div ref={resultsRef} className="pt-4 space-y-8">
              <ResultsDisplay matches={matches} />
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                    <div className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-3xl font-bold font-serif mb-2">Ready to Download!</h3>
                    <p className="text-green-100 max-w-xs mb-6 text-lg">Your printable cards and master list are ready to go.</p>
                    <button onClick={() => setShowDownloadOptionsModal(true)} className="bg-white text-green-700 font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105 hover:shadow-xl hover:bg-gray-100 transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download Now
                    </button>
                </div>
                <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                    <div className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                    </div>
                    <h3 className="text-3xl font-bold font-serif mb-2">Share the Fun!</h3>
                    <p className="text-orange-100 max-w-xs mb-6 text-lg">Enjoying this free tool? Help spread the holiday cheer!</p>
                    <ShareButtons />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <FaqSection />
      <BlogPromo />
      
      <Footer theme={theme} setTheme={setTheme} />
      
      {isPdfLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="text-white text-center">
            <svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-semibold mt-4">Generating your PDF...</p>
            <p className="text-sm opacity-80">This may take a moment for custom images.</p>
          </div>
        </div>
      )}

      {showDownloadOptionsModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${modalAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowDownloadOptionsModal(false)}>
          <div ref={downloadModalRef} onClick={e => e.stopPropagation()} tabIndex={-1} className={`bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-6 sm:p-8 max-w-lg w-full outline-none transition-all duration-300 ${modalAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="text-center">
                  <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">Choose Your Download</h2>
                  <p className="text-gray-600 mb-8">Select which documents you'd like to generate.</p>
              </div>
              <div className="space-y-4">
                  <button onClick={() => handleDownload('both')} className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold p-4 rounded-xl shadow-lg transform hover:scale-105 transition-all text-left flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </div>
                      <div>
                          <span className="text-xl">Download Both</span>
                          <span className="font-normal text-sm block opacity-90">(Cards & Master List)</span>
                      </div>
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => handleDownload('cards')} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold p-4 rounded-xl shadow-md transition-colors text-left flex flex-col justify-between items-start h-36">
                        <div>
                            <div className="p-2 bg-white/20 rounded-lg mb-2 inline-block">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            </div>
                            <p className="text-lg">Individual Cards Only</p>
                        </div>
                        <p className="text-sm text-slate-200 font-normal">Cards for each</p>
                    </button>
                    
                    <button onClick={() => handleDownload('list')} className="w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold p-4 rounded-xl shadow-md transition-colors text-left flex flex-col justify-between items-start h-36">
                         <div>
                            <div className="p-2 bg-white/20 rounded-lg mb-2 inline-block">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            </div>
                            <p className="text-lg">Master List Only</p>
                        </div>
                        <p className="text-sm text-slate-200 font-normal">A single page showing all matches.</p>
                    </button>
                  </div>
              </div>
              
              <div className="p-4 mt-6 bg-amber-50 rounded-lg border border-amber-200 text-center">
                  <p className="text-base text-amber-900 mb-3">Did this make your holiday planning easier?<br/>A small tip helps keep this tool free for everyone!</p>
                  <a href="https://buy.stripe.com/00w5kFgG62RF8CA3XBfw400" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[var(--donation-2-bg)] hover:bg-[var(--donation-2-hover-bg)] text-[var(--donation-2-text)] border border-[var(--donation-2-border)] font-semibold py-2 px-4 rounded-full text-sm transition-colors transform hover:scale-105">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1h-2V4H7v1H5V4zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" /></svg>
                     Tip the Elves
                  </a>
              </div>

              <div className="text-center">
                  <button onClick={() => setShowDownloadOptionsModal(false)} className="mt-6 text-gray-500 hover:bg-gray-100 font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                      Cancel
                  </button>
              </div>
          </div>
        </div>
      )}

      {showDownloadConfirmationModal && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="mx-auto bg-[var(--accent-lighter-bg)] rounded-full h-16 w-16 flex items-center justify-center">
                <svg className="h-10 w-10 text-[var(--accent-icon-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 font-serif mt-5 mb-2">Success!</h2>
            <p className="text-gray-600 mb-6">Your download will begin momentarily. Happy gifting!</p>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-3">Please consider sharing!</h3>
                <ShareButtons />
            </div>
             <button onClick={() => setShowDownloadConfirmationModal(false)} className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">
                Close
            </button>
          </div>
        </div>
      )}
      
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
            <p className="text-gray-600 mb-6">This will permanently clear all participants, rules, and matches. This action cannot be undone.</p>
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

export default App;
