import React, { useState } from 'react';

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
        <div className="text-slate-600 space-y-4 prose">
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
                        <FaqItem question="How does SecretSantaMatch.com work?">
                            <p>Our free Secret Santa generator randomly matches each person in your group to buy a gift for someone else. Enter participant names, set your preferences (like budget and exclusions), then generate matches instantly. You'll get private reveal links for each person—no sign-up or email required!</p>
                        </FaqItem>
                        <FaqItem question="Do I need to create an account or provide my email?">
                            <p>Nope! SecretSantaMatch.com is completely free with zero sign-ups, no accounts, and no email required. Just come to the site, create your exchange, and you're done in minutes.</p>
                        </FaqItem>
                         <FaqItem question="How do participants find out who they got?">
                            <p>After you generate matches, you'll receive unique private reveal links for each participant. You can share these links however you want—text message, WhatsApp, Facebook Messenger, Slack, or any messaging app. Each person clicks their link to see who they're buying for. It's that simple!</p>
                        </FaqItem>
                        <FaqItem question="Can I prevent certain people from being matched together?">
                            <p>Absolutely. In the "Add Details & Rules" section, you'll find an "Exclusions" feature. This allows you to create rules to prevent specific people (like couples or family members in the same household) from being matched together.</p>
                        </FaqItem>
                         <FaqItem question="Can I download and print the assignments instead?">
                            <p>Yes! We offer two ways to distribute matches:</p>
                            <ul>
                                <li><strong>Digital:</strong> Share private reveal links (great for remote teams or virtual exchanges).</li>
                                <li><strong>Physical:</strong> Download beautiful, printable cards—perfect for office parties or family gatherings where you want to hand out assignments in person.</li>
                            </ul>
                        </FaqItem>
                        <FaqItem question="How is this different from other Secret Santa websites?">
                           <p>Most sites require you and your friends to create an account, provide email addresses, and wait for emails to send. <strong>We are different:</strong></p>
                            <ul>
                                <li>✅ No sign-up required</li>
                                <li>✅ No emails needed</li>
                                <li>✅ Instant results</li>
                                <li>✅ Your data never touches our servers for complete privacy</li>
                            </ul>
                        </FaqItem>
                        <FaqItem question="Is my information private and secure?">
                            <p>Completely! We don't store ANY of your information on our servers. All match details are encoded in the private links themselves, which means your Secret Santa data stays between you and your participants—we never see or store it.</p>
                        </FaqItem>
                        <FaqItem question="Why are the shareable links so long?">
                            <p>The links are long for your privacy! All your event data (names, matches, styles) is stored securely in the link itself, not on our servers. This means we don't see or save any of your private information. See the next question for tips on how to share them easily!</p>
                        </FaqItem>
                        <FaqItem question="The links look messy. How can I share them more easily?">
                            <p>You have several simple options:</p>
                            <ul>
                                <li><strong>Use a link shortener:</strong> Copy a reveal link into a free service like TinyURL.com to create a shorter, cleaner link.</li>
                                <li><strong>Embed in text:</strong> Instead of sending the raw link, create clickable text. In an email or most messaging apps, you can type "Click here for your match!" and add the long URL as a hyperlink to that text.</li>
                                <li><strong>QR Codes:</strong> For in-person events, use a free online QR code generator to turn each link into a scannable code!</li>
                            </ul>
                        </FaqItem>
                        <FaqItem question="What's a good budget for a Secret Santa exchange?">
                            <p>For office or casual friend groups, a budget of <strong>$20 to $30</strong> is most common. For close family, the budget might be higher, from <strong>$50 to $100</strong>. The most important thing is to choose a budget that everyone in your group is comfortable with.</p>
                        </FaqItem>
                        <FaqItem question="How many people do I need for Secret Santa?">
                           <p>You need a minimum of <strong>3 participants</strong> for a successful exchange. There's no maximum—our generator can handle groups of any size, from a small family to a large office of 100+ people.</p>
                        </FaqItem>
                         <FaqItem question="Can I use this for remote or virtual teams?">
                            <p>Yes, it's perfect for it! Since you share private links, everyone can participate from anywhere in the world. No need to gather in person to draw names. This is the easiest way to organize a virtual gift exchange.</p>
                        </FaqItem>
                        <FaqItem question="What if someone loses their reveal link?">
                           <p>As the organizer, you keep a master list of all the matches and their reveal links. On the results page, you can easily copy and resend the link to anyone who needs it.</p>
                        </FaqItem>
                        <FaqItem question="What's the difference between Secret Santa and White Elephant?">
                            <p><strong>Secret Santa:</strong> You're assigned a specific person to buy a thoughtful gift for. Identities stay secret until the reveal.</p>
                            <p><strong>White Elephant (Yankee Swap):</strong> Everyone brings one wrapped gift. Players take turns choosing a gift from the pile or "stealing" an already-opened gift from someone else. It's more of a game with funny or strange gifts.</p>
                        </FaqItem>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FaqSection;
