import React from 'react';
import type { Match } from '../types';

interface ResultsDisplayProps {
  matches: Match[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ matches }) => {
  return (
    <div className="max-w-4xl mx-auto overflow-x-auto">
      <div className="bg-slate-50 rounded-lg p-4 border">
        <div className="grid grid-cols-3 gap-4 text-left font-semibold text-sm text-gray-600 uppercase tracking-wider px-4 pb-2 border-b">
          <div className="col-span-1">Secret Santa (Giver)</div>
          <div className="col-span-1">Is Giving To (Receiver)</div>
          <div className="col-span-1">Receiver's Notes & Budget</div>
        </div>
        <div className="divide-y">
          {matches.map((match, index) => (
            <div 
                key={match.giver.id} 
                className="grid grid-cols-3 gap-4 items-center p-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="col-span-1 font-semibold text-slate-800">{match.giver.name}</div>
              <div className="col-span-1">
                <span className="font-semibold text-[var(--accent-dark-text)] bg-[var(--accent-lighter-bg)] py-1 px-3 rounded-full">{match.receiver.name}</span>
              </div>
              <div className="col-span-1 text-sm text-gray-500">
                {match.receiver.notes || match.receiver.budget ? (
                  <>
                    {match.receiver.notes && <span>{match.receiver.notes}</span>}
                    {match.receiver.notes && match.receiver.budget && <span className="mx-1">|</span>}
                    {match.receiver.budget && <span>Budget: ${match.receiver.budget}</span>}
                  </>
                ) : (
                  <span className="italic">No notes provided</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
