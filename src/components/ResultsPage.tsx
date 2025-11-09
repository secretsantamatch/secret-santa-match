import React, { useState, useMemo, useEffect } from 'react';
import type { ExchangeData, Match } from '../types';
import Header from './Header';
import Footer from './Footer';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import ShareLinksModal from './ShareLinksModal';
import { getGiftPersona } from '../services/personaService';
import type { GiftPersona } from '../types';
import { trackEvent } from '../services/analyticsService';
// FIX: Import GoogleGenAI from @google/genai
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Gift } from 'lucide-react';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [persona, setPersona] = useState<GiftPersona | null>(null);
  const [giftIdeas, setGiftIdeas] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { p: participants, matches: matchIds, ...styleData } = data;

  const matches: Match[] = useMemo(() => matchIds.map(m => ({
    giver: participants.find(p => p.id === m.g)!,
    receiver: participants.find(p => p.id === m.r)!,
  })).filter(m => m.giver && m.receiver), [matchIds, participants]);

  const currentMatch = useMemo(() => {
    if (!currentParticipantId) return null;
    return matches.find(m => m.giver.id === currentParticipantId);
  }, [matches, currentParticipantId]);
  
  useEffect(() => {
    if (currentMatch?.receiver) {
        setPersona(getGiftPersona(currentMatch.receiver));
    }
  }, [currentMatch]);

  const handleReveal = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      trackEvent('reveal_match');
    }
  };

  const generateGiftIdeas = async () => {
    if (!currentMatch) return;
    
    if (!process.env.API_KEY) {
      setAiError("AI features are currently unavailable. The API Key is not configured.");
      trackEvent('gift_ideas_error', { reason: 'api_key_missing' });
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    trackEvent('generate_gift_ideas', { persona: persona?.name });

    try {
      // FIX: Use new GoogleGenAI class
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const { receiver } = currentMatch;
      const prompt = `
        You are a helpful and creative gift-giving assistant. Based on the following person's profile, generate 5 unique and thoughtful gift ideas.
        
        **Recipient Profile:**
        - **Name:** ${receiver.name}
        - **Interests:** ${receiver.interests || 'Not specified'}
        - **Likes:** ${receiver.likes || 'Not specified'}
        - **Dislikes:** ${receiver.dislikes || 'Not specified'}
        - **Gift Persona:** ${persona?.name || 'Not specified'}
        - **Budget:** ${receiver.budget ? `$${receiver.budget}` : styleData.eventDetails || 'Not specified'}
        
        Please provide a list of 5 gift ideas. For each idea, provide a short, one-sentence description. Format the output as a numbered list.
        Example: 
        1. **Gourmet Coffee Subscription:** A subscription box that delivers unique coffee beans from around the world each month.
      `;

      // FIX: Use ai.models.generateContent and a modern model
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      // FIX: Use the .text property to get the response text
      const text = response.text;
      
      const ideas = text.split('\n').filter(line => /^\d+\.\s*[*_]*/.test(line.trim()));
      setGiftIdeas(ideas);
    } catch (e) {
      console.error(e);
      setAiError("Sorry, couldn't generate gift ideas at the moment. Please try again later.");
      trackEvent('gift_ideas_error');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderParticipantView = () => {
    if (!currentMatch) {
      return (
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600">Participant Not Found</h2>
          <p className="text-slate-600 mt-2">The link you used might be incorrect. Please check the link or contact the organizer.</p>
        </div>
      );
    }
    
    return (
      <>
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-serif">You are a Secret Santa!</h1>
            <p className="text-lg text-slate-600 mt-2">Click the card below to reveal who you're getting a gift for.</p>
        </div>
        <PrintableCard
          match={currentMatch}
          eventDetails={styleData.eventDetails}
          isNameRevealed={isRevealed}
          onReveal={handleReveal}
          backgroundOptions={styleData.backgroundOptions}
          bgId={styleData.bgId}
          bgImg={styleData.customBackground}
          txtColor={styleData.textColor}
          outline={styleData.useTextOutline}
          outColor={styleData.outlineColor}
          outSize={styleData.outlineSize}
          fontSize={styleData.fontSizeSetting}
          font={styleData.fontTheme}
          line={styleData.lineSpacing}
          greet={styleData.greetingText}
          intro={styleData.introText}
          wish={styleData.wishlistLabelText}
        />
        {isRevealed && persona && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-center text-slate-800 font-serif mb-6 flex items-center justify-center gap-3">
              <Gift className="w-7 h-7 text-indigo-500"/>
              Gift Ideas for {currentMatch.receiver.name}
            </h2>
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 text-center">
              <p className="font-semibold text-indigo-800">Based on their interests, we think {currentMatch.receiver.name} is...</p>
              <h3 className="text-3xl font-bold text-indigo-600 my-2">{persona.name}</h3>
              <p className="text-indigo-700 text-sm max-w-lg mx-auto">{persona.description}</p>
            </div>
            
            <div className="mt-6 text-center">
              <button onClick={generateGiftIdeas} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform hover:scale-105 transition-all flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed">
                <Sparkles size={20}/>
                {isGenerating ? 'Thinking...' : 'Generate AI Gift Ideas'}
              </button>
            </div>
            
            {aiError && <p className="text-red-600 text-center mt-4">{aiError}</p>}
            
            {giftIdeas.length > 0 && (
                <div className="mt-6 space-y-3">
                    {giftIdeas.map((idea, index) => (
                        <p key={index} className="p-3 bg-slate-50 rounded-md border text-slate-700">{idea.replace(/^\d+\.\s*[*_]*/, '')}</p>
                    ))}
                </div>
            )}
          </div>
        )}
      </>
    );
  };

  const renderOrganizerView = () => (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Organizer's Master List</h1>
        <p className="text-lg text-slate-600 mt-4">Here are all the Secret Santa matches. Keep this page safe!</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
             <button onClick={() => setShowShareModal(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-colors">
                Share Links & Download Cards
            </button>
        </div>
      </div>
      <ResultsDisplay matches={matches} />
    </>
  );

  return (
    <>
      <Header />
      <div className="bg-slate-50 min-h-screen">
        <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-3xl py-12">
          {currentParticipantId ? renderParticipantView() : renderOrganizerView()}
        </main>
      </div>
      <Footer />
      {showShareModal && (
        <ShareLinksModal exchangeData={data} onClose={() => setShowShareModal(false)} />
      )}
    </>
  );
};

export default ResultsPage;
