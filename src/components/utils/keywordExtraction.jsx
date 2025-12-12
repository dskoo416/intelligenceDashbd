// Deterministic keyword extraction utility

const ENGLISH_STOPWORDS = new Set([
  'the', 'and', 'with', 'from', 'into', 'over', 'after', 'before', 'about',
  'more', 'most', 'some', 'any', 'this', 'that', 'these', 'those', 'its',
  'their', 'they', 'them', 'we', 'you', 'your', 'our', 'new', 'said', 'says',
  'say', 'will', 'may', 'can', 'could', 'should', 'would', 'also', 'including',
  'amid', 'first', 'another', 'year', 'years', 'million', 'billion', 'percent',
  'report', 'figure', 'data', 'series', 'update', 'updates', 'has', 'have',
  'had', 'been', 'being', 'are', 'was', 'were', 'for', 'not', 'but', 'what',
  'all', 'when', 'where', 'who', 'which', 'how', 'why', 'out', 'than', 'then',
  'now', 'only', 'see', 'get', 'make', 'know', 'take', 'come', 'use', 'find',
  'give', 'tell', 'work', 'call', 'try', 'ask', 'need', 'feel', 'become', 'leave',
  'put', 'mean', 'keep', 'let', 'begin', 'seem', 'help', 'show', 'hear', 'play',
  'run', 'move', 'like', 'live', 'believe', 'hold', 'bring', 'happen', 'write',
  'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set',
  'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create',
  'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer',
  'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send',
  'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain'
]);

const JUNK_TOKENS = new Set([
  'imgproxy', 'webp', 'rsquo', 'nbsp', 'div', 'span', 'href', 'https', 'http',
  'cdn', 'jpeg', 'jpg', 'png', 'gif', 'mp4', 'pdf', 'click', 'read', 'more',
  'report', 'figure', 'table', 'image', 'photo', 'video', 'link', 'src', 'alt',
  'title', 'class', 'width', 'height', 'style', 'amp', 'rss', 'feed', 'utm',
  'www', 'com', 'net', 'org', 'html', 'xml', 'json', 'api', 'img', 'svg'
]);

const SECTOR_KEYWORDS = {
  'Advanced Materials': [
    'lithium', 'graphite', 'rare earths', 'cathode', 'anode', 'electrolyte',
    'separator', 'nickel', 'cobalt', 'manganese', 'recycling', 'refining',
    'mining', 'supply chain', 'materials', 'mineral', 'ore', 'processing'
  ],
  'Battery': [
    'battery', 'batteries', 'bess', 'cells', 'gigafactory', 'lfp', 'nmc',
    'charge', 'charging', 'range', 'grid', 'storage', 'energy storage',
    'battery pack', 'cell manufacturing', 'battery technology'
  ],
  'Petrochemical': [
    'naphtha', 'ethylene', 'propylene', 'crackers', 'polyethylene', 'refinery',
    'spreads', 'margins', 'crude', 'downstream', 'upstream', 'petrochemical',
    'chemical', 'polymer', 'plastics', 'feedstock'
  ],
  'Pharmaceutical': [
    'fda', 'trial', 'phase', 'drug', 'therapy', 'approval', 'patent', 'clinical',
    'biotech', 'oncology', 'medicine', 'pharmaceutical', 'treatment', 'vaccine',
    'biosimilar', 'generic', 'prescription'
  ]
};

