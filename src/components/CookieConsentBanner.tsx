import React from 'react';

interface CookieConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept, onDecline }) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white p-4 z-50 shadow-lg animate-slide-up"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 id="cookie-consent-title" className="font-bold text-lg">We Value Your Privacy</h2>
          <p id="cookie-consent-description" className="text-sm text-slate-300">
            We use cookies and similar technologies for analytics, advertising (with partners like Google), and to enable features like editable wishlists. This helps us run the site and improve your experience. Read our{' '}
            <a href="/privacy-policy.html" className="underline hover:text-white font-semibold">
              Privacy Policy
            </a>.
          </p>
        </div>
        <div className="flex-shrink-0 flex gap-3">
          <button
            onClick={onDecline}
            className="px-5 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CookieConsentBanner;