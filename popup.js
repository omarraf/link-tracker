document.addEventListener('DOMContentLoaded', function() {
    const linkInput = document.getElementById('linkInput');
    const addLinkBtn = document.getElementById('addLinkBtn');
    const saveCurrentBtn = document.getElementById('saveCurrentBtn');
    const linksList = document.getElementById('linksList');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    loadLinks();

    addLinkBtn.addEventListener('click', function() {
        const url = linkInput.value.trim();
        if (url) {
            addLink(url);
            linkInput.value = '';
        }
    });

    linkInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addLinkBtn.click();
        }
    });

    saveCurrentBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            addLink(currentTab.url, currentTab.title);
        });
    });

    copyAllBtn.addEventListener('click', function() {
        copyAllLinks();
    });

    clearAllBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete all links?')) {
            clearAllLinks();
        }
    });

    function addLink(url, title = '') {
        if (!isValidUrl(url)) {
            alert('Please enter a valid URL');
            return;
        }

        chrome.storage.sync.get(['links'], function(result) {
            const links = result.links || [];

            if (links.some(link => link.url === url)) {
                alert('This link is already saved');
                return;
            }

            const newLink = {
                id: Date.now(),
                url: url,
                title: title || extractDomain(url),
                timestamp: new Date().toISOString()
            };

            links.unshift(newLink);

            chrome.storage.sync.set({links: links}, function() {
                loadLinks();
            });
        });
    }

    function loadLinks() {
        chrome.storage.sync.get(['links'], function(result) {
            const links = result.links || [];
            displayLinks(links);
        });
    }

    function displayLinks(links) {
        if (links.length === 0) {
            linksList.innerHTML = '<p class="no-links">No links saved yet</p>';
            return;
        }

        linksList.innerHTML = links.map(link => `
            <div class="link-item">
                <div class="link-info">
                    <a href="${link.url}" target="_blank" class="link-url" title="${link.url}">
                        ${link.url}
                    </a>
                    <div class="link-title" title="${link.title}">
                        ${link.title}
                    </div>
                </div>
                <div class="link-actions">
                    <button class="link-btn copy-btn" data-url="${link.url}">Copy</button>
                    <button class="link-btn delete-btn" data-id="${link.id}">Delete</button>
                </div>
            </div>
        `).join('');

        linksList.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                copyToClipboard(this.dataset.url);
            });
        });

        linksList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteLink(parseInt(this.dataset.id));
            });
        });
    }

    function deleteLink(linkId) {
        chrome.storage.sync.get(['links'], function(result) {
            const links = result.links || [];
            const updatedLinks = links.filter(link => link.id !== linkId);

            chrome.storage.sync.set({links: updatedLinks}, function() {
                loadLinks();
            });
        });
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('Link copied!');
        }).catch(function() {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Link copied!');
        });
    }

    function copyAllLinks() {
        chrome.storage.sync.get(['links'], function(result) {
            const links = result.links || [];
            if (links.length === 0) {
                alert('No links to copy');
                return;
            }

            const allUrls = links.map(link => link.url).join('\n');
            copyToClipboard(allUrls);
        });
    }

    function clearAllLinks() {
        chrome.storage.sync.set({links: []}, function() {
            loadLinks();
        });
    }

    function isValidUrl(string) {
        try {
            const url = new URL(string.startsWith('http') ? string : 'https://' + string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (_) {
            return url;
        }
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 2000);
    }
});