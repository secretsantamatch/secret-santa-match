document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name-input');
    const budgetInput = document.getElementById('budget-input');
    const notesInput = document.getElementById('notes');
    const addBtn = document.getElementById('add-participant-btn');
    const participantList = document.getElementById('participant-list');
    const emptyState = document.getElementById('empty-state');
    const sendBtn = document.getElementById('send-btn');
    const clearBtn = document.getElementById('clear-list-btn');

    let participants = [];

    const gtag = (...args) => {
        if (window.dataLayer) {
            window.dataLayer.push(args);
        }
    };

    chrome.storage.local.get(['participants'], (result) => {
        if (result.participants) {
            participants = result.participants;
            renderParticipants();
        }
    });

    const saveParticipants = () => {
        chrome.storage.local.set({ participants });
    };

    const renderParticipants = () => {
        participantList.innerHTML = '';
        if (participants.length === 0) {
            participantList.appendChild(emptyState);
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            participants.forEach((p, index) => {
                const item = document.createElement('div');
                item.className = 'participant-item';
                item.innerHTML = `
                    <span>${p.name} ${p.budget ? `($${p.budget})` : ''}</span>
                    <button data-index="${index}" class="remove-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                `;
                participantList.appendChild(item);
            });
        }
    };

    const handleAddParticipant = () => {
        const name = nameInput.value.trim();
        const budget = budgetInput.value.trim();
        const notes = notesInput.value.trim();
        if (name) {
            participants.push({ id: `ext-${Date.now()}`, name, notes, budget });
            nameInput.value = '';
            budgetInput.value = '';
            notesInput.value = '';
            saveParticipants();
            renderParticipants();
            nameInput.focus();
            gtag('event', 'extension_add_participant', { has_notes: notes.length > 0, has_budget: budget.length > 0 });
        }
    };

    addBtn.addEventListener('click', handleAddParticipant);

    participantList.addEventListener('click', (e) => {
        const target = e.target.closest('.remove-btn');
        if (target) {
            const index = parseInt(target.dataset.index, 10);
            participants.splice(index, 1);
            saveParticipants();
            renderParticipants();
        }
    });

    clearBtn.addEventListener('click', () => {
        gtag('event', 'extension_clear_list', { participant_count: participants.length });
        participants = [];
        saveParticipants();
        renderParticipants();
    });

    sendBtn.addEventListener('click', () => {
        if (participants.length === 0) {
            return;
        }
        
        gtag('event', 'extension_send_to_generator', { participant_count: participants.length });

        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        chrome.storage.local.set({ ssm_participants: participants }, () => {
            // BUG FIX: Use local URL for testing. 
            // Change this to the production URL before publishing the final version.
            const generatorUrl = 'http://localhost:5173/generator.html'; 
            // const generatorUrl = 'https://secretsantamatch.com/generator.html'; // Production URL
            
            chrome.tabs.create({ url: generatorUrl });
            
            // Clear list after sending
            participants = [];
            saveParticipants();
            
            setTimeout(() => window.close(), 500);
        });
    });

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // If name is filled, add participant. If not, maybe focus next field.
            if (nameInput.value.trim()) {
                budgetInput.focus();
            }
        }
    });

     budgetInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            notesInput.focus();
        }
    });
    
    notesInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Allow shift+enter for new lines
            e.preventDefault();
            addBtn.click();
        }
    });

    // Track when the popup is opened
    gtag('event', 'extension_popup_opened');
});
