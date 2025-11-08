import React, { useMemo } from 'react';
import type { ExchangeData, Match } from '../types';
import { getGiftPersona } from '../services/personaService';
import { trackEvent } from '../services/analyticsService';
import { Heart, ShoppingCart, ThumbsDown, Link as LinkIcon, Wallet, Gift, Lightbulb } from 'lucide-react';

const affiliateTag = 'secretsant09e-20';

interface GiftIdeasPageProps {
  data: ExchangeData;
  currentParticipantId: string;
}

const GiftIdeasPage: React.FC<GiftIdeasPageProps> = ({ data, currentParticipantId }) => {

    const currentMatch = useMemo(() => {
        const participantMap = new Map(data.p.map(p => [p.id, p]));
        const reconstructedMatches: Match[] = data.matches.map(m => ({
            giver: participantMap.get(m.g)!,
            receiver: participantMap.get(m.r)!,
        })).filter(m => m.giver && m.receiver);

        return reconstructedMatches.find(m => m.giver.id === currentParticipantId) || null;
    }, [data, currentParticipantId]);

    const giftPersona = useMemo(() => {
        if (currentMatch?.receiver) {
            return getGiftPersona(currentMatch.receiver);
        }
        return null;
    }, [currentMatch]);

    const handleGiftIdeaClick = (type: string, keyword: string, personaName?: string) => {
        trackEvent('click_gift_idea', {
            type, // 'persona' or 'interest'
            keyword,
            persona_name: personaName || 'N/A'
        });
    };

    if (!currentMatch) {
        return <div className="text-center p-8">Error: Could not find match data. Please check the link.</div>;
    }

    const allInterestsAndLikes = [...(currentMatch.receiver.interests || '').split(','), ...(currentMatch.receiver.likes || '').split(',')].map(tag => tag.trim()).filter(Boolean);

    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center">
                    <Heart className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-800">
                        Gift Inspiration for <span className="text-red-600">{currentMatch.receiver.name}</span>
                    </h1>
                    <p className="text-lg text-slate-600 mt-2">
                        Hey {currentMatch.giver.name}, here are some ideas to help you find the perfect gift!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {/* Main Content: Wishlist & Details */}
                    <div className="md:col-span-2 space-y-6">
                         <div className="p-6 bg-white rounded-2xl shadow-lg border">
                            <h3 className="text-xl font-bold text-slate-800 font-serif mb-4 flex items-center gap-2">
                                <Gift size={22} className="text-green-600"/>
                                Interests, Hobbies & Likes
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">Click a tag for instant gift ideas!</p>
                            {allInterestsAndLikes.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {allInterestsAndLikes.map(tag => (
                                         <a
                                            key={tag}
                                            href={`https://www.amazon.com/s?k=${encodeURIComponent(tag + ' gifts')}&tag=${affiliateTag}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => handleGiftIdeaClick('interest', tag, giftPersona?.name)}
                                            className="flex-grow flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-full text-base transition-all transform hover:scale-105 shadow-md"
                                        >
                                            <ShoppingCart size={16} /> {tag}
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">No specific interests or likes were provided.</p>
                            )}
                        </div>

                        {currentMatch.receiver.budget && (
                            <div className="p-6 bg-white rounded-2xl shadow-lg border">
                                <h3 className="text-xl font-bold text-center text-slate-800 font-serif mb-4 flex items-center justify-center gap-2"><Wallet size={20} /> Interactive Budget Assistant</h3>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <a href={`https://www.amazon.com/s?k=gifts&rh=p_36%3A-${parseInt(currentMatch.receiver.budget) * 100}&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="flex-grow flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-full text-base transition-colors shadow-md transform hover:scale-105">Find Gifts Under ${currentMatch.receiver.budget}</a>
                                    <a href={`https://www.amazon.com/s?k=funny+gifts&rh=p_36%3A-2000&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="flex-grow flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-full text-base transition-colors shadow-sm transform hover:scale-105">Find *Funny* Gifts Under $20</a>
                                </div>
                            </div>
                        )}

                         {currentMatch.receiver.dislikes && (
                            <div className="p-6 bg-white rounded-2xl shadow-lg border">
                                <h4 className="font-semibold text-slate-700 flex items-center gap-2"><ThumbsDown size={18} className="text-red-600" /> Dislikes & No-Go's</h4>
                                <p className="text-slate-600 mt-1">{currentMatch.receiver.dislikes}</p>
                            </div>
                        )}

                        {currentMatch.receiver.links && (
                            <div className="p-6 bg-white rounded-2xl shadow-lg border">
                                <h4 className="font-semibold text-slate-700 flex items-center gap-2"><LinkIcon size={18} className="text-blue-600" /> Specific Links</h4>
                                <div className="text-blue-600 hover:text-blue-800 underline mt-1 break-words">
                                    {currentMatch.receiver.links.split('\n').map((link, i) => <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block">{link}</a>)}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Sidebar: Gift Persona */}
                    {giftPersona && (
                        <div className="md:col-span-1">
                             <div className="p-6 bg-white rounded-2xl shadow-lg border sticky top-8">
                                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                                    <Lightbulb size={24} className="mx-auto text-indigo-500 mb-2"/>
                                    <h3 className="font-semibold text-indigo-800">Gifter's Persona:</h3>
                                    <p className="text-2xl font-bold text-indigo-600 font-serif my-1">{giftPersona.name}</p>
                                    <p className="text-sm text-indigo-700">{giftPersona.description}</p>
                                </div>

                                {Object.entries(giftPersona.categories).map(([category, keywords]) => (
                                    <div key={category} className="mt-4">
                                        <h4 className="font-bold text-slate-600">{category}:</h4>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {keywords.map(keyword => (
                                                <a
                                                    key={keyword}
                                                    href={`https://www.amazon.com/s?k=${encodeURIComponent(keyword)}&tag=${affiliateTag}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => handleGiftIdeaClick('persona', keyword, giftPersona.name)}
                                                    className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-3 rounded-full text-xs transition-colors"
                                                >
                                                    <ShoppingCart size={14} /> {keyword}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                 <p className="text-xs text-slate-400 text-center mt-8 max-w-2xl mx-auto">As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!</p>
                <div className="text-center mt-12">
                    <a href="/generator.html" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Organize your own Secret Santa →</a>
                </div>
            </div>
        </div>
    );
};

export default GiftIdeasPage;
