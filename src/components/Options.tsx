
import React, { useState } from 'react';
import type { Participant, Exclusion, Assignment } from '../types';
import Tooltip from './Tooltip';

interface OptionsProps {
  participants: Participant[];
  exclusions: Exclusion[];
  setExclusions: (exclusions: Exclusion[]) => void;
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  eventDetails: string;
  setEventDetails: (details: string) => void;
  exchangeDate: string;
  setExchangeDate: (date: string) => void;
  exchangeTime: string;
  setExchangeTime: (time: string) => void;
  globalBudget: string;
  onGlobalBudgetChange: (budget: string) => void;
  pageTheme: string;
  setPageTheme: (theme: string) => void;
}

const Options: React.FC<OptionsProps> = ({
  participants,
  exclusions,
  setExclusions,
  assignments,
  setAssignments,
  eventDetails,
  setEventDetails,
  exchangeDate,
  setExchangeDate,
  exchangeTime,
  setExchangeTime,
  globalBudget,
  onGlobalBudgetChange,
  pageTheme,
  setPageTheme,
}) => {
  const [newExclusion, setNewExclusion] = useState<{ p1: string, p2: string }>({ p1: '', p2: '' });
  const [newAssignment, setNewAssignment] = useState<{ giverId: string, receiverId: string }>({ giverId: '', receiverId: '' });
  const [exclusionError, setExclusionError] = useState('');
  const [assignmentError, setAssignmentError] = useState('');

  const handleAddExclusion = () => {
    if (!newExclusion.p1 || !newExclusion.p2) {
      setExclusionError('Please select two different participants.');
      return;
    }
    if (newExclusion.p1 === newExclusion.p2) {
      setExclusionError('Participants cannot be excluded from themselves.');
      return;
    }
    const exists = exclusions.some(ex =>
      (ex.p1 === newExclusion.p1 && ex.p2 === newExclusion.p2) ||
      (ex.p1 === newExclusion.p2 && ex.p2 === newExclusion.p1)
    );
    if (exists) {
      setExclusionError('This exclusion already exists.');
      return;
    }
    setExclusions([...exclusions, { p1: newExclusion.p1, p2: newExclusion.p2 }]);
    setNewExclusion({ p1: '', p2: '' });
    setExclusionError('');
  };

  const handleAddAssignment = () => {
    if (!newAssignment.giverId || !newAssignment.receiverId) {
      setAssignmentError('Please select two different participants.');
      return;
    }
    if (newAssignment.giverId === newAssignment.receiverId) {
        setAssignmentError('A participant cannot be assigned to themselves.');
        return;
    }
    if (assignments.some(a => a.giverId === newAssignment.giverId)) {
        setAssignmentError('This giver has already been assigned.');
        return;
    }
    if (assignments.some(a => a.receiverId === newAssignment.receiverId)) {
        setAssignmentError('This receiver has already been assigned.');
        return;
    }
    setAssignments([...assignments, newAssignment]);
    setNewAssignment({ giverId: '', receiverId: '' });
    setAssignmentError('');
  };

  const removeExclusion = (index: number) => {
    setExclusions(exclusions.filter((_, i) => i !== index));
  };
  
  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const getParticipantName = (id: string) => participants.find(p => p.id === id)?.name || 'Unknown';

  const participantOptions = (excludeId?: string) => 
      participants
        .filter(p => p.id !== excludeId)
        .map(p => <option key={p.id} value={p.id}>{p.name}</option>);


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label htmlFor="event-details" className="block text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                Event Details
                <Tooltip text="This info will appear on the shared links and printable cards." />
            </label>
            <textarea
              id="event-details"
              rows={2}
              value={eventDetails}
              onChange={(e) => setEventDetails(e.target.value)}
              placeholder="e.g., Exchange at the holiday party on Dec 20th!"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"
            />
        </div>
        <div>
             <label htmlFor="page-theme" className="block text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                Event Theme
                <Tooltip text="Choose a visual theme for the results page that everyone will see." />
             </label>
             <select
                id="page-theme"
                value={pageTheme}
                onChange={(e) => setPageTheme(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"
             >
                <option value="default">Christmas</option>
                <option value="halloween">Halloween</option>
                <option value="valentines">Valentine's</option>
                <option value="birthday">Birthday</option>
                <option value="celebration">Celebration</option>
             </select>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="reveal-date" className="block text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  Date of Exchange
                  <Tooltip text="The date of your gift exchange. The 'Big Reveal' of who had who will happen after this date." />
              </label>
              <div className="flex gap-2">
                 <input type="date" id="reveal-date" value={exchangeDate} onChange={e => setExchangeDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md"/>
                 <input type="time" id="reveal-time" value={exchangeTime} onChange={e => setExchangeTime(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" disabled={!exchangeDate}/>
              </div>
            </div>
            <div>
              <label htmlFor="global-budget" className="block text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  Global Budget
                  <Tooltip text="Set a budget for everyone at once. You can still change individual budgets below." />
              </label>
              <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                   <input type="text" id="global-budget" value={globalBudget} onChange={e => onGlobalBudgetChange(e.target.value)} placeholder="25" className="w-full p-2 pl-7 border border-gray-300 rounded-md"/>
              </div>
            </div>
        </div>
      </div>
       <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            Set a Specific Match
            <Tooltip text="Force a specific person to draw another specific person. This is less common and can make generation harder." />
        </h3>
        {assignments.length > 0 && (
          <ul className="space-y-2">
            {assignments.map((a, index) => (
              <li key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded-md text-sm">
                <span><span className="font-semibold">{getParticipantName(a.giverId)}</span> must draw <span className="font-semibold">{getParticipantName(a.receiverId)}</span></span>
                <button onClick={() => removeAssignment(index)} className="p-1 text-gray-400 hover:text-red-600 rounded-full" aria-label="Remove assignment"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <select value={newAssignment.giverId} onChange={e => setNewAssignment({ ...newAssignment, giverId: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" aria-label="Select giver for required match">
            <option value="">Select giver...</option>
             {participants
                .filter(p => !assignments.some(a => a.giverId === p.id) && p.id !== newAssignment.receiverId)
                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)
             }
          </select>
          <span className="text-gray-600 font-semibold text-sm px-2">→</span>
          <select value={newAssignment.receiverId} onChange={e => setNewAssignment({ ...newAssignment, receiverId: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" aria-label="Select receiver for required match">
            <option value="">Select receiver...</option>
            {participants
                .filter(p => !assignments.some(a => a.receiverId === p.id) && p.id !== newAssignment.giverId)
                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)
            }
          </select>
          <button onClick={handleAddAssignment} className="w-full sm:w-auto bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-md whitespace-nowrap">Add</button>
        </div>
        {assignmentError && <p className="text-red-600 text-sm">{assignmentError}</p>}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            Add Drawing Restrictions
            <Tooltip text="Prevent certain people from drawing each other. Useful for couples or immediate family." />
        </h3>
        {exclusions.length > 0 && (
          <ul className="space-y-2">
            {exclusions.map((ex, index) => (
              <li key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded-md text-sm">
                <span><span className="font-semibold">{getParticipantName(ex.p1)}</span> cannot draw <span className="font-semibold">{getParticipantName(ex.p2)}</span> (and vice versa)</span>
                <button onClick={() => removeExclusion(index)} className="p-1 text-gray-400 hover:text-red-600 rounded-full" aria-label="Remove exclusion"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <select value={newExclusion.p1} onChange={e => setNewExclusion({ ...newExclusion, p1: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" aria-label="Select first person for exclusion">
            <option value="">Select person 1...</option>
            {participantOptions(newExclusion.p2)}
          </select>
          <span className="text-gray-600 font-semibold text-sm px-2">✕</span>
          <select value={newExclusion.p2} onChange={e => setNewExclusion({ ...newExclusion, p2: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" aria-label="Select second person for exclusion">
            <option value="">Select person 2...</option>
            {participantOptions(newExclusion.p1)}
          </select>
          <button onClick={handleAddExclusion} className="w-full sm:w-auto bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-md whitespace-nowrap">Add</button>
        </div>
        {exclusionError && <p className="text-red-600 text-sm">{exclusionError}</p>}
      </div>
    </div>
  );
};

export default Options;
