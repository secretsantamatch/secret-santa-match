import React from 'react';
import type { Match } from '../types';

interface ResultsDisplayProps {
    matches: Match[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ matches }) => {
    return (
        <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            {/* Header Row */}
            <div className="hidden md:grid grid-cols-3 gap-4 pb-4 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Secret Santa (Giver)</h3>
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Is Giving To (Receiver)</h3>
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Receiver's Details</h3>
            </div>
            {/* Match Rows */}
            <div className="divide-y divide-slate-200">
                {matches.map(({ giver, receiver }) => {
                    const hasDetails = receiver.interests || receiver.likes || receiver.dislikes || receiver.links || receiver.budget;

                    return (
                        <div key={giver.id} className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 py-4 items-start">
                            {/* Giver */}
                            <div className="font-semibold text-slate-800 text-lg pt-2">
                                <span className="md:hidden font-bold text-xs text-slate-500 uppercase tracking-wider">Giver: </span>
                                {giver.name}
                            </div>
                            {/* Receiver */}
                            <div className="my-1 md:my-0 pt-2">
                                <span className="md:hidden font-bold text-xs text-slate-500 uppercase tracking-wider mr-2">Receiver: </span>
                                <span className="bg-slate-200 text-slate-800 font-semibold py-1 px-3 rounded-full text-base">
                                    {receiver.name}
                                </span>
                            </div>
                             {/* Details */}
                            <div className="text-slate-600 text-sm space-y-2">
                                <span className="md:hidden font-bold text-xs text-slate-500 uppercase tracking-wider">Details: </span>
                                {hasDetails ? (
                                    <>
                                        {receiver.budget && <p><strong>Budget:</strong> ${receiver.budget}</p>}
                                        {receiver.interests && <p><strong>Interests:</strong> {receiver.interests}</p>}
                                        {receiver.likes && <p><strong>Likes:</strong> {receiver.likes}</p>}
                                        {receiver.dislikes && <p><strong>Dislikes:</strong> {receiver.dislikes}</p>}
                                        {receiver.links && <p className="truncate"><strong>Links:</strong> {receiver.links.split('\n')[0]}</p>}
                                    </>
                                ) : (
                                    <span className="text-slate-400 italic">No details provided</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ResultsDisplay;
