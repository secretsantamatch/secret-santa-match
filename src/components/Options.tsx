import React, { useState, useMemo } from 'react';
import type { Participant, Exclusion, Assignment } from '../types';
import Tooltip from './Tooltip';

export interface OptionsProps {
  participants: Participant[];
  exclusions: Exclusion[];
  setExclusions: React.Dispatch<React.SetStateAction<Exclusion[]>>;
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  eventDetails: string;
  setEventDetails: (details: string) => void;
  globalBudget: string;
  setGlobalBudget: (budget: string) => void;
  exchangeDate: string;
  setExchangeDate: (date: string) => void;
  revealTime: string;
  setRevealTime: (time: string) => void;
  pageTheme: string;
  setPageTheme: (theme: string) => void;
}

const Options: React.FC<OptionsProps> = ({ 
  participants, 
  exclusions, setExclusions,
  assignments, setAssignments,
  eventDetails, setEventDetails,
  globalBudget, setGlobalBudget,
  exchangeDate, setExchangeDate,
  revealTime, setRevealTime,
  pageTheme, setPageTheme
}) => {

  const [newExclusion, setNewExclusion] = useState<{ p1: string; p2: string }>({ p1: '', p2: '' });
  const [newAssignment, setNewAssignment] = useState<{ giverId: string; receiverId: string }>({ giverId: '', receiverId: '' });

  const participantMap = useMemo(() => new Map(participants.map(p => [p.id, p.name])), [participants]);

  const handleAddExclusion = () => {
    if (newExclusion.p1 && newExclusion.p2 && newExclusion.p1 !== newExclusion.p2) {
      if (!exclusions.some(ex => (ex.p1 === newExclusion.p1 && ex.p2 === newExclusion.p2) || (ex.p1 === newExclusion.p2 && ex.p2 === newExclusion.p1))) {
        setExclusions([...exclusions, newExclusion]);
      }
      setNewExclusion({ p1: '', p2: '' });
    }
  };

  const handleAddAssignment = () => {
    if (newAssignment.giverId && newAssignment.receiverId && newAssignment.giverId !== newAssignment.receiverId) {
        if (!assignments.some(a => a.giverId === newAssignment.giverId || a.receiverId === newAssignment.receiverId)) {
            setAssignments([...assignments, newAssignment]);
        }
      setNewAssignment({ giverId: '', receiverId: '' });
    }
  };
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label htmlFor="event-details" className="block text-sm font-medium text-gray-700 mb-1">Event Details</label>
            <textarea
            id="event-details"
            rows={2}
            value={eventDetails}
            onChange={(e) => setEventDetails(e.target.value)}
            placeholder="e.g., Exchange at the holiday party on Dec 20th!"
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-focus-ring-color)]"
            />
        </div>
        <div>
            <label htmlFor="event-theme" className="block text-sm font-medium text-gray-700 mb-1">Event Theme</label>
            <select
              id="event-theme"
              value={pageTheme}
              onChange={e => setPageTheme(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-focus-ring-color)]"
            >
              <option value="christmas">Christmas</option>
              <option value="birthday">Birthday</option>
              <option value="celebration">Celebration</option>
              <option value="halloween">Halloween</option>
              <option value="valentines">Valentine's Day</option>
            </select>
        </div>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
                <label htmlFor="reveal-date" className="block text-sm font-medium text-gray-700 mb-1">Date of Exchange</label>
                <input 
                    id="reveal-date"
                    type="date"
                    min={today}
                    value={exchangeDate}
                    onChange={(e) => setExchangeDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
            </div>
            <div>
                <label htmlFor="reveal-time" className="block text-sm font-medium text-gray-700 mb-1">Reveal Time</label>
                <input 
                    id="reveal-time"
                    type="time"
                    value={revealTime}
                    onChange={(e) => setRevealTime(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                    disabled={!exchangeDate}
                />
            </div>
            <div>
                 <label htmlFor="global-budget" className="block text-sm font-medium text-gray-700 mb-1">Global Budget</label>
                 <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                   <input
                        id="global-budget"
                        type="text"
                        value={globalBudget}
                        onChange={(e) => setGlobalBudget(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="25"
                        className="w-full p-2.5 pl-7 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-focus-ring-color)] transition"
                    />
                 </div>
            </div>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-1">
            Set a Specific Match
            <Tooltip text="Force a specific person to be the Secret Santa for someone else. Use this sparingly as it can make generating matches difficult." />
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <select value={newAssignment.giverId} onChange={e => setNewAssignment({ ...newAssignment, giverId: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md text-sm"><option value="">Select giver</option>{participants.filter(p => !assignments.some(a => a.giverId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <button className="p-2 bg-gray-100 rounded-md" aria-label="Assign to">&rarr;</button>
            <select value={newAssignment.receiverId} onChange={e => setNewAssignment({ ...newAssignment, receiverId: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md text-sm"><option value="">Select receiver</option>{participants.filter(p => p.id !== newAssignment.giverId && !assignments.some(a => a.receiverId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <button onClick={handleAddAssignment} className="bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-800">Add</button>
          </div>
           <div className="space-y-1 mt-3">
            {assignments.map((a, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-md text-sm">
                <span>{participantMap.get(a.giverId) || '?'} &rarr; {participantMap.get(a.receiverId) || '?'}</span>
                <button onClick={() => setAssignments(assignments.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-1">
            Add Drawing Restrictions
            <Tooltip text="Prevent certain people from drawing each other, for example, couples or members of the same family." />
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <select value={newExclusion.p1} onChange={e => setNewExclusion({ ...newExclusion, p1: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md text-sm"><option value="">Select person 1</option>{participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <button className="p-2 bg-gray-100 rounded-md" aria-label="Cannot draw">&times;</button>
            <select value={newExclusion.p2} onChange={e => setNewExclusion({ ...newExclusion, p2: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md text-sm"><option value="">Select person 2</option>{participants.filter(p => p.id !== newExclusion.p1).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <button onClick={handleAddExclusion} className="bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-800">Add</button>
          </div>
          <div className="space-y-1 mt-3">
            {exclusions.map((ex, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-md text-sm">
                <span>{participantMap.get(ex.p1) || '?'} &ne; {participantMap.get(ex.p2) || '?'}</span>
                <button onClick={() => setExclusions(exclusions.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Options;
