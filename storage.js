const STORAGE_KEYS = {
  DAILY_LIMIT: 'daily_limit', // in milliseconds
  DAILY_USAGE: 'daily_usage', // in milliseconds
  HISTORY: 'watch_history', // array of { title, url, timestamp, duration, isWhitelisted }
  LAST_RESET_DATE: 'last_reset_date', // string YYYY-MM-DD
  WHITELIST: 'video_whitelist' // array of video IDs
};

const DEFAULT_LIMIT = 1200000; // 20 minutes in ms

async function getStorageData(key, defaultValue) {
  const result = await chrome.storage.local.get([key]);
  return result[key] ?? defaultValue;
}

async function setStorageData(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

async function resetDailyUsageIfNewDay() {
  const today = new Date().toISOString().split('T')[0];
  const lastReset = await getStorageData(STORAGE_KEYS.LAST_RESET_DATE);

  if (lastReset !== today) {
    await setStorageData(STORAGE_KEYS.DAILY_USAGE, 0);
    await setStorageData(STORAGE_KEYS.LAST_RESET_DATE, today);
    await setStorageData(STORAGE_KEYS.WHITELIST, []);
    return true;
  }
  return false;
}

async function isWhitelisted(url) {
  try {
    const videoId = new URL(url).searchParams.get('v');
    if (!videoId) return false;
    const whitelist = await getStorageData(STORAGE_KEYS.WHITELIST, []);
    return whitelist.includes(videoId);
  } catch (e) {
    return false;
  }
}

async function addToWhitelist(url) {
  try {
    const videoId = new URL(url).searchParams.get('v');
    if (!videoId) return;
    const whitelist = await getStorageData(STORAGE_KEYS.WHITELIST, []);
    if (!whitelist.includes(videoId)) {
      whitelist.push(videoId);
      await setStorageData(STORAGE_KEYS.WHITELIST, whitelist);
    }
  } catch (e) { }
}