function normalizeText(text) {
  if (!text) return '';
  
  // Lowercase
  let normalized = text.toLowerCase();
  
  // Remove URLs and query params
  normalized = normalized.replace(/https?:\/\/[^\s]+/g, ' ');
  normalized = normalized.replace(/www\.[^\s]+/g, ' ');
  
  // Remove file extensions
  normalized = normalized.replace(/\.(jpg|jpeg|png|gif|webp|pdf|mp4|svg|html|xml|json)/g, ' ');
  
  // Remove HTML entities
  normalized = normalized.replace(/&[a-z]+;/g, ' ');
  
  // Replace punctuation with spaces
  normalized = normalized.replace(/[^\w\s]/g, ' ');
  
  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

function isValidToken(token) {
  // Length check
  if (token.length < 3) return false;
  
  // Contains digits
  if (/\d/.test(token)) return false;
  
  // Stopwords
  if (ENGLISH_STOPWORDS.has(token)) return false;
  
  // Junk tokens
  if (JUNK_TOKENS.has(token)) return false;
  
  // Contains junk patterns
  const junkPatterns = ['http', 'www', '.com', 'utm_', 'amp', 'rss', 'feed'];
  if (junkPatterns.some(pattern => token.includes(pattern))) return false;
  
  return true;
}

function stemToken(token) {
  // Remove possessive 's
  if (token.endsWith("'s")) {
    return token.slice(0, -2);
  }
  
  // Simple plural removal for tokens > 4 chars
  if (token.length > 4 && token.endsWith('s') && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }
  
  return token;
}

function extractBigrams(tokens) {
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

export function extractKeywordsFromArticles(articles, options = {}) {
  const {
    topN = 30,
    sectorName = null,
    strictSectorTerms = false,
    includeWords = [],
    excludeWords = []
  } = options;
  
  // Combine all article text
  const allText = articles.map(article => {
    const title = article.title || '';
    const desc = article.description || article.summary || article.snippet || '';
    return `${title} ${desc}`;
  }).join(' ');
  
  // Normalize
  const normalized = normalizeText(allText);
  
  // Tokenize
  const rawTokens = normalized.split(/\s+/);
  
  // Filter and stem tokens
  const tokens = rawTokens
    .filter(isValidToken)
    .map(stemToken)
    .filter(token => !excludeWords.includes(token));
  
  // Count unigrams
  const unigramCounts = {};
  tokens.forEach(token => {
    unigramCounts[token] = (unigramCounts[token] || 0) + 1;
  });
  
  // Extract and count bigrams
  const bigrams = extractBigrams(tokens);
  const bigramCounts = {};
  bigrams.forEach(bigram => {
    bigramCounts[bigram] = (bigramCounts[bigram] || 0) + 1;
  });
  
  // Merge bigrams with unigrams (prefer bigrams with count >= 2)
  const allKeywords = {};
  
  // Add significant bigrams first
  Object.entries(bigramCounts).forEach(([bigram, count]) => {
    if (count >= 2) {
      allKeywords[bigram] = count;
    }
  });
  
  // Add unigrams
  Object.entries(unigramCounts).forEach(([word, count]) => {
    // Skip if this word is part of a significant bigram
    const partOfBigram = Object.keys(allKeywords).some(bigram => 
      bigram.split(' ').includes(word)
    );
    
    if (!partOfBigram) {
      allKeywords[word] = count;
    }
  });
  
  // Apply sector filtering
  let filteredKeywords = { ...allKeywords };
  
  if (sectorName && SECTOR_KEYWORDS[sectorName]) {
    const sectorTerms = SECTOR_KEYWORDS[sectorName];
    
    if (strictSectorTerms) {
      // Only keep keywords that match or contain sector terms
      filteredKeywords = {};
      Object.entries(allKeywords).forEach(([keyword, count]) => {
        const matches = sectorTerms.some(term => 
          keyword.includes(term.toLowerCase()) || term.toLowerCase().includes(keyword)
        );
        if (matches) {
          filteredKeywords[keyword] = count;
        }
      });
    } else {
      // Boost sector terms
      Object.entries(filteredKeywords).forEach(([keyword, count]) => {
        const matches = sectorTerms.some(term => 
          keyword.includes(term.toLowerCase()) || term.toLowerCase().includes(keyword)
        );
        if (matches) {
          filteredKeywords[keyword] = count * 2; // Boost by 2x
        }
      });
    }
  }
  
  // Apply include words filter
  if (includeWords.length > 0) {
    const temp = {};
    Object.entries(filteredKeywords).forEach(([keyword, count]) => {
      const matches = includeWords.some(inc => keyword.includes(inc.toLowerCase()));
      if (matches) {
        temp[keyword] = count;
      }
    });
    filteredKeywords = temp;
  }
  
  // Sort and take top N
  const sortedKeywords = Object.entries(filteredKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
  
  return sortedKeywords;
}

export { SECTOR_KEYWORDS };