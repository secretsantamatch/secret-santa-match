import type { Participant, Exclusion, Assignment, Match } from '../types';

export const generateMatches = (
    participants: Participant[],
    exclusions: Exclusion[],
    assignments: Assignment[]
): { matches: Match[] | null; error: string | null } => {
    try {
        if (participants.length < 2) {
            return { matches: null, error: "Not enough participants." };
        }

        let givers = [...participants];
        let receivers = [...participants];
        const matches: Match[] = [];

        // Handle fixed assignments first
        for (const assignment of assignments) {
            const giver = givers.find(p => p.id === assignment.giverId);
            const receiver = receivers.find(p => p.id === assignment.receiverId);

            if (!giver || !receiver) {
                return { matches: null, error: `Invalid assignment: Giver or receiver not found.` };
            }
            if (giver.id === receiver.id) {
                 return { matches: null, error: `Invalid assignment: ${giver.name} cannot be assigned to themselves.` };
            }

            matches.push({ giver, receiver });
            givers = givers.filter(p => p.id !== giver.id);
            receivers = receivers.filter(p => p.id !== receiver.id);
        }

        // Attempt to create remaining matches
        let attempts = 0;
        while (givers.length > 0 && attempts < 100) {
            // Fisher-Yates shuffle on receivers
            for (let i = receivers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
            }
            
            let possibleMatches: Match[] = [];
            let valid = true;

            for (let i = 0; i < givers.length; i++) {
                const giver = givers[i];
                const receiver = receivers[i];

                if (giver.id === receiver.id) {
                    valid = false;
                    break;
                }

                const isExcluded = exclusions.some(ex =>
                    (ex.p1 === giver.id && ex.p2 === receiver.id) ||
                    (ex.p1 === receiver.id && ex.p2 === giver.id)
                );

                if (isExcluded) {
                    valid = false;
                    break;
                }
                possibleMatches.push({ giver, receiver });
            }


            if (valid) {
                return { matches: [...matches, ...possibleMatches], error: null };
            }

            attempts++;
        }

        return { matches: null, error: "Could not find a valid matching. Try removing some exclusions or assignments." };
    } catch (e) {
        return { matches: null, error: e instanceof Error ? e.message : "An unknown error occurred during matching." };
    }
};
