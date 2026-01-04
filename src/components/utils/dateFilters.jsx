/**
 * Check if a publication date is within the specified number of days
 * @param {string|null} pubDate - Publication date string
 * @param {number} daysToScan - Number of days to look back
 * @param {number} nowMs - Current timestamp in milliseconds
 * @returns {boolean} - True if within timeframe, false otherwise
 */
export function withinDays(pubDate, daysToScan, nowMs) {
  if (!pubDate) return false;
  
  try {
    const articleDate = new Date(pubDate);
    if (isNaN(articleDate.getTime())) return false;
    
    const cutoffMs = nowMs - (daysToScan * 24 * 60 * 60 * 1000);
    return articleDate.getTime() >= cutoffMs;
  } catch (e) {
    return false;
  }
}