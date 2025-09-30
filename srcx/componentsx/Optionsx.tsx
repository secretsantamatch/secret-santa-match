import React, { useState } from 'react';
import type { Participant, Exclusion, Assignment } from '../types';
import Tooltip from './Tooltip';

interface OptionsProps {
    participants: Participant[];
    exclusions: Exclusion[];
    setExclusions: React.Dispatch<React.SetStateAction<Exclusion[]>>;
    assignments: Assignment[];
    setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
    eventDetails: string;
    setEventDetails: (details: string) => void;
    exchangeDate: string;
    setExchangeDate: (date: string) => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

const Options: React.FC<OptionsProps> = ({ 
    participants, exclusions, setExclusions, assignments, setAssignments, 
    eventDetails, setEventDetails, exchangeDate, setExchangeDate, isExpanded, setIsExpanded 
}) => {
  const [newExclusion, setNewExclusion] = useState<{ p1: string; p2: string }>({ p1: '', p2: '' });
  const [newAssignment, setNewAssignment] = useState<{ giverId: string; receiverId: string }>({ giverId: '', receiverId: '' });
  const [showExclusions, setShowExclusions] = useState(exclusions.length > 0);
  const [showAssignments, setShowAssignments] = useState(assignments.length > 0);

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

  const getParticipantName = (id: string) => participants.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center">
            <div className="flex items-center">
                <span className="bg-[var(--primary-color)] text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">2</span>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Add Details & Rules (Optional)</h2>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] mt-6' : 'max-h-0'}`}>
            <div className="ml-11 space-y-6">
                <div>
                    <label htmlFor="event-details" className="block text-sm font-bold text-gray-700 mb-2">Event Details</label>
                    <textarea id="event-details" rows={2} value={eventDetails} onChange={e => setEventDetails(e.target.value)} placeholder="e.g., Exchange at the holiday party on Dec 20th!" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]" />
                </div>
                <div>
                    <label htmlFor="exchange-date" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">Gift Exchange Date <Tooltip text="This is used for the 'Who Got Who?' countdown if you share results via link."/></label>
                    <input type="date" id="exchange-date" value={exchangeDate} onChange={e => setExchangeDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"/>
                </div>

                <div className="pt-4 border-t">
                    <button onClick={() => setShowExclusions(!showExclusions)} className="text-sm font-bold text-gray-700 flex items-center gap-2 hover:text-gray-900">Prevent People Drawing Each Other <Tooltip text="Useful for couples or previous winners. This creates an exclusion."/></button>
                    {showExclusions && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border space-y-3 animate-fade-in-up">
                            {exclusions.map((ex, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-white rounded-md text-sm">
                                    <span><strong>{getParticipantName(ex.p1)}</strong> and <strong>{getParticipantName(ex.p2)}</strong> will not draw each other.</span>
                                    <button onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">&times;</button>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <select value={newExclusion.p1} onChange={e => setNewExclusion({ ...newExclusion, p1: e.target.value })} className="flex-1 p-2 border border-gray-300 rounded-md"><option value="">Select Person 1</option>{participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                <span>cannot draw</span>
                                <select value={newExclusion.p2} onChange={e => setNewExclusion({ ...newExclusion, p2: e.target.value })} className="flex-1 p-2 border border-gray-300 rounded-md"><option value="">Select Person 2</option>{participants.filter(p => p.id !== newExclusion.p1).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                <button onClick={handleAddExclusion} className="bg-slate-600 text-white px-3 py-2 rounded-md hover:bg-slate-700 text-sm">Add</button>
                            </div>
                        </div>
                    )}
                </div>
                
                 <div className="pt-4 border-t">
                    <button onClick={() => setShowAssignments(!showAssignments)} className="text-sm font-bold text-gray-700 flex items-center gap-2 hover:text-gray-900">Set Required Matches <Tooltip text="Force a specific person to draw another. Use with caution!"/></button>
                    {showAssignments && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border space-y-3 animate-fade-in-up">
                            {assignments.map((a, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-white rounded-md text-sm">
                                    <span><strong>{getParticipantName(a.giverId)}</strong> MUST draw <strong>{getParticipantName(a.receiverId)}</strong>.</span>
                                    <button onClick={() => setAssignments(assignments.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">&times;</button>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <select value={newAssignment.giverId} onChange={e => setNewAssignment({ ...newAssignment, giverId: e.target.value })} className="flex-1 p-2 border border-gray-300 rounded-md"><option value="">Select Giver</option>{participants.filter(p => !assignments.some(a => a.giverId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                <span>must draw</span>
                                <select value={newAssignment.receiverId} onChange={e => setNewAssignment({ ...newAssignment, receiverId: e.target.value })} className="flex-1 p-2 border border-gray-300 rounded-md"><option value="">Select Receiver</option>{participants.filter(p => p.id !== newAssignment.giverId && !assignments.some(a => a.receiverId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                <button onClick={handleAddAssignment} className="bg-slate-600 text-white px-3 py-2 rounded-md hover:bg-slate-700 text-sm">Add</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Options;
