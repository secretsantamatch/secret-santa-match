import React, { useState } from 'react';

// A single FAQ item component
const FaqItem = ({ question, answer }: { question: string; answer: React.ReactNode }) => {
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
          className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-3 text-gray-600 animate-fade-in-down">
          {answer}
        </div>
      )}
    </div>
  );
};

const FaqSection: React.FC = () => {
  const faqs = [
    {
      question: "Is this Secret Santa generator really free?",
      answer: <p>Yes, absolutely! Our tool is 100% free to use, with no hidden costs, sign-ups, or email requirements. We support the site through optional tips from generous users.</p>,
    },
    {
      question: "How do I prevent certain people from drawing each other?",
      answer: <p>In Step 2, under "Add Details & Rules," you can add exclusions. For example, if you add an exclusion for "Mom" and "Dad," Mom cannot draw Dad, and Dad cannot draw Mom. You can add as many exclusions as you need.</p>,
    },
    {
        question: "Does everyone need to enter their email address?",
        answer: <p>Nope! This generator is designed for privacy and simplicity. No emails or sign-ups are required. The organizer generates private links for each participant and shares them directly.</p>,
    },
    {
      question: "What happens if I have an odd number of participants?",
      answer: <p>Our generator handles any number of participants (as long as there are at least two) without any issues, including odd numbers. Everyone will be assigned a Secret Santa.</p>,
    },
    {
        question: "How does the private link sharing work?",
        answer: <p>After you generate matches, the tool creates a unique, private link for each participant. You, as the organizer, can see all the matches. You then copy each person's unique link and send it to them via text, email, or messenger. Their link will *only* reveal who they are the Secret Santa for, keeping all other matches a secret.</p>,
    }
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 text-center mb-8 font-serif">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
                <FaqItem key={index} question={faq.question} answer={faq.answer} />
            ))}
            </div>
        </div>
    </div>
  );
};

export default FaqSection;
