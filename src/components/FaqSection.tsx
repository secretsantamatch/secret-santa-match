import React from 'react';

const FaqItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => (
    <div className="border-b border-slate-200 py-4">
        <details className="group">
            <summary className="flex justify-between items-center font-semibold text-slate-800 cursor-pointer list-none">
                <span>{question}</span>
                <span className="transition-transform transform group-open:rotate-180">
                    <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </summary>
            <div className="text-slate-600 mt-3 prose prose-sm max-w-none">
                {children}
            </div>
        </details>
    </div>
);

const FaqSection: React.FC = () => {
    return (
        <section className="my-10 md:my-16">
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-slate-800 font-serif mb-8">
                    Frequently Asked Questions
                </h2>
                <div className="max-w-3xl mx-auto">
                    <FaqItem question="Is this Secret Santa generator really free?">
                        <p>Yes, 100% free! There are no hidden fees, premium features, or limits on the number of participants. We support the site through optional tips and affiliate links for products we think you'll find useful.</p>
                    </FaqItem>
                    <FaqItem question="Do I or my friends need to sign up or provide an email?">
                        <p>No. We are the only major generator that is completely commitment-free. You don't need to create an account, and neither do your participants. We never ask for or store any email addresses or personal information on our servers for the core matching tool.</p>
                    </FaqItem>
                    <FaqItem question="How does it work without emails?">
                        <p>Instead of sending emails, our tool generates a unique, private link for each participant. As the organizer, you receive all these links and can share them with your group via text, WhatsApp, Slack, or any messaging app you prefer. This gives you full control and ensures total privacy.</p>
                    </FaqItem>
                    <FaqItem question="How is my privacy protected with the 'Living Wishlist' feature?">
                        <p>Great question! To allow wishlists to be editable, the wishlist data (likes, dislikes, etc.) must be stored on a server. However, we do this with privacy as the top priority: <strong>we do NOT store names or matches</strong> in the database. The data is stored anonymously and is only linked by a random ID. The core matching information remains private and is only stored in the URL hash, not on our servers. You can read more in our <a href="/privacy-policy.html">Privacy Policy</a>.</p>
                    </FaqItem>
                    <FaqItem question="Can I prevent people from drawing each other (e.g., couples)?">
                        <p>Absolutely! On the "Add Details & Rules" step, you can add as many exclusions as you need. This is perfect for preventing spouses, partners, or close family members from being matched together.</p>
                    </FaqItem>
                    <FaqItem question="What happens if I lose the links?">
                        <p>Because we prioritize your privacy, we don't store your group's data. This means if you lose the organizer's master link, you will need to re-run the generator. We strongly recommend bookmarking the results page or saving the organizer link in a safe place!</p>
                    </FaqItem>
                </div>
            </div>
        </section>
    );
};

export default FaqSection;