
import React, { useState, useRef, useEffect } from 'react';
// Fix: Corrected import paths for types and components.
import type { Participant, Exclusion, Match, BackgroundOption, Assignment, FontSizeSetting, OutlineSizeSetting, FontTheme, MatchById, ExchangeData, CardStyle } from '../types';
import Header from './Header';
import HowItWorks from './HowItWorks';
import ParticipantManager from './ParticipantManager';
import Options from './Options';
import ResultsDisplay from './ResultsDisplay';
import BackgroundSelector from './BackgroundSelector';
import BulkAddModal from './BulkAddModal';
import { generateIndividualCardsPdf, generateMasterListPdf } from '../services/pdfService';
import { encodeData } from '../services/urlService';
import ShareButtons from './ShareButtons';

const RerollIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M5.52 15.88A8.01 8.01 0 0012 20a8 8 0 100-16 7.92 7.92 0 00-6.48 3.52M20 20v-5h-5" /></svg>;
const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;

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

const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V3z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

const GeneratorPage: React.FC = () => {
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
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);

  // New state for URL-based sharing
  const [globalBudget, setGlobalBudget] = useState<string>(() => loadFromStorage<string>('ssm_globalBudget', ''));
  const [revealAtDate, setRevealAtDate] = useState<string>(() => loadFromStorage<string>('ssm_revealAtDate', ''));
  const [revealAtTime, setRevealAtTime] = useState<string>(() => loadFromStorage<string>('ssm_revealAtTime', ''));
  const [shareableLinks, setShareableLinks] = useState<{ master: string; participants: { name: string; link: string }[] } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [duplicateNameIds, setDuplicateNameIds] = useState<Set<string>>(new Set());

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem('ssm_participants', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('ssm_exclusions', JSON.stringify(exclusions)); }, [exclusions]);
  useEffect(() => { localStorage.setItem('ssm_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('ssm_eventDetails', eventDetails); }, [eventDetails]);
  useEffect(() => { localStorage.setItem('ssm_globalBudget', globalBudget); }, [globalBudget]);
  useEffect(() => { localStorage.setItem('ssm_revealAtDate', revealAtDate); }, [revealAtDate]);
  useEffect(() => { localStorage.setItem('ssm_revealAtTime', revealAtTime); }, [revealAtTime]);


  useEffect(() => {
    fetch('/templates.json')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data: BackgroundOption[]) => {
        setBackgroundOptions(data);
        if (data.length > 1) setBackground(data[1].id);
        else if (data.length > 0) setBackground(data[0].id);
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
    if ((matches || shareableLinks) && !isGenerating) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [matches, shareableLinks, isGenerating]);
  
  const handleGenerateMatches = () => {
    setError('');
    const validParticipants = participants.filter((p: Participant) => p.name.trim() !== '');

    const nameCounts = new Map<string, string[]>();
    validParticipants.forEach(p => {
        const name = p.name.trim().toLowerCase();
        if (!nameCounts.has(name)) nameCounts.set(name, []);
        nameCounts.get(name)!.push(p.id);
    });

    const duplicates = new Map<string, string[]>();
    const dupIds = new Set<string>();
    for (const [name, ids] of nameCounts.entries()) {
        if (ids.length > 1) {
            duplicates.set(name, ids);
            ids.forEach(id => dupIds.add(id));
        }
    }
    
    setDuplicateNameIds(dupIds);

    if (duplicates.size > 0) {
      const dupNames = Array.from(duplicates.keys());
      setError(`Duplicate names found: ${dupNames.join(', ')}. Please ensure all names are unique.`);
      setMatches(null);
      setShareableLinks(null);
      return;
    }

    if (validParticipants.length < 2) {
      setError('Please add at least two participants with names.');
      setMatches(null);
      setShareableLinks(null);
      return;
    }
    
    if (assignments.length > validParticipants.length) {
        setError('There are more "must match" rules than participants.');
        setMatches(null);
        setShareableLinks(null);
        return;
    }

    setIsGenerating(true);
    setMatches(null);
    setShareableLinks(null);

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
      let remainingReceivers = validParticipants.filter((p: Participant) => !assignedReceiverIds.has(p.id));
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
      setMatches(generatedMatches);
      setError('');
      
      const matchesById: MatchById[] = generatedMatches.map(m => ({ g: m.giver.id, r: m.receiver.id }));
      
      let revealTimestamp: number | undefined = undefined;
      if (revealAtDate) {
          const revealDateStr = revealAtDate + 'T' + (revealAtTime || '00:00:00') + 'Z';
          const revealDate = new Date(revealDateStr);
          if (!isNaN(revealDate.getTime())) {
            revealTimestamp = revealDate.getTime();
          }
      }

      const cardStyle: CardStyle = {
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

      const exchangeData: ExchangeData = {
          p: validParticipants.map(({id, name, notes, budget}) => ({ id, name, notes, budget: budget || globalBudget })),
          m: matchesById,
          details: eventDetails,
          style: cardStyle,
          revealAt: revealTimestamp
      };

      const encodedData = encodeData(exchangeData);
      
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const masterLink = `${baseUrl}#${encodedData}`;
      const participantLinks = generatedMatches.map(match => ({
          name: match.giver.name,
          link: `${baseUrl}#${encodedData}?id=${match.giver.id}`
      }));

      setShareableLinks({ master: masterLink, participants: participantLinks });

    } else {
      setError('Could not find a valid match combination. This can happen with many exclusions, required matches, or just by chance. Please try again or simplify your rules.');
      setMatches(null);
      setShareableLinks(null);
    }
    setIsGenerating(false);
  };
  
  const handleClear = () => setShowClearConfirmation(true);
  
  const confirmClear = () => {
    setParticipants(defaultParticipants);
    setExclusions([]);
    setAssignments([]);
    setMatches(null);
    setError('');
    setEventDetails('');
    setGlobalBudget('');
    setRevealAtDate('');
    setRevealAtTime('');
    setShareableLinks(null);
    setDuplicateNameIds(new Set());

    localStorage.removeItem('ssm_participants');
    localStorage.removeItem('ssm_exclusions');
    localStorage.removeItem('ssm_assignments');
    localStorage.removeItem('ssm_eventDetails');
    localStorage.removeItem('ssm_globalBudget');
    localStorage.removeItem('ssm_revealAtDate');
    localStorage.removeItem('ssm_revealAtTime');
    
    setShowClearConfirmation(false);
    window.scrollTo(0, 0);
  };
  
  const handleBulkAdd = (names: string) => {
    const newParticipants = names.split('\n').map(name => name.trim()).filter(name => name.length > 0).map(name => ({
        id: crypto.randomUUID(), name: name, notes: '', budget: ''
    }));

    if (newParticipants.length > 0) {
        const currentParticipants = participants.filter(p => p.name.trim() !== '' || p.notes.trim() !== '' || p.budget.trim() !== '');
        setParticipants([...currentParticipants, ...newParticipants]);
    }
    setShowBulkAddModal(false);
  };

  const performPdfGeneration = async (generationFn: () => Promise<void>) => {
    let loadingTimer: number | null = null;
    try {
      loadingTimer = window.setTimeout(() => setIsPdfLoading(true), 500);
      await generationFn();
    } catch (err) {
      console.error("PDF Generation failed:", err);
      setError("Sorry, something went wrong while generating the PDF. Please try again.");
    } finally {
      if (loadingTimer) clearTimeout(loadingTimer);
      setIsPdfLoading(false);
    }
  };


  const handleDownload = async (type: 'cards' | 'list') => {
      if (!matches) return;
      setError('');
      if (!greetingText.includes('{secret_santa}')) {
          setError("The Greeting text must include {secret_santa} so the giver's name appears. Please add it back before downloading.");
          return;
      }

      await performPdfGeneration(async () => {
        if (type === 'cards') {
            await generateIndividualCardsPdf({ 
                matches, eventDetails, backgroundOptions, backgroundId: background, customBackground, 
                textColor, useTextOutline, outlineColor, outlineSize, fontSizeSetting, fontTheme,
                lineSpacing, greetingText, introText, wishlistLabelText
            });
        }
        if (type === 'list') {
            generateMasterListPdf({ matches, eventDetails, exchangeDate: revealAtDate, exchangeTime: revealAtTime });
        }
      });
  };

  const handleCopyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
        setCopiedLink(link);
        setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  return (
    <>
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
            <p className="text-gray-600 mb-6 ml-11">Include event details or prevent people from drawing each other.</p>
            <Options 
              participants={participants.filter(p => p.name.trim() !== '')} 
              exclusions={exclusions} setExclusions={setExclusions} 
              assignments={assignments} setAssignments={setAssignments}
              eventDetails={eventDetails} setEventDetails={setEventDetails} 
              globalBudget={globalBudget} setGlobalBudget={setGlobalBudget}
              revealAtDate={revealAtDate} setRevealAtDate={setRevealAtDate}
              revealAtTime={revealAtTime} setRevealAtTime={setRevealAtTime}
            />
          </div>
          
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Style Your Cards & Links
            </h2>
             <p className="text-gray-600 mb-6 ml-11">Choose a theme and colors for the reveal pages and printable cards.</p>
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
                 {isGenerating ? 'Generating...' : '🎁 Generate Secret Santa Links'}
               </button>
            )}
          </div>

          {(matches && shareableLinks) && (
            <div ref={resultsRef} className="pt-4 space-y-8">
              <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center">Your Links are Ready!</h2>
                <p className="text-gray-600 mb-6 text-center max-w-2xl mx-auto">Share the private links with each person. They won't see other matches. Use the Master Link yourself to see all matches.</p>
                <div className="space-y-4 max-w-3xl mx-auto">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h3 className="font-semibold text-amber-900 mb-2 text-lg">Your Master Link (Organizer Only)</h3>
                        <div className="flex items-center gap-2 flex-wrap"><input type="text" readOnly value={shareableLinks.master} className="flex-grow p-2 border border-amber-300 bg-white rounded-md text-sm text-gray-700" /><button onClick={() => handleCopyToClipboard(shareableLinks.master)} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors">{copiedLink === shareableLinks.master ? <CheckIcon /> : <CopyIcon />}{copiedLink === shareableLinks.master ? 'Copied' : 'Copy'}</button></div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-2 text-lg">Participant Links</h3>
                        <div className="space-y-2 border rounded-lg p-2 bg-slate-50">
                        {shareableLinks.participants.map(({ name, link }) => (
                            <div key={link} className="flex items-center justify-between flex-wrap gap-2 bg-white p-3 rounded-md border">
                                <span className="font-semibold text-slate-700">{name}</span>
                                <div className="flex items-center gap-2"><input type="text" readOnly value={link} className="w-48 sm:w-64 p-2 border border-gray-300 rounded-md text-sm text-gray-500" onClick={(e) => (e.target as HTMLInputElement).select()} /><button onClick={() => handleCopyToClipboard(link)} className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors">{copiedLink === link ? <CheckIcon /> : <CopyIcon />}{copiedLink === link ? 'Copied' : 'Copy'}</button></div>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
              </div>
              <ResultsDisplay matches={matches} />
              
              <div className="p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                    <div className="mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                    <h3 className="text-3xl font-bold font-serif mb-2">Download Your Files</h3>
                    <p className="text-green-100 max-w-xs mb-6 text-lg">You can also download printable cards or a master list for offline use.</p>
                    <div className="flex gap-4">
                        <button onClick={() => handleDownload('cards')} className="bg-white text-green-700 font-bold py-3 px-6 text-lg rounded-full shadow-md transform hover:scale-105 hover:shadow-xl hover:bg-gray-100 transition-all flex items-center gap-2">Cards</button>
                        <button onClick={() => handleDownload('list')} className="bg-white text-green-700 font-bold py-3 px-6 text-lg rounded-full shadow-md transform hover:scale-105 hover:shadow-xl hover:bg-gray-100 transition-all flex items-center gap-2">List</button>
                    </div>
                </div>
                <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl text-white text-center flex flex-col items-center justify-center">
                    <div className="mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg></div>
                    <h3 className="text-3xl font-bold font-serif mb-2">Share the Fun!</h3>
                    <p className="text-orange-100 max-w-xs mb-6 text-lg">Enjoying this free tool? Help spread the holiday cheer!</p>
                    <ShareButtons participantCount={participants.length} />
                </div>
            </div>
          )}
        </main>
      </div>
      
      {isPdfLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="text-white text-center">
            <svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-xl font-semibold mt-4">Generating your PDF...</p>
            <p className="text-sm opacity-80">This may take a moment for custom images.</p>
          </div>
        </div>
      )}

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
    </>
  );
}

export default GeneratorPage;
