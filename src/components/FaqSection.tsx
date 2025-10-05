// FIX: Add missing React import and useState for accordion functionality.
import React, { useState } from 'react';

// FIX: Define the missing FaqItem component to handle accordion-style questions and answers.
interface FaqItemProps {
  question: string;
  children: React.ReactNode;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-lg font-semibold text-slate-800"
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <svg
          className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen mt-4' : 'max-h-0'}`}
      >
        <div className="text-slate-600 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};


// FIX: Correctly define the FaqSection functional component.
const FaqSection: React.FC = () => {
    return (
        <section className="py-12 bg-slate-50">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">Frequently Asked Questions</h2>
                    <div className="max-w-3xl mx-auto">
                        <FaqItem question="How do I use this Secret Santa generator?">
                            <p>It's easy! Just follow these steps:<br/>
                                1. <strong>Add Participants:</strong> Enter the names of everyone playing.<br/>
                                2. <strong>Add Rules & Styles:</strong> Set any exclusions (e.g., no couples) and customize the look of your printable cards.<br/>
                                3. <strong>Generate Matches:</strong> Click the button to instantly draw names!<br/>
                            </p>
                            <p>Once you have your matches, you can either download the printable cards for an in-person exchange or use the 'Share Private Links' button to send each person their secret match online.</p>
                        </FaqItem>
                        <FaqItem question="Is this site really free?">
                            <p>Yes, SecretSantaMatch.com is 100% free to use! The tool is supported by the generous tips from users and through affiliate links (like Amazon). If you make a purchase through an affiliate link, we may receive a small commission at no extra cost to you. This helps us keep the service free for everyone.</p>
                        </FaqItem>
                        <FaqItem question="Do I need to enter emails or sign up?">
                            <p>No, and that's one of the best features! To protect your privacy and make the process as fast as possible, we do not require any sign-ups, accounts, or email addresses. You, the organizer, are in complete control of sharing the private links with your participants.</p>
                        </FaqItem>
                        <FaqItem question="Why are the shareable links so long?">
                            <p>The links are long for your privacy! All your event data (names, matches, styles) is stored securely in the link itself, not on our servers. This means we don't see or save any of your private information. The best way to share them is to copy and paste the link into a private message or email.</p>
                        </FaqItem>
                        <FaqItem question="Is this generator just for Christmas?">
                           <p>While it's perfect for a Christmas Secret Santa, you can use it for any gift exchange! It's great for office parties, family holidays (like Hanukkah or Diwali), 'Favorite Things' parties, birthdays, or even a fun Valentine's Day gift swap. The card styling options let you create a look for any occasion.</p>
                        </FaqItem>
                         <FaqItem question="Can I prevent certain people from drawing each other?">
                            <p>Absolutely. In the "Add Details & Rules" section, you'll find an "Exclusions" feature. This allows you to create rules to prevent specific people (like couples or family members in the same household) from being matched together.</p>
                        </FaqItem>
                        <FaqItem question="What happens if I make a mistake?">
                            <p>No problem! On the organizer's results page, click the 'Make Changes or Start a New Game' button. This takes you back to the main page with all your info saved, so you can easily edit names or rules and then generate the matches again.</p>
                        </FaqItem>
                        <FaqItem question="How does the name drawing work? Is it truly random?">
                            <p>The generator uses a proven randomization algorithm to shuffle the list of receivers before assigning them to givers. It ensures that no one can be assigned to themselves and respects all the exclusion rules you set. The process is designed to be as fair and random as drawing names from a hat.</p>
                        </FaqItem>
                        <FaqItem question="Can the organizer participate in the gift exchange?">
                            <p>Yes! The organizer can and should add their own name to the list of participants. While the organizer has access to the master list of all matches, each participant (including the organizer) receives their own private link. As long as the organizer only opens their own link, their own Secret Santa assignment will remain a surprise!</p>
                        </FaqItem>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FaqSection;
