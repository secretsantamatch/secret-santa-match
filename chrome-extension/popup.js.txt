document.getElementById('add-button').addEventListener('click', () => {
  const namesInput = document.getElementById('names');
  const addButton = document.getElementById('add-button');

  // Filter out blank lines and trim whitespace
  const names = namesInput.value
    .split('\n')
    .map(name => name.trim())
    .filter(name => name)
    .join('\n');

  if (names) {
    // Disable button and provide feedback
    addButton.disabled = true;
    addButton.textContent = 'Copied! Opening...';
    addButton.classList.add('success');

    chrome.storage.local.set({ ssm_extension_names: names }, () => {
      chrome.tabs.create({ url: 'https://secretsantamatch.com/generator.html' });
      // Close the popup after a short delay
      setTimeout(() => window.close(), 500);
    });
  }
});
