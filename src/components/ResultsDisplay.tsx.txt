import React from 'react';
import type { Match } from '../types';

interface ResultsDisplayProps {
  matches: Match[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ matches }) => {
  return (
    <div className="mt-10 animate-fade-in-up">
      <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">🎁 Match Results! 🎁</h2>
      
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Giver (Secret Santa)
              </th>
              <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider" aria-label="gives to"></th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Recipient
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Recipient's Notes & Budget
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matches.map(({ giver, receiver }, index) => {
              const notesAndBudget = [
                receiver.notes,
                receiver.budget ? `Budget: ${receiver.budget}` : ''
              ].filter(Boolean).join(' | ');

              return (
                <tr 
                  key={index} 
                  className="hover:bg-red-50/50 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{giver.name}</div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-center text-xl text-gray-400">
                    <span>→</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[var(--accent-dark-text)] bg-[var(--accent-lighter-bg)] px-3 py-1 rounded-full inline-block">{receiver.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {notesAndBudget || <span className="italic">No notes provided</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {matches.map(({ giver, receiver }, index) => {
           const notesAndBudget = [
                receiver.notes,
                receiver.budget ? `Budget: ${receiver.budget}` : ''
              ].filter(Boolean).join(' | ');
          return (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow border p-4 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">{giver.name}</span>
                <span className="text-lg text-gray-400">→</span>
                <span className="font-semibold text-[var(--accent-dark-text)] bg-[var(--accent-lighter-bg)] px-3 py-1 rounded-full text-right">{receiver.name}</span>
              </div>
              {notesAndBudget && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{notesAndBudget}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

       <p className="text-center text-sm text-gray-500 mt-4">This is a preview of the full list. Use the "Download PDF" button to get your printable results.</p>
    </div>
  );
};

export default ResultsDisplay;
