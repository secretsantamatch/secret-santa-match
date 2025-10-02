import React, { useState, useEffect } from 'react';
import type { ExchangeData, Match, Participant } from '../types';
import PrintableCard from './PrintableCard';
import CountdownTimer from './CountdownTimer';

interface ResultsPageProps {
  data: ExchangeData;
  currentParticipantId: string | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ data, currentParticipantId }) => {
    const [match, setMatch] = useState<Match | null>(null);
    const [error, setError] = useState<string>('');
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        if (!currentParticipantId) {
            setError("Participant ID is missing. Please use the unique link you were given.");
            return;
        }

        const participantIndex = parseInt(currentParticipantId, 10);
        if (isNaN(participantIndex) || participantIndex < 0 || participantIndex >= data.p.length) {
            setError("Invalid participant ID. This link may be corrupted. Please ask the organizer for a new one.");
            return;
        }

        const matchData = data.m.find(m => m.g === participantIndex);
        if (!matchData) {
            setError("Could not find your match. The data in this link might be incomplete.");
            return;
        }
        
        const giverData = data.p[matchData.g];
        const receiverData = data.p[matchData.r];

        // Reconstruct Participant objects with a placeholder ID
        const giver: Participant = { ...giverData, id: `p${matchData.g}`, name: giverData.name };
        const receiver: Participant = { ...receiverData, id: `p${matchData.r}`, name: receiverData.name };

        setMatch({ giver, receiver });

    }, [data, currentParticipantId]);

    useEffect(() => {
        if (!data.rd) {
            setIsRevealed(true);
            return;
        }

        const revealDate = new Date(data.rd);
        const now = new Date();

        if (now >= revealDate) {
            setIsRevealed(true);
        } else {
            const interval = setInterval(() => {
                if (new Date() >= revealDate) {
                    setIsRevealed(true);
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [data.rd]);


    if (error) {
         return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
              <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">Link Error</h1>
              <p className="text-slate-700 text-lg">{error}</p>
              <a href="/" className="mt-8 inline-block bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                Start a New Game
              </a>
            </div>
          </div>
        );
    }

    if (!match) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p>Loading your match...</p></div>;
    }
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
            <header className="text-center mb-8">
                <a href="/" aria-label="Go to homepage">
                  <img src="/logo_64.png" alt="Santa hat logo" className="h-14 w-14 mx-auto mb-2" />
                </a>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">
                    <a href="/">Secret Santa Reveal</a>
                </h1>
            </header>
            
            <main className="w-full max-w-md">
                {isRevealed ? (
                    <div className="animate-fade-in-up">
                        <PrintableCard 
                            match={match}
                            eventDetails={data.e || ''}
                            backgroundId={data.style.backgroundId}
                            backgroundImageUrl={null} // We don't have this on the client side, style data only
                            customBackground={data.style.customBackground}
                            textColor={data.style.textColor}
                            useTextOutline={data.style.useTextOutline}
                            outlineColor={data.style.outlineColor}
                            outlineSize={data.style.outlineSize}
                            fontSizeSetting={data.style.fontSizeSetting}
                            fontTheme={data.style.fontTheme}
                            lineSpacing={data.style.lineSpacing}
                            greetingText={data.style.greetingText}
                            introText={data.style.introText}
                            wishlistLabelText={data.style.wishlistLabelText}
                        />
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border">
                        <h2 className="text-2xl font-bold text-slate-800 font-serif mb-2">It's not time yet!</h2>
                        <p className="text-slate-600 mb-6">Your Secret Santa match will be revealed on the date set by your organizer. Come back then to see who you're gifting to!</p>
                        {data.rd && <CountdownTimer targetDate={data.rd} />}
                    </div>
                )}
            </main>
            
            <footer className="text-center mt-8">
                <a href="/" className="text-sm text-slate-600 hover:text-[var(--primary-text)] font-semibold">
                    Want to create your own Secret Santa game? Click here!
                </a>
            </footer>
        </div>
    );
};

export default ResultsPage;
