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
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}>
                <div className="text-gray-600 prose">
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
                    <FaqItem question="Is this Secret Santa generator free?">
                        <p>Yes, absolutely! This tool is 100% free to use. There are no hidden fees, and you don't need to create an account or provide an email address.</p>
                    </FaqItem>
                    <FaqItem question="How does the sharing work without emails?">
                        <p>After generating matches, we create a unique, private link for each participant. As the organizer, you'll see a list of these links. Simply copy each person's link and send it to them via text, chat, or any other private messaging app. It's fast, secure, and doesn't require collecting everyone's email addresses.</p>
                    </FaqItem>
                    <FaqItem question="Is my data private and secure?">
                        <p>Yes. Your privacy is our top priority. We don't require sign-ups, so we don't store personal information like your name or email. All the event data (participant names, rules, etc.) is encoded directly into the URL you share. We don't save this information on our servers. The only person with access to all the links is the organizer.</p>
                    </FaqItem>
                    <FaqItem question="Can I prevent certain people from drawing each other?">
                        <p>Of course! In Step 2, under "Details & Rules," you can add drawing restrictions. This is perfect for preventing couples or family members from being matched together. You can add as many of these "exclusions" as you need.</p>
                    </FaqItem>
                    <FaqItem question="What happens if I make a mistake?">
                        <p>If you're the organizer, you can go back to the main page (by removing the part of the URL after the '#' symbol) to make changes and generate a new set of links. The old links will no longer be valid once you share the new ones. If you've already shared the links, it's best to let everyone know you're sending out a revised version.</p>
                    </FaqItem>
                </div>
            </div>
        </div>
    );
};

export default FaqSection;
