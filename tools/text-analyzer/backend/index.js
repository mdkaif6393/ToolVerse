const express = require('express');
const { rateLimits, auditLogger } = require('../../../backend/middleware/toolSecurity');

const router = express.Router();

// Text Analysis endpoint
router.post('/analyze', rateLimits.toolExecution, async (req, res) => {
  try {
    const { text, analysisType = 'comprehensive' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text content is required for analysis'
      });
    }

    if (text.length > 100000) {
      return res.status(400).json({
        error: 'Text content too long (maximum 100,000 characters)'
      });
    }

    auditLogger.log('text_analyze_start', {
      textLength: text.length,
      analysisType
    });

    const analysis = performTextAnalysis(text, analysisType);

    auditLogger.log('text_analyze_success', {
      textLength: text.length,
      analysisType,
      wordCount: analysis.basic.wordCount
    });

    res.json({
      success: true,
      data: analysis,
      message: 'Text analysis completed successfully'
    });

  } catch (error) {
    auditLogger.log('text_analyze_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Sentiment Analysis endpoint
router.post('/sentiment', rateLimits.toolExecution, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text content is required for sentiment analysis'
      });
    }

    auditLogger.log('sentiment_analyze_start', {
      textLength: text.length
    });

    const sentiment = analyzeSentiment(text);

    auditLogger.log('sentiment_analyze_success', {
      textLength: text.length,
      sentiment: sentiment.overall
    });

    res.json({
      success: true,
      data: sentiment,
      message: 'Sentiment analysis completed successfully'
    });

  } catch (error) {
    auditLogger.log('sentiment_analyze_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Keyword Extraction endpoint
router.post('/keywords', rateLimits.toolExecution, async (req, res) => {
  try {
    const { text, maxKeywords = 20 } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text content is required for keyword extraction'
      });
    }

    auditLogger.log('keyword_extract_start', {
      textLength: text.length,
      maxKeywords
    });

    const keywords = extractKeywords(text, parseInt(maxKeywords));

    auditLogger.log('keyword_extract_success', {
      textLength: text.length,
      keywordCount: keywords.length
    });

    res.json({
      success: true,
      data: {
        keywords,
        totalFound: keywords.length
      },
      message: 'Keyword extraction completed successfully'
    });

  } catch (error) {
    auditLogger.log('keyword_extract_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Readability Analysis endpoint
router.post('/readability', rateLimits.toolExecution, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text content is required for readability analysis'
      });
    }

    auditLogger.log('readability_analyze_start', {
      textLength: text.length
    });

    const readability = analyzeReadability(text);

    auditLogger.log('readability_analyze_success', {
      textLength: text.length,
      fleschScore: readability.fleschKincaidScore
    });

    res.json({
      success: true,
      data: readability,
      message: 'Readability analysis completed successfully'
    });

  } catch (error) {
    auditLogger.log('readability_analyze_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Text Statistics endpoint
router.post('/statistics', rateLimits.toolExecution, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text content is required for statistics'
      });
    }

    auditLogger.log('text_stats_start', {
      textLength: text.length
    });

    const stats = getTextStatistics(text);

    auditLogger.log('text_stats_success', {
      textLength: text.length,
      wordCount: stats.wordCount
    });

    res.json({
      success: true,
      data: stats,
      message: 'Text statistics calculated successfully'
    });

  } catch (error) {
    auditLogger.log('text_stats_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function performTextAnalysis(text, analysisType) {
  const basic = getTextStatistics(text);
  const sentiment = analyzeSentiment(text);
  const keywords = extractKeywords(text, 10);
  const readability = analyzeReadability(text);

  const analysis = {
    basic,
    sentiment,
    keywords: keywords.slice(0, 10),
    readability
  };

  if (analysisType === 'comprehensive') {
    analysis.advanced = {
      languageDetection: detectLanguage(text),
      textComplexity: calculateTextComplexity(text),
      topicModeling: extractTopics(text),
      namedEntities: extractNamedEntities(text)
    };
  }

  return analysis;
}

function getTextStatistics(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Calculate averages
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgCharsPerWord = words.length > 0 ? charactersNoSpaces / words.length : 0;
  const avgSentencesPerParagraph = paragraphs.length > 0 ? sentences.length / paragraphs.length : 0;

  // Word frequency
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const mostCommonWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count, percentage: ((count / words.length) * 100).toFixed(2) }));

  return {
    characters,
    charactersNoSpaces,
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    averages: {
      wordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
      charactersPerWord: Math.round(avgCharsPerWord * 100) / 100,
      sentencesPerParagraph: Math.round(avgSentencesPerParagraph * 100) / 100
    },
    mostCommonWords,
    uniqueWords: Object.keys(wordFreq).length,
    lexicalDiversity: Object.keys(wordFreq).length / words.length
  };
}

