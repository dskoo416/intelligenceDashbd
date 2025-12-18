// Clean up RSS article titles for display (render-time only)
export function cleanTitle(title) {
  if (!title) return '';
  
  let cleaned = title;
  
  // Remove CDATA tags
  cleaned = cleaned.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
  
  // Remove wrapping square brackets if they wrap the full title
  cleaned = cleaned.trim();
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Trim extra whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}