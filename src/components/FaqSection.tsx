import React, { useState } from 'react';

interface FaqItemProps {
  question: string;
  children: React.ReactNode;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-lg font-semibold text-slate-800"
                aria-expanded={isOpen}
            >
                <span>{question}</span>
                <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] mt-4' : 'max-h-0'}`}>
                <div className="text-gray-600 prose max-w-none">
                    {children}
                </div>
            </div>
        </div>
    );
};


const FaqSection: React.FC = () => {
    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl mt-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-8 font-serif">Frequently Asked Questions</h2>
                <div className="max-w-3xl mx-auto">
                    <FaqItem question="How does this Secret Santa Generator work?">
                        <p>It's designed to be the easiest generator online! <strong>1. Add Names:</strong> Type in participant names or use the "Bulk Add" feature to paste a list. <strong>2. Set Rules (Optional):</strong> Add exclusions (e.g., couples can't draw each other), set a global budget, or even assign a specific match. <strong>3. Generate & Share:</strong> Click the generate button to get unique, private links for each person. <strong>4. Distribute:</strong> Copy and send these links to your participants via text, Slack, WhatsApp, or any messenger. They click their private link to see who they're buying for!</p>
                    </FaqItem>
                    <FaqItem question="Is this tool really free? What's the catch?">
                        <p>Yes, our Secret Santa generator is 100% free to use. There are no hidden fees, premium features, or catches. We don't require sign-ups, don't ask for emails, and never sell your data. The site is supported by small, unobtrusive ads and optional tips from generous users who find the tool helpful. Our goal is to be the best free gift exchange generator available.</p>
                    </FaqItem>
                    <FaqItem question="How is this private if there are no emails or accounts?">
                        <p>Your privacy is our top priority. All your event data—participant names, gift notes, rules, and matches—is compressed and encoded directly into the long, secure URL. <strong>We do not store any of your personal information on our servers.</strong> When someone clicks a link, the data is decoded locally in their browser. The only person with access to everyone's link is you, the organizer, giving you full control.</p>
                    </FaqItem>
                    <FaqItem question="Can I use this for occasions other than Christmas?">
                        <p>Absolutely! This tool is perfect for any gift exchange, all year round. Use it for an <strong>office gift exchange, family reunion, birthday party, Valentine's Day (Secret Cupid), or even for organizing a Yankee Swap or White Elephant</strong> game. We've included event themes like Birthday, Celebration, and Halloween to make your results page match the occasion.</p>
                    </FaqItem>
                    <FaqItem question="What's the easiest way to add a lot of names?">
                        <p>Use the "Bulk Add from List" button. This will open a window where you can paste a list of names, with each name on a new line. The tool will automatically create an entry for each person, saving you from typing them one by one. It's a huge time-saver for large groups or office parties.</p>
                    </FaqItem>
                    <FaqItem question="How do I set the same budget for everyone?">
                        <p>In the "Details & Rules" section, you'll find a "Global Budget" field. Simply enter a spending limit there, and it will automatically apply to every participant you've added. You can still override the budget for any individual person if needed.</p>
                    </FaqItem>
                    <FaqItem question="How do I prevent people from drawing each other (e.g., couples)?">
                        <p>In the "Details & Rules" section, you can add "Drawing Restrictions." Just select two people from the dropdowns who should not be matched together. The generator will guarantee they don't draw each other's names. This is perfect for couples, siblings, or keeping last year's pairings from repeating.</p>
                    </FaqItem>
                    <FaqItem question="What is the 'Big Reveal' feature?">
                        <p>The Big Reveal adds a fun final moment to your event! You can set an exchange date and time. Before that moment, participants who click their link will only see their own secret assignment. After the date and time pass, the <strong>exact same link</strong> will automatically update to show the full master list of who had who. It's a great way for everyone to find out who their Secret Santa was after the gifts have been exchanged!</p>
                    </FaqItem>
                     <FaqItem question="How customizable are the printable cards?">
                        <p>Very customizable! Before you generate your matches, you can go to the "Style Your Cards" section to: <strong>1. Choose a Theme:</strong> Pick from dozens of beautiful pre-made designs. <strong>2. Upload Your Own Image:</strong> Use a custom photo or graphic as the background. <strong>3. Customize Fonts & Colors:</strong> Change the text color, font style, and even add an outline to make sure it's perfectly readable against your background. <strong>4. Edit the Text:</strong> Change the greeting and other text on the card to match your event's tone.</p>
                    </FaqItem>
                    <FaqItem question="What happens if I make a mistake after sending the links?">
                        <p>No problem. Simply go back to the main page (click the site logo or the "Start a New Game" button), make your corrections (e.g., fix a typo, add a person), and generate a new set of links. The old links will now be invalid. It is important to let your participants know that you are sending out a new, corrected set of links to avoid confusion.</p>
                    </FaqItem>
                </div>
            </div>
        </div>
    );
};

export default FaqSection;
