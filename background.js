importScripts('storage.js');

let activeTabId = null;
let startTime = null;

// Track active YouTube tab
async function checkCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (tab && tab.url && tab.url.includes('youtube.com/watch')) {
        if (activeTabId !== tab.id) {
            // Start tracking new YouTube tab
            await stopTracking();
            activeTabId = tab.id;
            startTime = Date.now();
            await logHistory(tab.url, tab.title);
        }
    } else {
        await stopTracking();
    }
}

async function stopTracking() {
    if (startTime) {
        const elapsed = Date.now() - startTime;
        await updateUsage(elapsed);
        startTime = null;
        activeTabId = null;
    }
}

async function updateUsage(elapsed) {
    await resetDailyUsageIfNewDay();

    // Track per-video duration in history
    if (activeTabId) {
        const tabs = await chrome.tabs.query({});
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab && activeTab.url) {
            await updateHistoryDuration(activeTab.url, elapsed);
        }
    }

    const currentUsage = await getStorageData(STORAGE_KEYS.DAILY_USAGE, 0);
    const newUsage = currentUsage + elapsed;
    await setStorageData(STORAGE_KEYS.DAILY_USAGE, newUsage);

    const limit = await getStorageData(STORAGE_KEYS.DAILY_LIMIT, DEFAULT_LIMIT);
    if (newUsage >= limit) {
        // Check if current tab is whitelisted
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].url) {
            const whitelisted = await isWhitelisted(tabs[0].url);
            if (!whitelisted) {
                await blockYouTube();
            }
        }
    }
}

async function updateHistoryDuration(url, elapsed) {
    const history = await getStorageData(STORAGE_KEYS.HISTORY, []);
    const item = history.find(h => h.url === url);
    if (item) {
        item.duration = (item.duration || 0) + elapsed;
        item.isWhitelisted = await isWhitelisted(url);
        await setStorageData(STORAGE_KEYS.HISTORY, history);
    }
}

async function logHistory(url, title) {
    const history = await getStorageData(STORAGE_KEYS.HISTORY, []);
    // Avoid duplicate entries if the user refreshes or navigates back/forth quickly
    if (history.length > 0 && history[0].url === url) return;

    history.unshift({
        title: title || 'YouTube Video',
        url: url,
        timestamp: new Date().toISOString()
    });

    // Keep last 100 entries
    await setStorageData(STORAGE_KEYS.HISTORY, history.slice(0, 100));
}

async function blockYouTube() {
    const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
    for (const tab of tabs) {
        const whitelisted = await isWhitelisted(tab.url);
        if (!whitelisted) {
            const blockedUrl = new URL(chrome.runtime.getURL('blocked.html'));
            blockedUrl.searchParams.set('returnUrl', tab.url);
            chrome.tabs.update(tab.id, { url: blockedUrl.toString() });
        }
    }
}

// Listen for tab changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' || changeInfo.url) {
        checkCurrentTab();
    }
});

chrome.tabs.onActivated.addListener(() => {
    checkCurrentTab();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        stopTracking();
    } else {
        checkCurrentTab();
    }
});

// Periodic check to update time while watching
chrome.alarms.create('trackingTick', { periodInMinutes: 0.1 }); // Every 6 seconds for better accuracy
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'trackingTick') {
        if (startTime) {
            const elapsed = Date.now() - startTime;
            startTime = Date.now(); // reset start time to current
            updateUsage(elapsed);
        }
    }
});

// Initial check
checkCurrentTab();