function analyzeSentiment(text) {
  // Simplified sentiment analysis using word lists
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'brilliant',
    'perfect', 'outstanding', 'superb', 'magnificent', 'marvelous', 'terrific', 'fabulous',
    'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'delighted', 'thrilled',
    'excited', 'grateful', 'thankful', 'appreciate', 'beautiful', 'nice', 'pleasant'
  ];

  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'dislike', 'angry',
    'frustrated', 'disappointed', 'sad', 'upset', 'annoyed', 'irritated', 'furious',
    'worst', 'pathetic', 'useless', 'worthless', 'stupid', 'ridiculous', 'absurd',
    'wrong', 'false', 'incorrect', 'mistake', 'error', 'problem', 'issue', 'concern'
  ];

  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let positiveScore = 0;
  let negativeScore = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });

  const totalSentimentWords = positiveScore + negativeScore;
  const neutralScore = words.length - totalSentimentWords;

  let overall = 'neutral';
  let confidence = 0;

  if (totalSentimentWords > 0) {
    const positiveRatio = positiveScore / totalSentimentWords;
    const negativeRatio = negativeScore / totalSentimentWords;
    
    if (positiveRatio > 0.6) {
      overall = 'positive';
      confidence = positiveRatio;
    } else if (negativeRatio > 0.6) {
      overall = 'negative';
      confidence = negativeRatio;
    } else {
      overall = 'mixed';
      confidence = Math.abs(positiveRatio - negativeRatio);
    }
  }

  return {
    overall,
    confidence: Math.round(confidence * 100),
    scores: {
      positive: positiveScore,
      negative: negativeScore,
      neutral: neutralScore
    },
    percentages: {
      positive: Math.round((positiveScore / words.length) * 100 * 100) / 100,
      negative: Math.round((negativeScore / words.length) * 100 * 100) / 100,
      neutral: Math.round((neutralScore / words.length) * 100 * 100) / 100
    }
  };
}

function extractKeywords(text, maxKeywords) {
  // Simple keyword extraction using TF-IDF-like approach
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const wordFreq = {};
  const wordPositions = {};

  words.forEach((word, index) => {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
      if (!wordPositions[word]) wordPositions[word] = [];
      wordPositions[word].push(index);
    }
  });

  // Calculate keyword scores
  const keywords = Object.entries(wordFreq)
    .map(([word, frequency]) => {
      const positions = wordPositions[word];
      const firstPosition = positions[0];
      const spread = positions.length > 1 ? Math.max(...positions) - Math.min(...positions) : 0;
      
      // Score based on frequency, position, and spread
      const frequencyScore = frequency / words.length;
      const positionScore = 1 - (firstPosition / words.length); // Earlier words get higher score
      const spreadScore = spread / words.length; // Words spread throughout get higher score
      
      const totalScore = (frequencyScore * 0.5) + (positionScore * 0.3) + (spreadScore * 0.2);
      
      return {
        word,
        frequency,
        score: Math.round(totalScore * 1000) / 1000,
        positions: positions.length,
        density: Math.round((frequency / words.length) * 100 * 100) / 100
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxKeywords);

  return keywords;
}

function analyzeReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.match(/\b\w+\b/g) || [];
  const syllables = countSyllables(text);

  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

  // Flesch-Kincaid Grade Level
  const fleschKincaidGrade = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;

  // Flesch Reading Ease
  const fleschReadingEase = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  // Automated Readability Index
  const ariScore = (4.71 * (text.replace(/\s/g, '').length / words.length)) + (0.5 * avgWordsPerSentence) - 21.43;

  function getReadabilityLevel(score) {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  function getGradeLevel(grade) {
    if (grade <= 6) return 'Elementary School';
    if (grade <= 8) return 'Middle School';
    if (grade <= 12) return 'High School';
    if (grade <= 16) return 'College';
    return 'Graduate';
  }

  return {
    fleschReadingEase: Math.round(fleschReadingEase * 100) / 100,
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 100) / 100,
    ariScore: Math.round(ariScore * 100) / 100,
    readabilityLevel: getReadabilityLevel(fleschReadingEase),
    gradeLevel: getGradeLevel(fleschKincaidGrade),
    metrics: {
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
      totalSyllables: syllables
    }
  };
}

