import React, { useState } from 'react';

const faqData = [
  {
    question: "How does the Secret Santa generator work?",
    answer: "It's simple! 1. Enter the names of all participants. 2. Add any optional details like a budget, gift ideas, or rules (like preventing couples from drawing each other). 3. Click 'Generate Matches'. The tool will then randomly and anonymously assign each person someone to buy a gift for.",
    answerText: "It's simple! 1. Enter the names of all participants. 2. Add any optional details like a budget, gift ideas, or rules (like preventing couples from drawing each other). 3. Click 'Generate Matches'. The tool will then randomly and anonymously assign each person someone to buy a gift for."
  },
  {
    question: "How can I share the results with my group?",
    answer: "You have three great options! 1) **Share Links (Recommended):** After generating, you get a unique, private link for each person. Just copy and send it via text, WhatsApp, etc. It's 100% private and requires no emails. 2) **Send Emails:** If you've collected emails, you can send the results directly to each person's inbox. 3) **Download Printables:** You can download and print beautiful, themed gift tags for each person to hand out.",
    answerText: "You have three great options! 1) Share Links (Recommended): After generating, you get a unique, private link for each person. Just copy and send it via text, WhatsApp, etc. It's 100% private and requires no emails. 2) Send Emails: If you've collected emails, you can send the results directly to each person's inbox. 3) Download Printables: You can download and print beautiful, themed gift tags for each person to hand out."
  },
  {
    question: "Can I set rules or prevent people from drawing each other?",
    answer: "Absolutely! Under 'Add Details & Rules', you can set exclusions to prevent specific people from being matched (for example, partners or family members). You can also set 'Required Matches' to ensure one person must draw another, though this should be used carefully.",
    answerText: "Absolutely! Under 'Add Details & Rules', you can set exclusions to prevent specific people from being matched (for example, partners or family members). You can also set 'Required Matches' to ensure one person must draw another, though this should be used carefully."
  },
  {
    question: "What's the difference between Secret Santa and a White Elephant/Yankee Swap?",
    answer: "In Secret Santa, you are assigned a specific person to buy a thoughtful, personalized gift for. In a White Elephant or Yankee Swap, everyone brings one generic, often humorous, gift to the party. Participants then take turns choosing a gift from the pile or 'stealing' a gift someone else has already opened.",
    answerText: "In Secret Santa, you are assigned a specific person to buy a thoughtful, personalized gift for. In a White Elephant or Yankee Swap, everyone brings one generic, often humorous, gift to the party. Participants then take turns choosing a gift from the pile or 'stealing' a gift someone else has already opened."
  },
   {
    question: "What are the basic rules of Secret Santa?",
    answer: (<ol className="list-decimal list-inside space-y-1"><li>Everyone agrees on a spending limit.</li><li>The organizer enters all names into the generator.</li><li>The generator randomly assigns each person someone to buy a gift for.</li><li>You keep your assigned person a secret!</li><li>On the day of the exchange, everyone brings their wrapped gift and places it in a central spot.</li><li>Gifts are distributed and everyone enjoys the surprise!</li></ol>),
    answerText: "1. Everyone agrees on a spending limit. 2. The organizer enters all names into the generator. 3. The generator randomly assigns each person someone to buy a gift for. 4. You keep your assigned person a secret! 5. On the day of the exchange, everyone brings their wrapped gift and places it in a central spot. 6. Gifts are distributed and everyone enjoys the surprise!"
  },
];

const FaqItem: React.FC<{ faq: typeof faqData[0]; isOpen: boolean; onClick: () => void; }> = ({ faq, isOpen, onClick }) => (
  <div className="border-b border-gray-200 py-4">
    <button
      onClick={onClick}
      className="w-full flex justify-between items-center text-left text-lg font-semibold text-slate-800"
      aria-expanded={isOpen}
    >
      <span>{faq.question}</span>
      <svg className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </button>
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 pt-2' : 'max-h-0'}`}>
      <div className="text-gray-600 leading-relaxed">{faq.answer}</div>
    </div>
  </div>
);

const FaqSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answerText
            }
        }))
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl mt-12">
             <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">Frequently Asked Questions</h2>
                <div className="max-w-3xl mx-auto">
                    {faqData.map((faq, index) => (
                        <FaqItem
                            key={index}
                            faq={faq}
                            isOpen={openIndex === index}
                            onClick={() => toggleFaq(index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FaqSection;
