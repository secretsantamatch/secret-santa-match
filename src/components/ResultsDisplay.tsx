import React from 'react';
// FIX: The types.ts file was not a module. This is resolved by providing its full content.
import type { Match } from '../types';
import { ArrowRight } from 'lucide-react';

interface ResultsDisplayProps {
    matches: Match[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ matches }) => {
    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-slate-700 text-center mb-6">All Matches</h2>
            <div className="space-y-4">
                {matches.map(({ giver, receiver }, index) => (
                    <div key={index} className="flex items-center justify-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 text-lg text-center w-2/5 truncate">{giver.name}</span>
                        <ArrowRight className="h-6 w-6 text-red-500 mx-4 flex-shrink-0" />
                        <span className="font-bold text-slate-800 text-lg text-center w-2/5 truncate">{receiver.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResultsDisplay;
