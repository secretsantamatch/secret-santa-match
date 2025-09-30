import React, { useEffect } from 'react';

interface FaqItem {
    question: string;
    answer: React.ReactNode;
    answerText: string; // Plain text version for JSON-LD schema
}

const faqData: FaqItem[] = [
    {
        question: "How do I do Secret Santa without email?",
        answer: "Our generator is designed for Secret Santa without email. Simply enter participant names, generate your matches, and then download beautiful, printable cards to share with everyone. No signups or email addresses are required, making it fast, free, and private. An optional email feature is available if you choose to use it.",
        answerText: "Our generator is designed for Secret Santa without email. Simply enter participant names, generate your matches, and then download beautiful, printable cards to share with everyone. No signups or email addresses are required, making it fast, free, and private. An optional email feature is available if you choose to use it."
    },
    {
        question: "Can I email the results to participants?",
        answer: "Yes! You can now optionally add an email address for each participant. After generating matches, you'll have the option to send each person their Secret Santa assignment directly to their inbox. It’s a fast and convenient way to share the results, especially for remote groups. The tool remains 100% free and registration-free, whether you use this feature or not.",
        answerText: "Yes! You can now optionally add an email address for each participant. After generating matches, you'll have the option to send each person their Secret Santa assignment directly to their inbox. It’s a fast and convenient way to share the results, especially for remote groups. The tool remains 100% free and registration-free, whether you use this feature or not."
    },
    {
        question: "Does Secret Santa work with an odd number of people?",
        answer: "Absolutely! Our generator works perfectly with any number of participants, odd or even, as long as you have at least two people. The algorithm ensures everyone gives one gift and receives one gift, no matter the group size.",
        answerText: "Absolutely! Our generator works perfectly with any number of participants, odd or even, as long as you have at least two people. The algorithm ensures everyone gives one gift and receives one gift, no matter the group size."
    },
    {
        question: "What's the difference between Secret Santa and White Elephant?",
        answer: "In Secret Santa, you are assigned a specific person to buy a thoughtful, personalized gift for. In a White Elephant (or Yankee Swap), participants bring one generic, often humorous, gift to a central pool, and then take turns choosing or stealing gifts from others.",
        answerText: "In Secret Santa, you are assigned a specific person to buy a thoughtful, personalized gift for. In a White Elephant (or Yankee Swap), participants bring one generic, often humorous, gift to a central pool, and then take turns choosing or stealing gifts from others."
    },
    {
        question: "Can I bulk upload a list of participants?",
        answer: "Yes! To save you time, our generator includes a 'Bulk Add from List' feature. You can paste a list of all your participants at once, and the tool will automatically add them for you. This is perfect for large office or family groups.",
        answerText: "Yes! To save you time, our generator includes a 'Bulk Add from List' feature. You can paste a list of all your participants at once, and the tool will automatically add them for you. This is perfect for large office or family groups."
    },
    {
        question: "What are the basic rules of Secret Santa?",
        answer: (
            <ol className="list-decimal list-inside space-y-1">
                <li>Everyone's name goes into a pool.</li>
                <li>Each person secretly draws one name from the pool.</li>
                <li>You buy a gift for the person you drew.</li>
                <li>At the exchange, everyone reveals who their person was!</li>
                <li>Don't forget to stick to the agreed-upon budget!</li>
            </ol>
        ),
        answerText: "1. Everyone's name goes into a pool. 2. Each person secretly draws one name from the pool. 3. You buy a gift for the person you drew. 4. At the exchange, everyone reveals who their person was! 5. Don't forget to stick to the agreed-upon budget!"
    },
    {
        question: "How can I make my Secret Santa more interesting?",
        answer: "A great way to spice things up is by setting a fun theme for the gifts! Some popular ideas include 'Something You Make,' 'As Seen on TV,' 'Gifts Under $10,' or a color-themed exchange. You can add the theme details to the 'Event Details' section to have it appear on every card.",
        answerText: "A great way to spice things up is by setting a fun theme for the gifts! Some popular ideas include 'Something You Make,' 'As Seen on TV,' 'Gifts Under $10,' or a color-themed exchange. You can add the theme details to the 'Event Details' section to have it appear on every card."
    },
    {
        question: "Can I use this for holidays other than Christmas, like Halloween?",
        answer: "Yes! We call it a 'Secret Santa' generator, but it's perfect for any gift exchange. We even have built-in themes for Halloween (Secret Satan or Secret Pumpkin) and Valentine's Day (Secret Cupid). You can organize a gift swap for any occasion.",
        answerText: "Yes! We call it a 'Secret Santa' generator, but it's perfect for any gift exchange. We even have built-in themes for Halloween (Secret Satan or Secret Pumpkin) and Valentine's Day (Secret Cupid). You can organize a gift swap for any occasion."
    },
    {
        question: "Can I set rules or prevent people from drawing each other?",
        answer: "Yes, our generator makes it easy to set rules. You can add exclusions to prevent specific people from drawing each other—perfect for couples in a family gift exchange or managers and direct reports in an office secret santa. This ensures everyone gets a fun and appropriate match.",
        answerText: "Yes, our generator makes it easy to set rules. You can add exclusions to prevent specific people from drawing each other—perfect for couples in a family gift exchange or managers and direct reports in an office secret santa. This ensures everyone gets a fun and appropriate match."
    },
    {
        question: "Are the printable cards customizable?",
        answer: "Absolutely. You have full control over the look of your cards. You can change the text, choose different fonts, adjust colors, and even add a text outline for better visibility on busy backgrounds. All your edits are reflected in a live preview, so you see exactly what you'll get.",
        answerText: "Absolutely. You have full control over the look of your cards. You can change the text, choose different fonts, adjust colors, and even add a text outline for better visibility on busy backgrounds. All your edits are reflected in a live preview, so you see exactly what you'll get."
    }
];

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);


const FaqSection: React.FC = () => {
    useEffect(() => {
        const scriptId = 'faq-schema-script';
        document.getElementById(scriptId)?.remove();

        const schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(item => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item.answerText
                }
            }))
        };
        
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        script.innerHTML = JSON.stringify(schema);
        document.head.appendChild(script);

        return () => {
            document.getElementById(scriptId)?.remove();
        };
    }, []);


    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">Frequently Asked Questions about Secret Santa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {faqData.map((item, index) => (
                        <div key={index} className="p-4 border-l-4 border-[var(--primary-light-border-color)] bg-[var(--primary-light-bg-color)] rounded-r-lg">
                            <h3 className="font-semibold text-lg text-slate-800">{item.question}</h3>
                            <div className="text-gray-600 text-sm mt-1">{item.answer}</div>
                        </div>
                    ))}
                </div>
                 <div className="text-center mt-8">
                     <a href="https://blog.secretsantamatch.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--primary-text)] text-sm inline-flex items-center group">
                        Have more questions? Read our full guides on the blog <ArrowRightIcon />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FaqSection;
