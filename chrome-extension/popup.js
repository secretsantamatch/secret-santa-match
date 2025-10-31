document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name-input');
    const notesInput = document.getElementById('notes-input');
    const budgetInput = document.getElementById('budget-input');
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const participantListDiv = document.getElementById('participant-list');
    const addToGeneratorBtn = document.getElementById('add-to-generator-btn');
    const clearListBtn = document.getElementById('clear-list-btn');
    
    let participants = [];

    // Load participants from storage on popup open
    chrome.storage.local.get(['ssm_participants_temp'], (result) => {
        if (result.ssm_participants_temp) {
            participants = result.ssm_participants_temp;
            renderParticipants();
        }
    });

    const renderParticipants = () => {
        if (participants.length === 0) {
            participantListDiv.innerHTML = '<div class="empty-state">Your participants will appear here.</div>';
            addToGeneratorBtn.disabled = true;
        } else {
            participantListDiv.innerHTML = '';
            participants.forEach((p, index) => {
                const item = document.createElement('div');
                item.className = 'participant-item';
                item.innerHTML = `<span class="participant-name">${p.name}</span><button class="remove-btn" data-index="${index}">&times;</button>`;
                participantListDiv.appendChild(item);
            });
            addToGeneratorBtn.disabled = false;
        }
    };

    const saveParticipants = () => {
        chrome.storage.local.set({ ssm_participants_temp: participants });
    };

    const addParticipant = () => {
        const name = nameInput.value.trim();
        if (name) {
            participants.push({
                id: crypto.randomUUID(),
                name,
                notes: notesInput.value.trim(),
                budget: budgetInput.value.trim()
            });
            nameInput.value = '';
            notesInput.value = '';
            budgetInput.value = '';
            renderParticipants();
            saveParticipants();
            sendGAEvent('add_participant');
            nameInput.focus();
        }
    };

    addParticipantBtn.addEventListener('click', addParticipant);
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addParticipant();
        }
    });

    participantListDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const index = e.target.getAttribute('data-index');
            participants.splice(index, 1);
            renderParticipants();
            saveParticipants();
        }
    });

    clearListBtn.addEventListener('click', () => {
        participants = [];
        renderParticipants();
        saveParticipants();
        sendGAEvent('clear_list');
    });

    addToGeneratorBtn.addEventListener('click', () => {
        if (participants.length > 0) {
            chrome.storage.local.set({ ssm_participants: participants }, () => {
                chrome.tabs.create({ url: 'https://secretsantamatch.com/generator.html' });
                // Clear the temp list after sending
                participants = [];
                saveParticipants();
                sendGAEvent('add_to_generator', { participant_count: participants.length });
                window.close(); // Close the popup
            });
        }
    });

    // Initial render
    renderParticipants();
});
