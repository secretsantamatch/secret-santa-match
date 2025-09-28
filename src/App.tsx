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
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showDownloadOptionsModal, setShowDownloadOptionsModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [theme, setTheme] = useState(getSeasonalTheme());
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const downloadModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  
  useEffect(() => { localStorage.setItem('ssm_participants', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssm_exclusions', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssm_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssm_eventDetails', eventDetails); }, [eventDetails]);

  useEffect(() => {
    fetch('/templates.json')
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load'))
      .then((data: BackgroundOption[]) => {
        setBackgroundOptions(data);
        setBackground(data.length > 1 ? data[1].id : data[0]?.id || '');
      })
      .catch(err => setError('Could not load card themes. Please try refreshing.'));
  }, []);

  useEffect(() => {
    if (backgroundOptions.length === 0 || !background) return;
    const selectedTheme = backgroundOptions.find(opt => opt.id === background);
    if (selectedTheme?.cardText) {
        setGreetingText(selectedTheme.cardText.greeting || 'Hello, {secret_santa}!');
        setIntroText(selectedTheme.cardText.intro || 'You are the Secret Santa for...');
        setWishlistLabelText(selectedTheme.cardText.wishlistLabel || 'Gift Ideas & Notes:');
    }
    if(selectedTheme?.defaultTextColor) setTextColor(selectedTheme.defaultTextColor);
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

  const handleGenerateMatches = () => {
    setError('');
    setEmailSendStatus('idle');
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
    setIsGenerating(true); setMatches(null);
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
    if (generatedMatches) { setMatches(generatedMatches); setError(''); }
    else { setError('Could not find a valid match combination. Try again or simplify your rules.'); setMatches(null); }
    setIsGenerating(false);
  };
  
  const handleClear = () => setShowClearConfirmation(true);
  
  const confirmClear = () => {
    setParticipants(defaultParticipants); setExclusions([]); setAssignments([]); setMatches(null); setError(''); setEventDetails('');
    ['ssm_participants', 'ssm_exclusions', 'ssm_assignments', 'ssm_eventDetails'].forEach(k => localStorage.removeItem(k));
    setShowClearConfirmation(false); window.scrollTo(0, 0);
  };
  
  const handleBulkAdd = (names: string) => {
    const newParticipants = names.split('\n').map(name => name.trim()).filter(Boolean).map(name => ({ id: crypto.randomUUID(), name, email: '', notes: '', budget: '' }));
    if (newParticipants.length > 0) {
      const currentParticipants = participants.filter(p => p.name.trim());
      setParticipants([...currentParticipants, ...newParticipants]);
    }
    setShowBulkAddModal(false);
  };

  const handleDownload = async (type: 'cards' | 'list') => {
    if (!matches) return;
    setError('');
    if (!greetingText.includes('{secret_santa}')) {
      setError("The Greeting text must include {secret_santa} so the giver's name appears. Please add it back before downloading.");
      return;
    }
    setShowDownloadOptionsModal(false);
    setIsPdfLoading(true);
    try {
      if (type === 'cards') await generateIndividualCardsPdf({ matches, eventDetails, backgroundOptions, backgroundId: background, customBackground, textColor, useTextOutline, outlineColor, outlineSize, fontSizeSetting, fontTheme, lineSpacing, greetingText, introText, wishlistLabelText });
      if (type === 'list') generateMasterListPdf({ matches, eventDetails });
    } catch (err) {
      setError("Sorry, something went wrong while generating the PDF.");
    } finally {
      setIsPdfLoading(false);
    }
  };
  
  const handleSendEmails = async () => {
    if (!matches) return;
    setIsSendingEmails(true); setEmailSendStatus('idle'); setError('');
    try {
        const response = await fetch('/.netlify/functions/send-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matches, eventDetails })
        });
        if (!response.ok) throw new Error('Failed to send emails.');
        setEmailSendStatus('success');
    } catch (error) {
        setEmailSendStatus('error');
        setError('An error occurred while sending emails. Please try again.');
    } finally {
        setIsSendingEmails(false);
    }
  };

  const participantsWithEmail = participants.filter(p => p.email?.includes('@')).length;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <Header />
        <HowItWorks />
        <main className="mt-8 md:mt-12 space-y-10 md:space-y-12">
          
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">1</span>
              Add Names <span className="text-[var(--primary-color)] ml-2">*</span>
            </h2>
            <ParticipantManager participants={participants} setParticipants={setParticipants} onBulkAddClick={() => setShowBulkAddModal(true)} />
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <button onClick={() => setIsRulesExpanded(!isRulesExpanded)} className="p-6 md:p-8 w-full text-left">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center">
                        <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">2</span>
                        Details &amp; Rules <span className="text-gray-500 font-normal text-lg ml-2">(Optional)</span>
                    </h2>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-500 transition-transform duration-300 ${isRulesExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isRulesExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="p-6 md:p-8 pt-0">
                    <Options participants={participants.filter(p => p.name.trim() !== '')} exclusions={exclusions} setExclusions={setExclusions} assignments={assignments} setAssignments={setAssignments} eventDetails={eventDetails} setEventDetails={setEventDetails} />
                </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Customize <span className="text-[var(--primary-color)] ml-2">*</span>
            </h2>
             <BackgroundSelector participants={participants} eventDetails={eventDetails} backgroundOptions={backgroundOptions} selectedBackground={background} setSelectedBackground={setBackground} customBackground={customBackground} setCustomBackground={setCustomBackground} textColor={textColor} setTextColor={setTextColor} useTextOutline={useTextOutline} setUseTextOutline={setUseTextOutline} outlineColor={outlineColor} setOutlineColor={setOutlineColor} outlineSize={outlineSize} setOutlineSize={setOutlineSize} fontSizeSetting={fontSizeSetting} setFontSizeSetting={setFontSizeSetting} fontTheme={fontTheme} setFontTheme={setFontTheme} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} greetingText={greetingText} setGreetingText={setGreetingText} introText={introText} setIntroText={setIntroText} wishlistLabelText={wishlistLabelText} setWishlistLabelText={setWishlistLabelText} />
          </div>

          <div className="text-center pt-4">
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
            {matches ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={handleGenerateMatches} disabled={isGenerating} className="flex items-center justify-center gap-3 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform"><RerollIcon />{isGenerating ? 'Generating...' : 'Generate Again'}</button>
                  <button onClick={handleClear} className="flex items-center justify-center gap-3 bg-[var(--danger-color)] hover:bg-[var(--danger-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform"><ClearIcon />Clear</button>
              </div>
            ) : ( <button onClick={handleGenerateMatches} disabled={isGenerating} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-4 px-10 text-xl rounded-full shadow-lg transform hover:scale-105 transition-transform disabled:opacity-50">{isGenerating ? 'Generating...' : '🎁 Generate Matches'}</button> )}
          </div>

          {matches && matches.length > 0 && (
            <div ref={resultsRef} className="pt-4 space-y-8">
              <ResultsDisplay matches={matches} />
              <div className="grid md:grid-cols-3 gap-8">
                <div className={`p-8 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center transition-all ${participantsWithEmail > 0 ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                    <div className="mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                    <h3 className="text-3xl font-bold font-serif mb-2">Send Results via Email</h3>
                    <p className="text-blue-100 max-w-xs mb-6 text-lg">Notify participants of their match instantly and securely.</p>
                    <button onClick={handleSendEmails} disabled={isSendingEmails || participantsWithEmail === 0} className="bg-white text-blue-700 font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105 transition-all disabled:bg-gray-200 disabled:text-gray-500 disabled:scale-100">
                        {isSendingEmails ? 'Sending...' : `Send (${participantsWithEmail}) Emails`}
                    </button>
                    {emailSendStatus === 'success' && <p className="text-sm mt-3 text-green-200">Emails sent successfully!</p>}
                    {emailSendStatus === 'error' && <p className="text-sm mt-3 text-red-200">Failed to send emails.</p>}
                </div>
                <div className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                    <div className="mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                    <h3 className="text-3xl font-bold font-serif mb-2">Download for Organizer</h3>
                    <p className="text-green-100 max-w-xs mb-6 text-lg">Get printable gift tags and a master list for your records.</p>
                    <button onClick={() => setShowDownloadOptionsModal(true)} className="bg-white text-green-700 font-bold py-3 px-8 text-lg rounded-full shadow-md transform hover:scale-105 transition-all">Download Now</button>
                </div>
                <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                    <div className="mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg></div>
                    <h3 className="text-3xl font-bold font-serif mb-2">Share the Fun!</h3>
                    <p className="text-orange-100 max-w-xs mb-6 text-lg">Enjoying this free tool? Share it with friends!</p>
                    <ShareButtons />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <FaqSection /> <BlogPromo /> <Footer theme={theme} setTheme={setTheme} />
      {isPdfLoading && ( <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"><div className="text-white text-center"><svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg><p className="text-xl font-semibold mt-4">Generating your PDF...</p><p className="text-sm opacity-80">This may take a moment for custom images.</p></div></div> )}
      {showDownloadOptionsModal && ( <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${modalAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowDownloadOptionsModal(false)}> <div ref={downloadModalRef} onClick={e => e.stopPropagation()} tabIndex={-1} className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-lg w-full outline-none transition-all duration-300 ${modalAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}> <div className="text-center"><h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">Download Options</h2><p className="text-gray-600 mb-8">What would you like to download?</p></div><div className="space-y-4"><button onClick={() => handleDownload('cards')} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold p-4 rounded-xl shadow-lg transition-all text-left flex items-center gap-4"><div className="p-3 bg-white/20 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div><div><span className="text-xl">Printable Gift Tags</span><span className="font-normal text-sm block opacity-90">Individual cards for each person.</span></div></button><button onClick={() => handleDownload('list')} className="w-full bg-slate-500 hover:bg-slate-600 text-white font-bold p-4 rounded-xl shadow-lg transition-all text-left flex items-center gap-4"><div className="p-3 bg-white/20 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></div><div><span className="text-xl">Organizer's Master List</span><span className="font-normal text-sm block opacity-90">A single page showing all matches.</span></div></button></div><div className="text-center"><button onClick={() => setShowDownloadOptionsModal(false)} className="mt-8 text-gray-500 hover:bg-gray-100 font-semibold py-2 px-4 rounded-full text-sm">Cancel</button></div></div></div> )}
      {showBulkAddModal && <BulkAddModal onClose={() => setShowBulkAddModal(false)} onConfirm={handleBulkAdd} />}
      {showClearConfirmation && ( <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"><div className="mx-auto bg-red-100 rounded-full h-16 w-16 flex items-center justify-center"><svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div><h2 className="text-3xl font-bold text-slate-800 font-serif mt-5 mb-2">Are you sure?</h2><p className="text-gray-600 mb-6">This will permanently clear all participants, rules, and matches. This action cannot be undone.</p><div className="flex justify-center gap-4"><button onClick={() => setShowClearConfirmation(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg">Cancel</button><button onClick={confirmClear} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">Yes, Clear Everything</button></div></div></div> )}
      <BackToTopButton />
    </div>
  );
}

export default App;
