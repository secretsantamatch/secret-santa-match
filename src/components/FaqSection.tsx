import React, { useState } from 'react';

const FaqItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-slate-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-4 px-1"
                aria-expanded={isOpen}
            >
                <span className="text-lg font-semibold text-slate-800">{question}</span>
                <svg
                    className={`w-5 h-5 text-slate-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="pb-4 px-1 text-slate-600 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
};

const FaqSection: React.FC = () => {
    return (
        <section className="py-12 bg-slate-50">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
                <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">Frequently Asked Questions</h2>
                    <div className="max-w-3xl mx-auto">
                        <FaqItem question="Is this site really free?">
                            <p>Yes, SecretSantaMatch.com is 100% free to use! There are no hidden fees or charges. The tool is supported by the generous tips from users who find it helpful and through affiliate links. This means if you click on a link to a retailer (like Amazon) and make a purchase, we may receive a small commission at no extra cost to you. This helps us keep the lights on and the service free for everyone.</p>
                        </FaqItem>
                        <FaqItem question="Do I need to enter emails or sign up?">
                            <p>No, and that's one of the best features! To protect your privacy and make the process as fast as possible, we do not require any sign-ups, accounts, or email addresses. You, the organizer, are in complete control of sharing the private links with your participants.</p>
                        </FaqItem>
                        <FaqItem question="Why are the shareable links so long?">
                            <p>The links are long because all the information for your Secret Santa exchange—the names, matches, card styles, and event details—is securely compressed and stored directly within the link itself. This is a privacy feature: it means we don't store any of your personal data on our servers. Your event details are for your eyes only!</p>
                            <p className="mt-2"><strong>Tip for sharing:</strong> The best way to send these links is by copying and pasting them directly into an email, a direct message (like WhatsApp or Facebook Messenger), or any other private messaging app.</p>
                        </FaqItem>
                         <FaqItem question="Can I prevent certain people from drawing each other?">
                            <p>Absolutely. In the "Add Details & Rules" section, you'll find an "Exclusions" feature. This allows you to create rules to prevent specific people (like couples or family members in the same household) from being matched together.</p>
                        </FaqItem>
                        <FaqItem question="Does this tool work with an odd number of people?">
                            <p>Yes! The generator works perfectly with any number of participants, whether it's an even or odd number. The only requirement is that you have at least two people for a valid exchange (though three is more fun!).</p>
                        </FaqItem>
                        <FaqItem question="What happens if I make a mistake?">
                            <p>No problem! If you're the organizer and you've already generated the matches, you can simply click the "Make Changes or Start a New Game" button on the results page. This will take you back to the main setup page with all your previous information intact, so you can make edits and generate the matches again.</p>
                        </FaqItem>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FaqSection;
