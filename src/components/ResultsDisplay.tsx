import React from 'react';
import type { Match } from '../types';

const ResultsDisplay: React.FC<{ matches: Match[] }> = ({ matches }) => {
  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-3xl md:text-4xl font-bold text-slate-800 font-serif">
          <span>🎁</span>
          <h2>Match Results!</h2>
          <span>🎁</span>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto overflow-x-auto">
        <div className="bg-slate-50 rounded-lg p-4 border">
          <div className="grid grid-cols-3 gap-4 text-left font-semibold text-sm text-gray-600 uppercase tracking-wider px-4 pb-2 border-b">
            <div className="col-span-1">Secret Santa</div>
            <div className="col-span-1">Is Giving To</div>
            <div className="col-span-1">Notes & Budget</div>
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
                  <span className="font-semibold text-green-700 bg-green-100 py-1 px-3 rounded-full">{match.receiver.name}</span>
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

      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>This is a preview of the full list. Use the action cards below to get your printable results or send them via email.</p>
      </div>

    </div>
  );
};

export default ResultsDisplay;
