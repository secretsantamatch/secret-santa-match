import React from 'react';
import { DownloadCloud } from 'lucide-react';

interface InstallPWAButtonProps {
    onClick: () => void;
}

const InstallPWAButton: React.FC<InstallPWAButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 font-semibold transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-full border"
            aria-label="Install App"
        >
            <DownloadCloud size={16} />
            Install App
        </button>
    );
};

export default InstallPWAButton;
