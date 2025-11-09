import React, { useState, useEffect } from 'react';
import type { Match, Participant, BackgroundOption } from '../types';
// Fix: Renamed `parseUrl` to `parseExchangeData` to match the exported member from urlService.
import { parseExchangeData } from '../services/urlService';
import PrintableCard from './PrintableCard';
import ResultsDisplay from './ResultsDisplay';
import Header from './Header';
import Footer from './Footer';

const ResultsPage: React.FC = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [eventDetails, setEventDetails] = useState('');
    const [styleConfig, setStyleConfig] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>([]);
    
    useEffect(() => {
        fetch('/templates.json')
            .then(res => res.json())
            .then(data => setBackgroundOptions(data))
            .catch(console.error);

        const params = new URLSearchParams(window.location.search);
        const dataString = params.get('data');

        if (!dataString) {
            setError("No data found in the URL. This link may be invalid or incomplete.");
            return;
        }

        const parsedData = parseExchangeData(dataString);
        if (!parsedData) {
            setError("Could not read the data from the URL. It might be corrupted.");
            return;
        }

        const { p, m, e, c } = parsedData;
        const participantList: Participant[] = p.map((participantData: Omit<Participant, 'id' | 'wishlistId'>, index: number) => ({
            id: `p-${index}`, // Recreate a temporary ID
            wishlistId: m.find((match: any) => match.r === index)?.w,
            ...participantData,
        }));
        
        const matchList: Match[] = m.map((matchData: { g: number; r: number }) => ({
            giver: participantList[matchData.g],
            receiver: participantList[matchData.r],
        }));

        setMatches(matchList);
        setEventDetails(e);
        setStyleConfig(c);

    }, []);

    if (error) {
        return (
             <div className="bg-slate-50 min-h-screen">
                <Header />
                 <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-2xl my-12">
                     <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center">
                        <h1 className="text-3xl font-bold text-red-700">Error</h1>
                        <p className="text-slate-600 mt-4">{error}</p>
                        <a href="/generator.html" className="mt-6 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full">
                            Start a New Game
                        </a>
                    </div>
                 </main>
                <Footer />
            </div>
        );
    }

    if (!styleConfig) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="bg-slate-50">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <section className="text-center my-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 font-serif">Your Secret Santa Event!</h1>
                    <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">
                        This is your master page for the event. Bookmark it to see all matches. Individual reveal links have been provided to you, the organizer.
                    </p>
                </section>
                
                <div className="my-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-6 text-center">Master Match List</h2>
                    <ResultsDisplay matches={matches} />
                </div>

                <div className="my-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif mb-6 text-center">Printable Cards</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {matches.map(match => (
                            <PrintableCard
                                key={match.giver.id}
                                match={match}
                                eventDetails={eventDetails}
                                isNameRevealed={true}
                                backgroundOptions={backgroundOptions}
                                bgId={styleConfig.bgId}
                                bgImg={styleConfig.bgImg || null}
                                txtColor={styleConfig.txt}
                                outline={styleConfig.out}
                                outColor={styleConfig.outC}
                                outSize={styleConfig.outS}
                                fontSize={styleConfig.fontS}
                                font={styleConfig.font}
                                line={styleConfig.line}
                                greet={styleConfig.greet}
                                intro={styleConfig.intro}
                                wish={styleConfig.wish}
                            />
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ResultsPage;