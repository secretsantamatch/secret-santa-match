import React, { useState } from 'react';
import type { Participant, Exclusion, Assignment } from '../types';

interface OptionsProps {
    participants: Participant[];
    exclusions: Exclusion[];
    setExclusions: (exclusions: Exclusion[]) => void;
    assignments: Assignment[];
    setAssignments: (assignments: Assignment[]) => void;
    eventDetails: string;
    setEventDetails: (details: string) => void;
}

const Options: React.FC<OptionsProps> = ({
    participants,
    exclusions,
    setExclusions,
    assignments,
    setAssignments,
    eventDetails,
    setEventDetails,
}) => {
    const [exclusionP1, setExclusionP1] = useState<string>('');
    const [exclusionP2, setExclusionP2] = useState<string>('');
    const [assignmentGiver, setAssignmentGiver] = useState<string>('');
    const [assignmentReceiver, setAssignmentReceiver] = useState<string>('');
    const [error, setError] = useState<string>('');

    const getParticipantName = (id: string) => participants.find(p => p.id === id)?.name || 'Unknown';

    const handleAddExclusion = () => {
        setError('');
        if (!exclusionP1 || !exclusionP2) {
            setError('Please select two participants for the exclusion.');
            return;
        }
        if (exclusionP1 === exclusionP2) {
            setError('A participant cannot be excluded from themselves.');
            return;
        }
        const exists = exclusions.some(ex => 
            (ex.p1 === exclusionP1 && ex.p2 === exclusionP2) ||
            (ex.p1 === exclusionP2 && ex.p2 === exclusionP1)
        );
        if (!exists) {
            setExclusions([...exclusions, { p1: exclusionP1, p2: exclusionP2 }]);
        }
        setExclusionP1('');
        setExclusionP2('');
    };

    const handleRemoveExclusion = (p1: string, p2: string) => {
        setExclusions(exclusions.filter(ex => 
            !((ex.p1 === p1 && ex.p2 === p2) || (ex.p1 === p2 && ex.p2 === p1))
        ));
    };
    
    const handleAddAssignment = () => {
        setError('');
        if (!assignmentGiver || !assignmentReceiver) {
            setError('Please select a giver and a receiver for the assignment.');
            return;
        }
        if (assignmentGiver === assignmentReceiver) {
            setError('A participant cannot be assigned to themselves.');
            return;
        }
        const giverExists = assignments.some(a => a.giverId === assignmentGiver);
        const receiverExists = assignments.some(a => a.receiverId === assignmentReceiver);
        
        if (giverExists) {
            setError(`${getParticipantName(assignmentGiver)} is already assigned as a giver.`);
            return;
        }
        if (receiverExists) {
             setError(`${getParticipantName(assignmentReceiver)} is already assigned as a receiver.`);
            return;
        }
        
        setAssignments([...assignments, { giverId: assignmentGiver, receiverId: assignmentReceiver }]);
        setAssignmentGiver('');
        setAssignmentReceiver('');
    };
    
    const handleRemoveAssignment = (giverId: string) => {
        setAssignments(assignments.filter(a => a.giverId !== giverId));
    };

    return (
        <div className="space-y-8">
            {error && <p className="text-red-600 bg-red-50 p-3 rounded-md text-sm">{error}</p>}
            
            <div>
                <label htmlFor="event-details" className="block text-lg font-semibold text-slate-700 mb-2">Event Details</label>
                <textarea
                    id="event-details"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="e.g., Gift exchange at the annual holiday party on Dec 20th. Budget: $25."
                    value={eventDetails}
                    onChange={(e) => setEventDetails(e.target.value)}
                    rows={3}
                />
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Exclusions (Optional)</h3>
                <p className="text-slate-500 mb-4 text-sm">Prevent certain people from being matched together.</p>
                <div className="flex flex-wrap items-center gap-2 mb-4 p-4 bg-slate-50 rounded-lg border">
                    <select value={exclusionP1} onChange={e => setExclusionP1(e.target.value)} className="p-2 border rounded-md flex-1 min-w-[120px] bg-white" aria-label="Select first person for exclusion">
                        <option value="">Select Person 1</option>
                        {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <span className="font-semibold text-slate-500 flex-shrink-0">can't draw</span>
                    <select value={exclusionP2} onChange={e => setExclusionP2(e.target.value)} className="p-2 border rounded-md flex-1 min-w-[120px] bg-white" aria-label="Select second person for exclusion">
                         <option value="">Select Person 2</option>
                         {participants.filter(p => p.id !== exclusionP1).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={handleAddExclusion} className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex-shrink-0" aria-label="Add exclusion rule">+</button>
                </div>
                <div className="space-y-2">
                    {exclusions.map((ex, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-100 p-2 rounded-md text-sm">
                           <span><strong>{getParticipantName(ex.p1)}</strong> and <strong>{getParticipantName(ex.p2)}</strong> can't be matched.</span>
                           <button onClick={() => handleRemoveExclusion(ex.p1, ex.p2)} className="text-red-500 hover:text-red-700 font-bold text-xl px-2" aria-label={`Remove exclusion between ${getParticipantName(ex.p1)} and ${getParticipantName(ex.p2)}`}>&times;</button>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                 <h3 className="text-lg font-semibold text-slate-700 mb-2">Assignments (Optional)</h3>
                <p className="text-slate-500 mb-4 text-sm">Force a specific person to be another's Secret Santa.</p>
                <div className="flex flex-wrap items-center gap-2 mb-4 p-4 bg-slate-50 rounded-lg border">
                    <select value={assignmentGiver} onChange={e => setAssignmentGiver(e.target.value)} className="p-2 border rounded-md flex-1 min-w-[120px] bg-white" aria-label="Select giver for assignment">
                        <option value="">Select Giver</option>
                        {participants.filter(p => !assignments.some(a => a.giverId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <span className="font-semibold text-slate-500 flex-shrink-0">must draw</span>
                    <select value={assignmentReceiver} onChange={e => setAssignmentReceiver(e.target.value)} className="p-2 border rounded-md flex-1 min-w-[120px] bg-white" aria-label="Select receiver for assignment">
                         <option value="">Select Receiver</option>
                         {participants.filter(p => p.id !== assignmentGiver && !assignments.some(a => a.receiverId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={handleAddAssignment} className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex-shrink-0" aria-label="Add assignment rule">+</button>
                </div>
                <div className="space-y-2">
                    {assignments.map((a, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-100 p-2 rounded-md text-sm">
                           <span><strong>{getParticipantName(a.giverId)}</strong> will be the Secret Santa for <strong>{getParticipantName(a.receiverId)}</strong>.</span>
                           <button onClick={() => handleRemoveAssignment(a.giverId)} className="text-red-500 hover:text-red-700 font-bold text-xl px-2" aria-label={`Remove assignment for ${getParticipantName(a.giverId)}`}>&times;</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Options;
