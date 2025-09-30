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
  setEventDetails: React.Dispatch<React.SetStateAction<string>>;
  // FIX: Add exchangeDate props
  exchangeDate: string;
  setExchangeDate: React.Dispatch<React.SetStateAction<string>>;
}

const XIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const RightArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
);

const NoMatchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const Options: React.FC<OptionsProps> = ({ participants, exclusions, setExclusions, assignments, setAssignments, eventDetails, setEventDetails, exchangeDate, setExchangeDate }) => {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [exclusionError, setExclusionError] = useState('');
  const [pendingExclusion, setPendingExclusion] = useState<Exclusion | null>(null);

  const [mustMatchGiver, setMustMatchGiver] = useState('');
  const [mustMatchReceiver, setMustMatchReceiver] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  
  const getParticipantName = (id: string) => participants.find(p => p.id === id)?.name || 'Unknown';

  const handleAddExclusion = () => {
    setExclusionError('');
    if (!p1 || !p2) { setExclusionError('Please select two participants.'); return; }
    if (p1 === p2) { setExclusionError('A participant cannot be excluded from themselves.'); return; }
    const isAlreadyAssigned = assignments.some(a => (a.giverId === p1 && a.receiverId === p2) || (a.giverId === p2 && a.receiverId === p1));
    if (isAlreadyAssigned) { setExclusionError('A "must match" rule exists for these participants. Please remove it first.'); return; }
    const exists = exclusions.some(ex => (ex.p1 === p1 && ex.p2 === p2) || (ex.p1 === p2 && ex.p2 === p1));
    if (exists) { setExclusionError('This exclusion already exists.'); return; }
    setPendingExclusion({ p1, p2 });
  };
  
  const confirmExclusion = () => {
    if (pendingExclusion) { setExclusions(prev => [...prev, pendingExclusion]); setPendingExclusion(null); setP1(''); setP2(''); }
  };

  const removeExclusion = (index: number) => { setExclusions(prev => prev.filter((_, i) => i !== index)); };
  
  const availableP2 = participants.filter(p => {
    if (!p1 || p.id === p1) return false;
    const isAlreadyExcluded = exclusions.some(ex => (ex.p1 === p1 && ex.p2 === p.id) || (ex.p1 === p.id && ex.p2 === p1));
    if (isAlreadyExcluded) return false;
    const hasMustMatchConflict = assignments.some(a => (a.giverId === p1 && a.receiverId === p.id) || (a.giverId === p.id && a.receiverId === p1));
    if (hasMustMatchConflict) return false;
    return true;
  });

  const handleAddAssignment = () => {
      setAssignmentError('');
      if (!mustMatchGiver || !mustMatchReceiver) { setAssignmentError('Please select a giver and a receiver.'); return; }
      if (mustMatchGiver === mustMatchReceiver) { setAssignmentError('A participant cannot be assigned to themselves.'); return; }
      const isExcluded = exclusions.some(ex => (ex.p1 === mustMatchGiver && ex.p2 === mustMatchReceiver) || (ex.p1 === mustMatchReceiver && ex.p2 === mustMatchGiver));
      if (isExcluded) { setAssignmentError('An exclusion rule exists for these participants. Please remove it first.'); return; }
      setAssignments(prev => [...prev, { giverId: mustMatchGiver, receiverId: mustMatchReceiver }]);
      setMustMatchGiver(''); setMustMatchReceiver('');
  };

  const removeAssignment = (index: number) => { setAssignments(prev => prev.filter((_, i) => i !== index)); };
  
  const assignedGiverIds = new Set(assignments.map(a => a.giverId));
  const assignedReceiverIds = new Set(assignments.map(a => a.receiverId));
  const availableGivers = participants.filter(p => !assignedGiverIds.has(p.id));
  const availableReceivers = participants.filter(p => {
      if (!mustMatchGiver || p.id === mustMatchGiver || assignedReceiverIds.has(p.id)) return false;
      const isExcluded = exclusions.some(ex => (ex.p1 === mustMatchGiver && ex.p2 === p.id) || (ex.p2 === mustMatchGiver && ex.p1 === p.id));
      if (isExcluded) return false;
      return true;
  });


  return (
    <div className="space-y-6 p-4 bg-gray-50 rounded-lg border">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-gray-800">Event Details</h3>
          <Tooltip text="This note will appear on each participant's card." />
        </div>
        <textarea
            value={eventDetails}
            onChange={(e) => setEventDetails(e.target.value)}
            rows={2}
            placeholder="e.g., Exchange at the holiday party on Dec 20th!"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-gray-800">Exchange Date</h3>
          <Tooltip text="The date the gift exchange will happen. After this date, participants can see the full list of matches." />
        </div>
        <input
            type="date"
            value={exchangeDate}
            onChange={(e) => setExchangeDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"
        />
      </div>
      
      <div className="pt-6 border-t">
        <div className="flex items-center gap-2 mb-2"><h3 className="font-semibold text-gray-800">Set a Specific Match</h3><Tooltip text="Use this to set a specific gift assignment, e.g., 'Alice' MUST be the Secret Santa for 'Bob'." /></div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <select value={mustMatchGiver} onChange={e => {setMustMatchGiver(e.target.value); setMustMatchReceiver('')}} className="w-full p-2 border border-gray-300 rounded-md"><option value="">Select giver</option>{availableGivers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <div className="relative group flex-shrink-0"><div className="bg-gray-100 rounded-md h-10 w-10 flex items-center justify-center border border-gray-300"><RightArrowIcon /></div><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">Must give to<div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div></div></div>
            <select value={mustMatchReceiver} onChange={e => setMustMatchReceiver(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" disabled={!mustMatchGiver}><option value="">Select receiver</option>{availableReceivers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <button onClick={handleAddAssignment} className="w-full sm:w-auto bg-slate-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-500 transition">Add</button>
        </div>
        {assignmentError && <p className="text-red-500 text-sm mt-2">{assignmentError}</p>}
        {assignments.length > 0 && <div className="mt-4"><h4 className="font-semibold text-sm text-gray-600 mb-2">Current Required Matches:</h4><ul className="space-y-1">{assignments.map((a, i) => <li key={i} className="flex justify-between items-center bg-white p-2 rounded-md border text-sm"><span><strong>{getParticipantName(a.giverId)}</strong> gives to <strong>{getParticipantName(a.receiverId)}</strong></span><button onClick={() => removeAssignment(i)} className="text-gray-400 hover:text-red-600"><XIcon className="h-4 w-4" /></button></li>)}</ul></div>}
      </div>

      <div className="pt-6 border-t">
        <div className="flex items-center gap-2 mb-2"><h3 className="font-semibold text-gray-800">Add Drawing Restrictions</h3><Tooltip text="Use this to prevent specific matches, e.g., 'Mom' cannot be matched with 'Dad'." /></div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <select value={p1} onChange={e => { setP1(e.target.value); setP2(''); }} className="w-full p-2 border border-gray-300 rounded-md"><option value="">Select person 1</option>{participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <div className="relative group flex-shrink-0"><div className="bg-gray-100 rounded-md h-10 w-10 flex items-center justify-center border border-gray-300"><NoMatchIcon /></div><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">Cannot match<div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div></div></div>
          <select value={p2} onChange={e => setP2(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" disabled={!p1}><option value="">Select person 2</option>{availableP2.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <button onClick={handleAddExclusion} className="w-full sm:w-auto bg-slate-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-500 transition">Add</button>
        </div>
        {exclusionError && <p className="text-red-500 text-sm mt-2">{exclusionError}</p>}
      </div>

      {pendingExclusion && <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center space-y-3"><p className="font-semibold text-amber-800">Confirm: <span className="font-bold">{getParticipantName(pendingExclusion.p1)}</span> and <span className="font-bold">{getParticipantName(pendingExclusion.p2)}</span> will not draw each other.</p><div className="flex justify-center gap-4"><button onClick={confirmExclusion} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-4 rounded-md text-sm">Confirm</button><button onClick={() => setPendingExclusion(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-1 px-4 rounded-md text-sm">Cancel</button></div></div>}
      {exclusions.length > 0 && <div><h4 className="font-semibold text-sm text-gray-600 mb-2">Current Exclusions:</h4><ul className="space-y-1">{exclusions.map((ex, i) => <li key={i} className="flex justify-between items-center bg-white p-2 rounded-md border text-sm"><span><strong>{getParticipantName(ex.p1)}</strong> & <strong>{getParticipantName(ex.p2)}</strong> will not draw each other</span><button onClick={() => removeExclusion(i)} className="text-gray-400 hover:text-red-600"><XIcon className="h-4 w-4" /></button></li>)}</ul></div>}
    </div>
  );
};

export default Options;
