import React, { useState, useEffect, useRef } from 'react';

interface BulkAddModalProps {
  onClose: () => void;
  onConfirm: (names: string) => void;
}

const BulkAddModal: React.FC<BulkAddModalProps> = ({ onClose, onConfirm }) => {
  const [names, setNames] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 10);
    textareaRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = () => {
    onConfirm(names);
  };

  return (
    <div 
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-add-title"
    >
      <div 
        ref={modalRef} 
        onClick={e => e.stopPropagation()} 
        className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-lg w-full transition-all duration-300 ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <h2 id="bulk-add-title" className="text-2xl font-bold text-slate-800 font-serif mb-2">Bulk Add Participants</h2>
        <p className="text-gray-600 mb-4">Paste a list of names below, with each name on a new line. Blank lines will be ignored.</p>
        
        <textarea
          ref={textareaRef}
          value={names}
          onChange={e => setNames(e.target.value)}
          rows={8}
          placeholder={`Alice\nBob\nCharlie\n...`}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-focus-ring-color)]"
          aria-label="Paste list of names here"
        />

        <div className="flex justify-end gap-4 mt-6">
          <button 
            onClick={onClose} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Add Participants
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAddModal;
