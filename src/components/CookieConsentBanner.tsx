
import React from 'react';
import { isEuVisitor } from '../utils/privacy';

interface CookieConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept, onDecline }) => {
  const isEu = isEuVisitor();

  // DESIGN 1: EU VISITOR (Prominent Center Modal)
  // We need them to Opt-In, so we make it harder to ignore.
  if (isEu) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-slate-200"
            role="dialog" 
            aria-modal="true"
            aria-labelledby="eu-consent-title"
        >
            <div className="text-center mb-6">
                <div className="mx-auto bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl">
                    🍪
                </div>
                <h2 id="eu-consent-title" className="text-xl font-bold text-slate-800 font-serif">
                    Privacy Preference
                </h2>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                    We use cookies to analyze traffic and improve your experience. Under GDPR, we need your consent to collect this anonymous data.
                </p>
            </div>
            
            <div className="flex flex-col gap-3">
                <button
                    onClick={onAccept}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-transform active:scale-95 shadow-md"
                >
                    Accept & Continue
                </button>
                <button
                    onClick={onDecline}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors"
                >
                    Decline (Essential Only)
                </button>
            </div>
            <p className="text-center mt-4 text-xs text-slate-400">
                Read our <a href="/privacy-policy.html" className="underline hover:text-slate-600">Privacy Policy</a>.
            </p>
        </div>
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
            }
        `}</style>
      </div>
    );
  }

  // DESIGN 2: US/GLOBAL VISITOR (Subtle Bottom Banner)
  // We are already tracking (Opt-Out), so we keep it low profile.
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white p-4 z-50 shadow-lg animate-slide-up"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 id="cookie-consent-title" className="font-bold text-lg">
            We Use Cookies
          </h2>
          <p id="cookie-consent-description" className="text-sm text-slate-300">
            By using our site, you acknowledge that we use cookies to analyze traffic and personalize content.
            {' '}Read our <a href="/privacy-policy.html" className="underline hover:text-white font-semibold">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex-shrink-0 flex gap-3">
          <button
            onClick={onDecline}
            className="px-5 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors"
          >
            Opt-Out
          </button>
          <button
            onClick={onAccept}
            className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold transition-colors"
          >
            Got it
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
