function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

async function updateUI() {
    await resetDailyUsageIfNewDay();
    const usage = await getStorageData(STORAGE_KEYS.DAILY_USAGE, 0);
    const limit = await getStorageData(STORAGE_KEYS.DAILY_LIMIT, DEFAULT_LIMIT);

    document.getElementById('usageTime').textContent = formatTime(usage);
    document.getElementById('limitText').textContent = `Limit: ${formatTime(limit)}`;

    const percentage = Math.min((usage / limit) * 100, 100);
    document.getElementById('progressFill').style.width = `${percentage}%`;

    if (percentage >= 100) {
        document.getElementById('progressFill').style.background = '#ff0000';
    } else if (percentage >= 80) {
        document.getElementById('progressFill').style.background = '#ffa500';
    } else {
        document.getElementById('progressFill').style.background = '#4caf50';
    }
}

document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

// Update every second while popup is open
setInterval(updateUI, 1000);
updateUI();