function countSyllables(text) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let totalSyllables = 0;

  words.forEach(word => {
    let syllables = word.match(/[aeiouy]+/g) || [];
    syllables = syllables.length;
    
    // Adjust for silent e
    if (word.endsWith('e') && syllables > 1) {
      syllables--;
    }
    
    // Minimum of 1 syllable per word
    totalSyllables += Math.max(1, syllables);
  });

  return totalSyllables;
}

function detectLanguage(text) {
  // Simplified language detection based on common words
  const languages = {
    english: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'],
    spanish: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'],
    french: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
    german: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'],
    italian: ['il', 'di', 'che', 'e', 'la', 'per', 'in', 'un', 'è', 'con']
  };

  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const scores = {};

  Object.entries(languages).forEach(([lang, commonWords]) => {
    scores[lang] = 0;
    commonWords.forEach(commonWord => {
      scores[lang] += words.filter(word => word === commonWord).length;
    });
  });

  const detectedLang = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
  
  return {
    detected: detectedLang[0],
    confidence: Math.round((detectedLang[1] / words.length) * 100),
    scores
  };
}

function calculateTextComplexity(text) {
  const words = text.match(/\b\w+\b/g) || [];
  const longWords = words.filter(word => word.length > 6);
  const complexWords = words.filter(word => countSyllables(word) > 2);
  
  return {
    longWordRatio: Math.round((longWords.length / words.length) * 100 * 100) / 100,
    complexWordRatio: Math.round((complexWords.length / words.length) * 100 * 100) / 100,
    avgWordLength: Math.round((words.reduce((sum, word) => sum + word.length, 0) / words.length) * 100) / 100,
    complexity: longWords.length > words.length * 0.3 ? 'High' : 
                longWords.length > words.length * 0.15 ? 'Medium' : 'Low'
  };
}

function extractTopics(text) {
  // Simple topic extraction based on keyword clustering
  const keywords = extractKeywords(text, 20);
  const topics = [];
  
  // Group related keywords (simplified approach)
  const topicGroups = {
    'Technology': ['technology', 'computer', 'software', 'digital', 'internet', 'data', 'system'],
    'Business': ['business', 'company', 'market', 'customer', 'service', 'product', 'sales'],
    'Education': ['education', 'school', 'student', 'learning', 'knowledge', 'study', 'research'],
    'Health': ['health', 'medical', 'doctor', 'patient', 'treatment', 'medicine', 'care'],
    'Science': ['science', 'research', 'study', 'analysis', 'experiment', 'theory', 'discovery']
  };

  Object.entries(topicGroups).forEach(([topic, relatedWords]) => {
    const relevantKeywords = keywords.filter(kw => 
      relatedWords.some(word => kw.word.includes(word) || word.includes(kw.word))
    );
    
    if (relevantKeywords.length > 0) {
      topics.push({
        topic,
        relevance: relevantKeywords.reduce((sum, kw) => sum + kw.score, 0),
        keywords: relevantKeywords.slice(0, 5)
      });
    }
  });

  return topics.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
}

function extractNamedEntities(text) {
  // Simplified named entity recognition
  const entities = {
    persons: [],
    organizations: [],
    locations: [],
    dates: []
  };

  // Simple patterns for demonstration
  const personPattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const orgPattern = /\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|Company|Corporation)\b/g;
  const datePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2},? \d{4}\b/g;

  entities.persons = [...new Set((text.match(personPattern) || []))];
  entities.organizations = [...new Set((text.match(orgPattern) || []))];
  entities.dates = [...new Set((text.match(datePattern) || []))];

  // Simple location detection (very basic)
  const commonLocations = ['New York', 'London', 'Paris', 'Tokyo', 'Berlin', 'Sydney', 'Toronto', 'Mumbai'];
  entities.locations = commonLocations.filter(location => 
    text.includes(location)
  );

  return entities;
}

// Get tool info
router.get('/info', (req, res) => {
  res.json({
    name: 'Text Analyzer',
    description: 'Comprehensive text analysis including sentiment, readability, keywords, and statistics',
    version: '1.0.0',
    category: 'Productivity Tools',
    endpoints: ['/analyze', '/sentiment', '/keywords', '/readability', '/statistics'],
    features: [
      'Text statistics and metrics',
      'Sentiment analysis',
      'Keyword extraction',
      'Readability analysis',
      'Language detection',
      'Topic modeling',
      'Named entity recognition',
      'Text complexity analysis'
    ],
    limits: {
      maxTextLength: 100000,
      maxKeywords: 50
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tool: 'Text Analyzer',
    timestamp: new Date().toISOString(),
    endpoints: ['/analyze', '/sentiment', '/keywords', '/readability', '/statistics', '/info', '/health']
  });
});

module.exports = router;
