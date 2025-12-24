async function loadSettings() {
    const limit = await getStorageData(STORAGE_KEYS.DAILY_LIMIT, DEFAULT_LIMIT);
    const totalMinutes = Math.floor(limit / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    document.getElementById('limitHours').value = hours;
    document.getElementById('limitMinutes').value = minutes;

    await loadHistory();
}

function formatDuration(ms) {
    if (!ms) return '0s';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
}

function formatFullTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return [hours, minutes, seconds].map(v => v.toString().padStart(2, '0')).join(':');
}

async function loadHistory() {
    const history = await getStorageData(STORAGE_KEYS.HISTORY, []);
    const container = document.getElementById('historyList');

    if (history.length === 0) {
        container.innerHTML = '<div class="no-history">No history recorded yet.</div>';
        return;
    }

    // Calculate daily stats
    let totalFocus = 0;
    let totalWhite = 0;

    container.innerHTML = history.map(item => {
        const duration = item.duration || 0;
        if (item.isWhitelisted) totalWhite += duration;
        else totalFocus += duration;

        return `
        <div class="history-item">
          <div class="history-info">
            <div style="display: flex; align-items: center;">
              <a href="${item.url}" target="_blank" class="history-title">${escapeHtml(item.title)}</a>
              ${item.isWhitelisted ? '<span class="badge badge-white">Whitelisted</span>' : ''}
              <span class="badge badge-focus">${formatDuration(duration)}</span>
            </div>
            <div class="history-meta">${new Date(item.timestamp).toLocaleString()}</div>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('focusTime').textContent = formatFullTime(totalFocus);
    document.getElementById('whiteTime').textContent = formatFullTime(totalWhite);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.getElementById('saveLimit').addEventListener('click', async () => {
    const hours = parseInt(document.getElementById('limitHours').value) || 0;
    const minutes = parseInt(document.getElementById('limitMinutes').value) || 0;

    const limitMs = (hours * 3600 + minutes * 60) * 1000;
    await setStorageData(STORAGE_KEYS.DAILY_LIMIT, limitMs);

    const successMsg = document.getElementById('saveSuccess');
    successMsg.style.display = 'block';
    setTimeout(() => successMsg.style.display = 'none', 3000);
});

document.getElementById('clearHistory').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear your YouTube history?')) {
        await setStorageData(STORAGE_KEYS.HISTORY, []);
        await loadHistory();
    }
});

loadSettings();
