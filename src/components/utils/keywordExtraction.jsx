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
  'www', 'com', 'net', 'org', 'html', 'xml', 'json', 'api', 'img', 'svg',
  'display', 'block', 'margin', 'auto', 'layer', 'async', 'decoding', 'loading',
  'post', 'pagetype', 'taxonomy', 'guide', 'attachment', 'thumb', 'view', 'size',
  'angle', 'every', 'driver', 'cars', 'layout', 'rendering', 'template', 'metadata',
  'slug', 'footer', 'header', 'sidebar', 'content', 'widget', 'plugin', 'module',
  'bone', 'evgo', 'exro', 'expand', 'integrated', 'nearly', 'way', 'author', 'comment', 'blog'
]);

const HARD_FIREWALL_PATTERNS = [
  /\b(align|left|right|center|margin|padding|hspace|vspace)\b/i,
  /\b(display|block|inline|target|blank)\b/i,
  /\b(post|pagetype|taxonomy|attachment|thumb|author|view|comment|guide|blog|article)\b/i,
  /\b(click|expand|auto|integrated|every|nearly|way)\b/i,
  /\b(bone|drive|driver|driving|target|product)\b/i
];

const DOMAIN_TERMS = new Set([
  'battery', 'energy', 'vehicle', 'grid', 'storage', 'lithium', 'cathode',
  'solid', 'state', 'material', 'electric', 'charging', 'network', 'cell',
  'manufacturing', 'supply', 'chain', 'recycling', 'mineral', 'refining',
  'naphtha', 'ethylene', 'propylene', 'petrochemical', 'pharmaceutical',
  'drug', 'therapy', 'clinical', 'trial', 'patent', 'fda', 'biotech'
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
  
  // Hard firewall patterns
  if (HARD_FIREWALL_PATTERNS.some(pattern => pattern.test(token))) return false;
  
  // Contains junk patterns
  const junkPatterns = ['http', 'www', '.com', 'utm_', 'amp', 'rss', 'feed'];
  if (junkPatterns.some(pattern => token.includes(pattern))) return false;
  
  return true;
}

function isValidPhrase(phrase) {
  // Apply hard firewall to phrases
  if (HARD_FIREWALL_PATTERNS.some(pattern => pattern.test(phrase))) return false;
  
  // Reject layout/rendering phrases
  if (/\b(align|display|margin|target|blank|hspace|vspace)\s+\w+/.test(phrase)) return false;
  
  // Require at least one domain term for multi-word phrases
  const words = phrase.split(' ');
  if (words.length > 1) {
    const hasDomainTerm = words.some(w => DOMAIN_TERMS.has(w));
    if (!hasDomainTerm) return false;
  }
  
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
    .filter(token => {
      // Exclude exact matches
      if (excludeWords.includes(token)) return false;
      // Exclude if token contains any exclude word
      return !excludeWords.some(exclude => token.includes(exclude.toLowerCase()));
    });
  
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
  
  // Add significant bigrams first (filter with hard firewall)
  Object.entries(bigramCounts).forEach(([bigram, count]) => {
    if (count >= 2 && isValidPhrase(bigram)) {
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
  
  // Apply include words with weighting
  if (includeWords.length > 0) {
    Object.entries(filteredKeywords).forEach(([keyword, count]) => {
      includeWords.forEach(item => {
        const word = typeof item === 'string' ? item : item.word;
        const weight = typeof item === 'string' ? 1 : (item.weight || 1);
        
        if (keyword.toLowerCase().includes(word.toLowerCase())) {
          filteredKeywords[keyword] = Math.round(count * weight);
        }
      });
    });
  }
  
  // Final firewall check and collapse variants
  const cleaned = {};
  Object.entries(filteredKeywords).forEach(([keyword, count]) => {
    // Final firewall check
    if (!isValidPhrase(keyword)) return;
    
    // Remove single-word non-domain terms under 4 chars
    if (!keyword.includes(' ') && keyword.length < 4 && !DOMAIN_TERMS.has(keyword)) return;
    
    cleaned[keyword] = count;
  });
  
  // Sort and take top N
  const sortedKeywords = Object.entries(cleaned)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
  
  return sortedKeywords;
}

export { SECTOR_KEYWORDS };