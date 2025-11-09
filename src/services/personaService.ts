// This service might be used for generating flavor text or suggestions.
// For now, a simple implementation will suffice.

const personas = [
    "Your friendly neighborhood gift-giver",
    "A holiday enthusiast with a knack for finding the perfect present",
    "An expert in the art of thoughtful gifting",
    "A festive elf with a big heart",
];

export const getRandomPersona = (): string => {
    return personas[Math.floor(Math.random() * personas.length)];
};
