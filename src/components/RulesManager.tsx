import React from 'react';
import type { Participant, Exclusion, Assignment } from '../types';
import { X, PlusCircle, ArrowRight } from 'lucide-react';

interface RulesManagerProps {
  participants: Participant[];
  exclusions: Exclusion[];
  addExclusion: () => void;
  updateExclusion: (index: number, field: 'p1' | 'p2', value: string) => void;
  removeExclusion: (index: number) => void;
  assignments: Assignment[];
  addAssignment: () => void;
  updateAssignment: (index: number, field: 'giverId' | 'receiverId', value: string) => void;
  removeAssignment: (index: number) => void;
  eventDetails: string;
  setEventDetails: (details: string) => void;
}

const RulesManager: React.FC<RulesManagerProps> = ({
  participants,
  exclusions,
  addExclusion,
  updateExclusion,
  removeExclusion,
  assignments,
  addAssignment,
  updateAssignment,
  removeAssignment,
  eventDetails,
  setEventDetails,
}) => {

  return (
    <div className="space-y-10">
      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Event Details & Message</h3>
        <p className="text-sm text-slate-500 mb-4">Add a message for your group (e.g., event date, location, spending limit). This will appear on every participant's card.</p>
        <textarea
          value={eventDetails}
          onChange={(e) => setEventDetails(e.target.value)}
          placeholder="e.g., Gift exchange will be on Dec 24th at the office party. Spending limit is $25."
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          rows={3}
        />
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Add Exclusions (Optional)</h3>
        <p className="text-sm text-slate-500 mb-4">Prevent certain people from drawing each other (e.g., couples, last year's match).</p>
        <div className="space-y-3">
          {exclusions.map((exclusion, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-lg border">
              <select value={exclusion.p1} onChange={(e) => updateExclusion(index, 'p1', e.target.value)} className="flex-1 min-w-[150px] p-2 border rounded-md">
                <option value="">Select person</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <span className="font-semibold text-slate-500 text-sm">cannot draw</span>
              <select value={exclusion.p2} onChange={(e) => updateExclusion(index, 'p2', e.target.value)} className="flex-1 min-w-[150px] p-2 border rounded-md">
                <option value="">Select person</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={() => removeExclusion(index)} className="text-red-500 hover:text-red-700 p-2 ml-auto"><X size={18}/></button>
            </div>
          ))}
        </div>
        <button onClick={addExclusion} className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800"><PlusCircle size={20}/> Add Exclusion</button>
      </section>
      
      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Set Specific Pairs (Optional)</h3>
        <p className="text-sm text-slate-500 mb-4">Manually assign a Secret Santa to a specific person. The rest will be drawn randomly.</p>
        <div className="space-y-3">
          {assignments.map((assignment, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-lg border">
              <select value={assignment.giverId} onChange={(e) => updateAssignment(index, 'giverId', e.target.value)} className="flex-1 min-w-[150px] p-2 border rounded-md">
                <option value="">Select Giver</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ArrowRight className="h-5 w-5 text-red-500 flex-shrink-0" />
              <select value={assignment.receiverId} onChange={(e) => updateAssignment(index, 'receiverId', e.target.value)} className="flex-1 min-w-[150px] p-2 border rounded-md">
                <option value="">Select Receiver</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={() => removeAssignment(index)} className="text-red-500 hover:text-red-700 p-2 ml-auto"><X size={18}/></button>
            </div>
          ))}
        </div>
        <button onClick={addAssignment} className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800"><PlusCircle size={20}/> Add Assignment</button>
      </section>
    </div>
  );
};

export default RulesManager;