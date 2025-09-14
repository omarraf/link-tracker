chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['links'], (result) => {
        if (!result.links) {
            chrome.storage.sync.set({ links: [] });
        }
    });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.sync.get(['links'], (result) => {
        console.log('Link Tracker started with', (result.links || []).length, 'saved links');
    });
});