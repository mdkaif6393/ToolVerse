const express = require('express');
const crypto = require('crypto');
const validator = require('validator');
const { rateLimits, auditLogger } = require('../../../backend/middleware/toolSecurity');

const router = express.Router();

// In-memory storage for demo (use database in production)
const urlDatabase = new Map();
const analytics = new Map();

// URL Shortener endpoint
router.post('/shorten', rateLimits.toolExecution, async (req, res) => {
  try {
    const { 
      originalUrl, 
      customAlias = '', 
      expirationDate = null,
      password = '',
      description = ''
    } = req.body;

    if (!originalUrl || typeof originalUrl !== 'string') {
      return res.status(400).json({
        error: 'Original URL is required'
      });
    }

    // Validate URL
    if (!validator.isURL(originalUrl, { 
      protocols: ['http', 'https'], 
      require_protocol: true 
    })) {
      return res.status(400).json({
        error: 'Please provide a valid URL with http:// or https://'
      });
    }

    // Check for malicious URLs
    const suspiciousPatterns = [
      /bit\.ly|tinyurl|t\.co/i, // Already shortened URLs
      /localhost|127\.0\.0\.1|0\.0\.0\.0/i, // Local URLs
      /\.(exe|bat|cmd|scr|pif|com)$/i // Executable files
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(originalUrl))) {
      return res.status(400).json({
        error: 'URL appears to be suspicious or already shortened'
      });
    }

    auditLogger.log('url_shorten_start', {
      originalUrl: originalUrl.substring(0, 100),
      hasCustomAlias: !!customAlias,
      hasPassword: !!password
    });

    let shortCode;
    
    if (customAlias) {
      // Validate custom alias
      if (!/^[a-zA-Z0-9_-]{3,20}$/.test(customAlias)) {
        return res.status(400).json({
          error: 'Custom alias must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores'
        });
      }
      
      if (urlDatabase.has(customAlias)) {
        return res.status(400).json({
          error: 'Custom alias already exists. Please choose a different one.'
        });
      }
      
      shortCode = customAlias;
    } else {
      // Generate random short code
      do {
        shortCode = generateShortCode();
      } while (urlDatabase.has(shortCode));
    }

    // Create URL entry
    const urlEntry = {
      id: crypto.randomUUID(),
      originalUrl,
      shortCode,
      createdAt: new Date().toISOString(),
      expirationDate: expirationDate ? new Date(expirationDate).toISOString() : null,
      password: password ? hashPassword(password) : null,
      description,
      clicks: 0,
      isActive: true,
      createdBy: req.ip || 'anonymous'
    };

    urlDatabase.set(shortCode, urlEntry);
    
    // Initialize analytics
    analytics.set(shortCode, {
      totalClicks: 0,
      uniqueClicks: 0,
      clickHistory: [],
      referrers: {},
      countries: {},
      devices: {},
      browsers: {}
    });

    const shortUrl = `${req.protocol}://${req.get('host')}/s/${shortCode}`;

    auditLogger.log('url_shorten_success', {
      shortCode,
      originalUrl: originalUrl.substring(0, 100)
    });

    res.json({
      success: true,
      data: {
        id: urlEntry.id,
        originalUrl,
        shortUrl,
        shortCode,
        createdAt: urlEntry.createdAt,
        expirationDate: urlEntry.expirationDate,
        hasPassword: !!password,
        description,
        qrCode: `${req.protocol}://${req.get('host')}/api/tools/url-shortener/qr/${shortCode}`
      },
      message: 'URL shortened successfully'
    });

  } catch (error) {
    auditLogger.log('url_shorten_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// URL Redirect endpoint
router.get('/redirect/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.query;

    const urlEntry = urlDatabase.get(shortCode);
    
    if (!urlEntry || !urlEntry.isActive) {
      return res.status(404).json({
        error: 'Short URL not found or has been deactivated'
      });
    }

    // Check expiration
    if (urlEntry.expirationDate && new Date() > new Date(urlEntry.expirationDate)) {
      return res.status(410).json({
        error: 'Short URL has expired'
      });
    }

    // Check password protection
    if (urlEntry.password) {
      if (!password) {
        return res.status(401).json({
          error: 'Password required',
          requiresPassword: true
        });
      }
      
      if (!verifyPassword(password, urlEntry.password)) {
        return res.status(401).json({
          error: 'Incorrect password'
        });
      }
    }

    // Update analytics
    updateAnalytics(shortCode, req);
    
    // Update click count
    urlEntry.clicks++;
    urlDatabase.set(shortCode, urlEntry);

    auditLogger.log('url_redirect', {
      shortCode,
      originalUrl: urlEntry.originalUrl.substring(0, 100),
      userAgent: req.get('User-Agent')?.substring(0, 100)
    });

    res.json({
      success: true,
      redirectUrl: urlEntry.originalUrl,
      message: 'Redirect URL retrieved successfully'
    });

  } catch (error) {
    auditLogger.log('url_redirect_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get URL Analytics
router.get('/analytics/:shortCode', rateLimits.apiCalls, async (req, res) => {
  try {
    const { shortCode } = req.params;

    const urlEntry = urlDatabase.get(shortCode);
    if (!urlEntry) {
      return res.status(404).json({
        error: 'Short URL not found'
      });
    }

    const urlAnalytics = analytics.get(shortCode) || {
      totalClicks: 0,
      uniqueClicks: 0,
      clickHistory: [],
      referrers: {},
      countries: {},
      devices: {},
      browsers: {}
    };

    res.json({
      success: true,
      data: {
        url: {
          id: urlEntry.id,
          originalUrl: urlEntry.originalUrl,
          shortCode: urlEntry.shortCode,
          createdAt: urlEntry.createdAt,
          expirationDate: urlEntry.expirationDate,
          description: urlEntry.description,
          isActive: urlEntry.isActive
        },
        analytics: {
          totalClicks: urlAnalytics.totalClicks,
          uniqueClicks: urlAnalytics.uniqueClicks,
          clicksToday: getClicksToday(urlAnalytics.clickHistory),
          clicksThisWeek: getClicksThisWeek(urlAnalytics.clickHistory),
          clicksThisMonth: getClicksThisMonth(urlAnalytics.clickHistory),
          topReferrers: getTopEntries(urlAnalytics.referrers, 5),
          topCountries: getTopEntries(urlAnalytics.countries, 5),
          topDevices: getTopEntries(urlAnalytics.devices, 5),
          topBrowsers: getTopEntries(urlAnalytics.browsers, 5),
          recentClicks: urlAnalytics.clickHistory.slice(-10).reverse()
        }
      },
      message: 'Analytics retrieved successfully'
    });

  } catch (error) {
    auditLogger.log('url_analytics_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Generate QR Code for short URL
router.get('/qr/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { size = 200 } = req.query;

    const urlEntry = urlDatabase.get(shortCode);
    if (!urlEntry) {
      return res.status(404).json({
        error: 'Short URL not found'
      });
    }

    const shortUrl = `${req.protocol}://${req.get('host')}/s/${shortCode}`;
    
    // Generate QR code (using a simple placeholder for demo)
    // In production, use a proper QR code library
    const qrCodeSvg = generateQRCodeSVG(shortUrl, parseInt(size));

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(qrCodeSvg);

  } catch (error) {
    auditLogger.log('qr_generate_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Bulk URL Shortening
router.post('/bulk', rateLimits.toolExecution, async (req, res) => {
  try {
    const { urls } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: 'URLs array is required'
      });
    }

    if (urls.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 URLs allowed for bulk shortening'
      });
    }

    auditLogger.log('bulk_shorten_start', {
      urlCount: urls.length
    });

    const results = [];

    for (const urlData of urls) {
      try {
        const { originalUrl, customAlias = '', description = '' } = urlData;

        if (!validator.isURL(originalUrl, { 
          protocols: ['http', 'https'], 
          require_protocol: true 
        })) {
          results.push({
            originalUrl,
            success: false,
            error: 'Invalid URL format'
          });
          continue;
        }

        let shortCode;
        if (customAlias && !urlDatabase.has(customAlias)) {
          shortCode = customAlias;
        } else {
          do {
            shortCode = generateShortCode();
          } while (urlDatabase.has(shortCode));
        }

        const urlEntry = {
          id: crypto.randomUUID(),
          originalUrl,
          shortCode,
          createdAt: new Date().toISOString(),
          expirationDate: null,
          password: null,
          description,
          clicks: 0,
          isActive: true,
          createdBy: req.ip || 'anonymous'
        };

        urlDatabase.set(shortCode, urlEntry);
        analytics.set(shortCode, {
          totalClicks: 0,
          uniqueClicks: 0,
          clickHistory: [],
          referrers: {},
          countries: {},
          devices: {},
          browsers: {}
        });

        const shortUrl = `${req.protocol}://${req.get('host')}/s/${shortCode}`;

        results.push({
          originalUrl,
          shortUrl,
          shortCode,
          success: true
        });

      } catch (error) {
        results.push({
          originalUrl: urlData.originalUrl || 'Invalid',
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    auditLogger.log('bulk_shorten_success', {
      urlCount: urls.length,
      successCount,
      failureCount: urls.length - successCount
    });

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: urls.length,
          successful: successCount,
          failed: urls.length - successCount
        }
      },
      message: `Bulk shortening completed: ${successCount}/${urls.length} successful`
    });

  } catch (error) {
    auditLogger.log('bulk_shorten_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function updateAnalytics(shortCode, req) {
  const urlAnalytics = analytics.get(shortCode);
  if (!urlAnalytics) return;

  const now = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'Unknown';
  const referrer = req.get('Referer') || 'Direct';
  const ip = req.ip || 'Unknown';

  // Add click to history
  urlAnalytics.clickHistory.push({
    timestamp: now,
    ip: ip.substring(0, 10), // Truncate for privacy
    userAgent: userAgent.substring(0, 100),
    referrer: referrer.substring(0, 100)
  });

  // Update counters
  urlAnalytics.totalClicks++;
  
  // Update referrers
  const referrerDomain = extractDomain(referrer);
  urlAnalytics.referrers[referrerDomain] = (urlAnalytics.referrers[referrerDomain] || 0) + 1;

  // Update devices (simplified)
  const device = getDeviceType(userAgent);
  urlAnalytics.devices[device] = (urlAnalytics.devices[device] || 0) + 1;

  // Update browsers (simplified)
  const browser = getBrowserType(userAgent);
  urlAnalytics.browsers[browser] = (urlAnalytics.browsers[browser] || 0) + 1;

  // Update countries (placeholder - would use IP geolocation in production)
  urlAnalytics.countries['Unknown'] = (urlAnalytics.countries['Unknown'] || 0) + 1;

  analytics.set(shortCode, urlAnalytics);
}

function extractDomain(url) {
  if (!url || url === 'Direct') return 'Direct';
  try {
    return new URL(url).hostname;
  } catch {
    return 'Unknown';
  }
}

function getDeviceType(userAgent) {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
  if (/Tablet/.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

function getBrowserType(userAgent) {
  if (/Chrome/.test(userAgent)) return 'Chrome';
  if (/Firefox/.test(userAgent)) return 'Firefox';
  if (/Safari/.test(userAgent)) return 'Safari';
  if (/Edge/.test(userAgent)) return 'Edge';
  return 'Other';
}

function getClicksToday(clickHistory) {
  const today = new Date().toDateString();
  return clickHistory.filter(click => 
    new Date(click.timestamp).toDateString() === today
  ).length;
}

function getClicksThisWeek(clickHistory) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return clickHistory.filter(click => 
    new Date(click.timestamp) >= weekAgo
  ).length;
}

function getClicksThisMonth(clickHistory) {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return clickHistory.filter(click => 
    new Date(click.timestamp) >= monthAgo
  ).length;
}

function getTopEntries(obj, limit) {
  return Object.entries(obj)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([key, value]) => ({ name: key, count: value }));
}

function generateQRCodeSVG(text, size) {
  // Simplified QR code placeholder (use proper QR library in production)
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="white"/>
      <rect x="10" y="10" width="${size-20}" height="${size-20}" fill="black" opacity="0.1"/>
      <text x="${size/2}" y="${size/2}" text-anchor="middle" font-family="Arial" font-size="12" fill="black">
        QR Code
      </text>
      <text x="${size/2}" y="${size/2 + 20}" text-anchor="middle" font-family="Arial" font-size="8" fill="gray">
        ${text.substring(0, 20)}...
      </text>
    </svg>
  `;
}

// Get tool info
router.get('/info', (req, res) => {
  res.json({
    name: 'URL Shortener',
    description: 'Create short, memorable URLs with analytics and custom options',
    version: '1.0.0',
    category: 'Productivity Tools',
    endpoints: ['/shorten', '/redirect/:shortCode', '/analytics/:shortCode', '/qr/:shortCode', '/bulk'],
    features: [
      'URL shortening with custom aliases',
      'Password protection',
      'Expiration dates',
      'Click analytics and tracking',
      'QR code generation',
      'Bulk URL processing',
      'Referrer and device tracking'
    ],
    limits: {
      customAliasLength: { min: 3, max: 20 },
      bulkUrls: { max: 100 },
      urlLength: { max: 2048 }
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tool: 'URL Shortener',
    timestamp: new Date().toISOString(),
    stats: {
      totalUrls: urlDatabase.size,
      totalClicks: Array.from(analytics.values()).reduce((sum, a) => sum + a.totalClicks, 0)
    },
    endpoints: ['/shorten', '/redirect/:shortCode', '/analytics/:shortCode', '/qr/:shortCode', '/bulk', '/info', '/health']
  });
});

module.exports = router;
