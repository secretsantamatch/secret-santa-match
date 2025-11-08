import React, { useMemo } from 'react';
import type { ExchangeData, Match } from '../types';
import { getGiftPersona } from '../services/personaService';
import { trackEvent } from '../services/analyticsService';
import { Heart, ShoppingCart, ThumbsDown, Link as LinkIcon, Wallet, Gift } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                    <Heart className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-800">
                        Gift Inspiration for <span className="text-red-600">{currentMatch.receiver.name}</span>
                    </h1>
                    <p className="text-lg text-slate-600 mt-2">
                        Hey {currentMatch.giver.name}, here are some ideas to help you find the perfect gift!
                    </p>
                </div>

                {giftPersona && (
                    <div className="p-6 bg-white rounded-2xl shadow-lg border">
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                            <h3 className="font-semibold text-indigo-800">Gift-Giving Persona:</h3>
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
                                            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-full text-sm transition-colors"
                                        >
                                            <ShoppingCart size={14} /> {keyword}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-6 bg-white rounded-2xl shadow-lg border">
                    <h3 className="text-xl font-bold text-center text-slate-800 font-serif mb-4">Detailed Wishlist</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border">
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2"><Gift size={18} className="text-green-600" /> Interests, Hobbies & Likes</h4>
                            <p className="text-sm text-slate-500 mb-2">Click a tag for instant gift ideas on Amazon!</p>
                            <div className="flex flex-wrap gap-3">
                                {[...(currentMatch.receiver.interests || '').split(','), ...(currentMatch.receiver.likes || '').split(',')].map(tag => tag.trim()).filter(Boolean).map(tag => (
                                     <a
                                        key={tag}
                                        href={`https://www.amazon.com/s?k=${encodeURIComponent(tag + ' gifts')}&tag=${affiliateTag}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => handleGiftIdeaClick('interest', tag, giftPersona?.name)}
                                        className="flex-grow flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg text-base transition-colors shadow-sm"
                                    >
                                        <ShoppingCart size={16} /> {tag}
                                    </a>
                                ))}
                            </div>
                        </div>
                        
                         {currentMatch.receiver.dislikes && (
                            <div className="p-4 bg-slate-50 rounded-xl border">
                                <h4 className="font-semibold text-slate-700 flex items-center gap-2"><ThumbsDown size={18} className="text-red-600" /> Dislikes & No-Go's</h4>
                                <p className="text-slate-600 mt-1">{currentMatch.receiver.dislikes}</p>
                            </div>
                        )}

                        {currentMatch.receiver.links && (
                            <div className="p-4 bg-slate-50 rounded-xl border">
                                <h4 className="font-semibold text-slate-700 flex items-center gap-2"><LinkIcon size={18} className="text-blue-600" /> Specific Links</h4>
                                <div className="text-blue-600 hover:text-blue-800 underline mt-1 break-words">
                                    {currentMatch.receiver.links.split('\n').map((link, i) => <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block">{link}</a>)}
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-4">As an Amazon Associate, we earn from qualifying purchases. When you click on an interest or product link, we may receive a small commission at no extra cost to you. This helps keep our tool 100% free. Thank you for your support!</p>
                 </div>

                {currentMatch.receiver.budget && (
                    <div className="p-6 bg-white rounded-2xl shadow-lg border">
                        <h3 className="text-xl font-bold text-center text-slate-800 font-serif mb-4 flex items-center justify-center gap-2"><Wallet size={20} /> Interactive Budget Assistant</h3>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <a href={`https://www.amazon.com/s?k=gifts&rh=p_36%3A-${parseInt(currentMatch.receiver.budget) * 100}&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="flex-grow flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg text-base transition-colors shadow-sm">Find Gifts Under ${currentMatch.receiver.budget}</a>
                            <a href={`https://www.amazon.com/s?k=funny+gifts&rh=p_36%3A-2000&tag=${affiliateTag}`} target="_blank" rel="noopener noreferrer" className="flex-grow flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg text-base transition-colors shadow-sm">Find *Funny* Gifts Under $20</a>
                        </div>
                    </div>
                )}

                <div className="text-center mt-12">
                    <a href="/generator.html" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Organize your own Secret Santa →</a>
                </div>
            </div>
        </div>
    );
};

export default GiftIdeasPage;
