const express = require('express');
const crypto = require('crypto');
const { rateLimits, auditLogger } = require('../../../backend/middleware/toolSecurity');

const router = express.Router();

// Password Generator endpoint
router.post('/generate', rateLimits.toolExecution, async (req, res) => {
  try {
    const {
      length = 12,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = false,
      excludeAmbiguous = false,
      customCharacters = '',
      count = 1
    } = req.body;

    if (length < 4 || length > 128) {
      return res.status(400).json({
        error: 'Password length must be between 4 and 128 characters'
      });
    }

    if (count < 1 || count > 100) {
      return res.status(400).json({
        error: 'Password count must be between 1 and 100'
      });
    }

    auditLogger.log('password_generate_start', {
      length,
      count,
      options: { includeUppercase, includeLowercase, includeNumbers, includeSymbols }
    });

    const passwords = [];
    
    for (let i = 0; i < count; i++) {
      const password = generateSecurePassword({
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar,
        excludeAmbiguous,
        customCharacters
      });
      
      const strength = calculatePasswordStrength(password);
      
      passwords.push({
        password,
        strength,
        length: password.length
      });
    }

    auditLogger.log('password_generate_success', {
      count: passwords.length,
      averageStrength: passwords.reduce((acc, p) => acc + p.strength.score, 0) / passwords.length
    });

    res.json({
      success: true,
      passwords,
      options: {
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar,
        excludeAmbiguous
      },
      message: `Generated ${passwords.length} password(s) successfully`
    });

  } catch (error) {
    auditLogger.log('password_generate_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Password Strength Checker endpoint
router.post('/check-strength', rateLimits.apiCalls, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Password is required'
      });
    }

    auditLogger.log('password_check_start', {
      passwordLength: password.length
    });

    const strength = calculatePasswordStrength(password);
    const analysis = analyzePassword(password);

    auditLogger.log('password_check_success', {
      passwordLength: password.length,
      strengthScore: strength.score
    });

    res.json({
      success: true,
      strength,
      analysis,
      message: 'Password strength analyzed successfully'
    });

  } catch (error) {
    auditLogger.log('password_check_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Passphrase Generator endpoint
router.post('/passphrase', rateLimits.toolExecution, async (req, res) => {
  try {
    const {
      wordCount = 4,
      separator = '-',
      includeNumbers = false,
      capitalize = false,
      count = 1
    } = req.body;

    if (wordCount < 2 || wordCount > 10) {
      return res.status(400).json({
        error: 'Word count must be between 2 and 10'
      });
    }

    if (count < 1 || count > 50) {
      return res.status(400).json({
        error: 'Passphrase count must be between 1 and 50'
      });
    }

    auditLogger.log('passphrase_generate_start', {
      wordCount,
      count
    });

    const passphrases = [];
    
    for (let i = 0; i < count; i++) {
      const passphrase = generatePassphrase({
        wordCount,
        separator,
        includeNumbers,
        capitalize
      });
      
      const strength = calculatePasswordStrength(passphrase);
      
      passphrases.push({
        passphrase,
        strength,
        wordCount: passphrase.split(separator).length
      });
    }

    auditLogger.log('passphrase_generate_success', {
      count: passphrases.length
    });

    res.json({
      success: true,
      passphrases,
      options: {
        wordCount,
        separator,
        includeNumbers,
        capitalize
      },
      message: `Generated ${passphrases.length} passphrase(s) successfully`
    });

  } catch (error) {
    auditLogger.log('passphrase_generate_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function generateSecurePassword(options) {
  const {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeSimilar,
    excludeAmbiguous,
    customCharacters
  } = options;

  let charset = '';
  
  if (customCharacters) {
    charset = customCharacters;
  } else {
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }

  if (excludeSimilar) {
    charset = charset.replace(/[il1Lo0O]/g, '');
  }

  if (excludeAmbiguous) {
    charset = charset.replace(/[{}[\]()\/\\'"~,;.<>]/g, '');
  }

  if (charset.length === 0) {
    throw new Error('No valid characters available for password generation');
  }

  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}

function calculatePasswordStrength(password) {
  let score = 0;
  let feedback = [];

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  else if (password.length < 8) feedback.push('Use at least 8 characters');

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }

  if (/123|abc|qwe/i.test(password)) {
    score -= 1;
    feedback.push('Avoid common sequences');
  }

  // Calculate final score
  const maxScore = 7;
  const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100));

  let level = 'Very Weak';
  let color = '#ef4444';

  if (percentage >= 80) {
    level = 'Very Strong';
    color = '#22c55e';
  } else if (percentage >= 60) {
    level = 'Strong';
    color = '#84cc16';
  } else if (percentage >= 40) {
    level = 'Medium';
    color = '#eab308';
  } else if (percentage >= 20) {
    level = 'Weak';
    color = '#f97316';
  }

  return {
    score: Math.round(percentage),
    level,
    color,
    feedback: feedback.slice(0, 3) // Limit feedback
  };
}

function analyzePassword(password) {
  const analysis = {
    length: password.length,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSymbols: /[^A-Za-z0-9]/.test(password),
    hasRepeatedChars: /(.)\1{2,}/.test(password),
    hasSequences: /123|abc|qwe/i.test(password),
    entropy: calculateEntropy(password),
    estimatedCrackTime: estimateCrackTime(password)
  };

  return analysis;
}

function calculateEntropy(password) {
  let charset = 0;
  if (/[a-z]/.test(password)) charset += 26;
  if (/[A-Z]/.test(password)) charset += 26;
  if (/[0-9]/.test(password)) charset += 10;
  if (/[^A-Za-z0-9]/.test(password)) charset += 32;

  return Math.log2(Math.pow(charset, password.length));
}

function estimateCrackTime(password) {
  const entropy = calculateEntropy(password);
  const guessesPerSecond = 1e9; // 1 billion guesses per second
  const secondsToCrack = Math.pow(2, entropy - 1) / guessesPerSecond;

  if (secondsToCrack < 60) return 'Less than a minute';
  if (secondsToCrack < 3600) return `${Math.round(secondsToCrack / 60)} minutes`;
  if (secondsToCrack < 86400) return `${Math.round(secondsToCrack / 3600)} hours`;
  if (secondsToCrack < 31536000) return `${Math.round(secondsToCrack / 86400)} days`;
  if (secondsToCrack < 31536000000) return `${Math.round(secondsToCrack / 31536000)} years`;
  return 'Centuries';
}

function generatePassphrase(options) {
  const { wordCount, separator, includeNumbers, capitalize } = options;
  
  // Common word list (in production, use a larger dictionary)
  const words = [
    'apple', 'banana', 'cherry', 'dragon', 'elephant', 'forest', 'guitar', 'house',
    'island', 'jungle', 'kitten', 'lemon', 'mountain', 'ocean', 'piano', 'queen',
    'river', 'sunset', 'tiger', 'umbrella', 'violet', 'window', 'yellow', 'zebra',
    'bridge', 'castle', 'diamond', 'eagle', 'flower', 'garden', 'hammer', 'iceberg',
    'jacket', 'knight', 'ladder', 'mirror', 'notebook', 'orange', 'pencil', 'rabbit',
    'silver', 'thunder', 'unicorn', 'village', 'wizard', 'crystal', 'dolphin', 'emerald'
  ];

  const selectedWords = [];
  const usedIndices = new Set();

  for (let i = 0; i < wordCount; i++) {
    let randomIndex;
    do {
      randomIndex = crypto.randomInt(0, words.length);
    } while (usedIndices.has(randomIndex));
    
    usedIndices.add(randomIndex);
    let word = words[randomIndex];
    
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    
    if (includeNumbers && Math.random() > 0.5) {
      word += crypto.randomInt(0, 100);
    }
    
    selectedWords.push(word);
  }

  return selectedWords.join(separator);
}

// Get tool info
router.get('/info', (req, res) => {
  res.json({
    name: 'Password Generator',
    description: 'Generate secure passwords and passphrases with customizable options',
    version: '1.0.0',
    category: 'Security Tools',
    endpoints: ['/generate', '/check-strength', '/passphrase'],
    features: [
      'Secure password generation',
      'Passphrase generation',
      'Password strength analysis',
      'Batch generation',
      'Customizable character sets',
      'Entropy calculation',
      'Crack time estimation'
    ],
    limits: {
      passwordLength: { min: 4, max: 128 },
      passwordCount: { min: 1, max: 100 },
      passphraseWords: { min: 2, max: 10 },
      passphraseCount: { min: 1, max: 50 }
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tool: 'Password Generator',
    timestamp: new Date().toISOString(),
    endpoints: ['/generate', '/check-strength', '/passphrase', '/info', '/health']
  });
});

module.exports = router;
