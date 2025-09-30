import React from 'react';
import type { Participant } from '../types';
import Tooltip from './Tooltip';

interface ParticipantManagerProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  onBulkAddClick: () => void;
  // FIX: Add duplicateNameIds to props to handle duplicate name highlighting.
  duplicateNameIds: Set<string>;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({ participants, setParticipants, onBulkAddClick, duplicateNameIds }) => {

  const handleParticipantChange = (index: number, field: keyof Omit<Participant, 'id'>, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], [field]: value };
    setParticipants(newParticipants);
  };

  const addParticipant = () => {
    setParticipants([...participants, { id: crypto.randomUUID(), name: '', notes: '', budget: '' }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 1) return;
    const newParticipants = participants.filter((_, i) => i !== index);
    setParticipants(newParticipants);
  };

  return (
    <div className="space-y-6">
      <div className="hidden sm:grid grid-cols-12 gap-x-4 text-sm font-semibold text-gray-700">
        <div className="col-span-4">Name <span className="text-[var(--primary-color)]">*</span></div>
        <div className="col-span-6 flex items-center gap-1">
            Gift Ideas / Notes
            <Tooltip text="Notes for the gift giver, like wishlist items, clothing sizes, or favorite things. These will appear on their match's printable card." />
        </div>
        <div className="col-span-1 flex items-center gap-1">
            Budget
             <Tooltip text="Set a spending limit for this person's gift. This will appear on their match's printable card." />
        </div>
      </div>

      <div className="space-y-3">
        {participants.map((participant, index) => (
            <div key={participant.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
              <div className="col-span-12 sm:col-span-4">
                <label className="sm:hidden text-xs font-semibold text-gray-600 mb-1 block">Name *</label>
                <input
                  type="text"
                  aria-label={`Name for participant ${index + 1}`}
                  placeholder="Name"
                  value={participant.name}
                  onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-offset-1 transition ${
                    duplicateNameIds.has(participant.id)
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-[var(--primary-focus-ring-color)]'
                  }`}
                />
              </div>

              <div className="col-span-12 sm:col-span-6">
                <label className="sm:hidden text-xs font-semibold text-gray-600 mb-1 block">Gift Ideas / Notes</label>
                <input
                  type="text"
                  aria-label={`Gift ideas for participant ${index + 1}`}
                  placeholder="e.g., Loves books, size M"
                  value={participant.notes}
                  onChange={(e) => handleParticipantChange(index, 'notes', e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-focus-ring-color)] transition"
                />
              </div>
              
              <div className="col-span-9 sm:col-span-1 relative">
                <label className="sm:hidden text-xs font-semibold text-gray-600 mb-1 block">Budget</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                  <input
                      type="text"
                      aria-label={`Budget for participant ${index + 1}`}
                      placeholder="25"
                      value={participant.budget}
                      onChange={(e) => handleParticipantChange(index, 'budget', e.target.value)}
                      className="w-full p-2.5 pl-7 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-focus-ring-color)] transition"
                  />
                </div>
              </div>

              <div className="col-span-3 sm:col-span-1 flex items-start sm:items-center h-full justify-end pt-1 sm:pt-0">
                  <button
                      onClick={() => removeParticipant(index)}
                      disabled={participants.length <= 1}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400 transition-colors"
                      aria-label={`Remove participant ${index + 1}`}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
              </div>
            </div>
          )
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button onClick={addParticipant} className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-base shadow-sm hover:shadow-md">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
           Add Another Person
        </button>
        <button onClick={onBulkAddClick} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-base shadow-sm hover:shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 100 2h4a1 1 0 100-2H5z" /></svg>
            Bulk Add from List
        </button>
      </div>
    </div>
  );
};

export default ParticipantManager;
