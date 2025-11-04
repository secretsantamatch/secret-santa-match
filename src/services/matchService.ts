import type { Participant, Exclusion, Assignment, Match } from '../types';

export const generateMatches = (
    participants: Participant[],
    exclusions: Exclusion[],
    assignments: Assignment[]
): { matches: Match[] | null, error: string | null } => {
    
    const validParticipants = participants.filter(p => p.name.trim() !== '');
    if (validParticipants.length < 3) {
        return { matches: null, error: "You need at least 3 participants to start a gift exchange." };
    }

    let matches: Match[] = [];
    const maxRetries = 100;

    for (let i = 0; i < maxRetries; i++) {
        let givers = [...validParticipants];
        let receivers = [...validParticipants];
        let tempMatches: Match[] = [];
        let possible = true;

        // Handle assignments first
        const assignedGiverIds = new Set(assignments.map(a => a.giverId));
        const assignedReceiverIds = new Set(assignments.map(a => a.receiverId));

        for (const assignment of assignments) {
            const giver = givers.find(p => p.id === assignment.giverId);
            const receiver = receivers.find(p => p.id === assignment.receiverId);
            if (giver && receiver) {
                tempMatches.push({ giver, receiver });
            }
        }

        givers = givers.filter(p => !assignedGiverIds.has(p.id));
        receivers = receivers.filter(p => !assignedReceiverIds.has(p.id));

        // Shuffle remaining receivers
        receivers.sort(() => Math.random() - 0.5);

        for (const giver of givers) {
            let foundMatch = false;
            for (let j = 0; j < receivers.length; j++) {
                const receiver = receivers[j];
                const isSelf = giver.id === receiver.id;
                const isExcluded = exclusions.some(ex =>
                    (ex.p1 === giver.id && ex.p2 === receiver.id) ||
                    (ex.p1 === receiver.id && ex.p2 === giver.id)
                );
                
                if (!isSelf && !isExcluded) {
                    tempMatches.push({ giver, receiver });
                    receivers.splice(j, 1);
                    foundMatch = true;
                    break;
                }
            }

            if (!foundMatch) {
                possible = false;
                break;
            }
        }
        
        if (possible && tempMatches.length === validParticipants.length) {
            matches = tempMatches;
            break;
        }
    }

    if (matches.length !== validParticipants.length) {
        return { matches: null, error: "Could not generate valid matches with the current rules. Try removing some exclusions or assignments." };
    }

    return { matches, error: null };
};
