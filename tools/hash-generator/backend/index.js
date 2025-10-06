const express = require('express');
const crypto = require('crypto');
const { rateLimits, auditLogger } = require('../../../backend/middleware/toolSecurity');

const router = express.Router();

// Hash Generator endpoint
router.post('/generate', rateLimits.toolExecution, async (req, res) => {
  try {
    const { 
      input, 
      algorithms = ['md5', 'sha1', 'sha256'], 
      encoding = 'hex',
      iterations = 1
    } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        error: 'Input text is required for hash generation'
      });
    }

    if (input.length > 1000000) {
      return res.status(400).json({
        error: 'Input text too long (maximum 1,000,000 characters)'
      });
    }

    if (!Array.isArray(algorithms) || algorithms.length === 0) {
      return res.status(400).json({
        error: 'At least one algorithm must be specified'
      });
    }

    const supportedAlgorithms = [
      'md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512',
      'sha3-224', 'sha3-256', 'sha3-384', 'sha3-512',
      'blake2b512', 'blake2s256'
    ];

    const invalidAlgorithms = algorithms.filter(alg => !supportedAlgorithms.includes(alg));
    if (invalidAlgorithms.length > 0) {
      return res.status(400).json({
        error: `Unsupported algorithms: ${invalidAlgorithms.join(', ')}`,
        supportedAlgorithms
      });
    }

    auditLogger.log('hash_generate_start', {
      inputLength: input.length,
      algorithms: algorithms.length,
      encoding,
      iterations
    });

    const results = {};
    const performance = {};

    for (const algorithm of algorithms) {
      try {
        const startTime = process.hrtime.bigint();
        
        let hash;
        if (iterations > 1) {
          // Multiple iterations for key stretching
          hash = input;
          for (let i = 0; i < iterations; i++) {
            hash = crypto.createHash(algorithm).update(hash).digest(encoding);
          }
        } else {
          hash = crypto.createHash(algorithm).update(input).digest(encoding);
        }
        
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        results[algorithm] = {
          hash,
          length: hash.length,
          algorithm,
          encoding,
          iterations
        };

        performance[algorithm] = {
          duration: Math.round(duration * 100) / 100,
          throughput: Math.round((input.length / duration) * 1000) // chars per second
        };

      } catch (error) {
        results[algorithm] = {
          error: `Failed to generate ${algorithm} hash: ${error.message}`
        };
      }
    }

    // Generate additional metadata
    const metadata = {
      inputLength: input.length,
      inputType: detectInputType(input),
      timestamp: new Date().toISOString(),
      totalAlgorithms: algorithms.length,
      successfulHashes: Object.keys(results).filter(alg => !results[alg].error).length
    };

    auditLogger.log('hash_generate_success', {
      inputLength: input.length,
      algorithmsProcessed: algorithms.length,
      successfulHashes: metadata.successfulHashes
    });

    res.json({
      success: true,
      data: {
        results,
        performance,
        metadata
      },
      message: 'Hash generation completed successfully'
    });

  } catch (error) {
    auditLogger.log('hash_generate_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Hash Verification endpoint
router.post('/verify', rateLimits.toolExecution, async (req, res) => {
  try {
    const { input, hash, algorithm = 'sha256' } = req.body;

    if (!input || !hash || !algorithm) {
      return res.status(400).json({
        error: 'Input text, hash, and algorithm are required for verification'
      });
    }

    auditLogger.log('hash_verify_start', {
      inputLength: input.length,
      algorithm,
      hashLength: hash.length
    });

    try {
      const computedHash = crypto.createHash(algorithm).update(input).digest('hex');
      const isMatch = computedHash.toLowerCase() === hash.toLowerCase();

      auditLogger.log('hash_verify_success', {
        algorithm,
        isMatch
      });

      res.json({
        success: true,
        data: {
          isMatch,
          computedHash,
          providedHash: hash,
          algorithm,
          inputLength: input.length
        },
        message: isMatch ? 'Hash verification successful - match found' : 'Hash verification completed - no match'
      });

    } catch (error) {
      res.status(400).json({
        error: `Hash verification failed: ${error.message}`
      });
    }

  } catch (error) {
    auditLogger.log('hash_verify_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// File Hash endpoint (for text content)
router.post('/file-hash', rateLimits.toolExecution, async (req, res) => {
  try {
    const { content, filename, algorithm = 'sha256' } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'File content is required'
      });
    }

    auditLogger.log('file_hash_start', {
      contentLength: content.length,
      algorithm,
      filename: filename || 'unknown'
    });

    const hash = crypto.createHash(algorithm).update(content).digest('hex');
    const size = Buffer.byteLength(content, 'utf8');

    const result = {
      hash,
      algorithm,
      filename: filename || 'untitled',
      size,
      sizeFormatted: formatBytes(size),
      timestamp: new Date().toISOString()
    };

    auditLogger.log('file_hash_success', {
      algorithm,
      contentLength: content.length,
      hash: hash.substring(0, 16) + '...'
    });

    res.json({
      success: true,
      data: result,
      message: 'File hash generated successfully'
    });

  } catch (error) {
    auditLogger.log('file_hash_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// HMAC Generator endpoint
router.post('/hmac', rateLimits.toolExecution, async (req, res) => {
  try {
    const { 
      message, 
      key, 
      algorithm = 'sha256',
      encoding = 'hex'
    } = req.body;

    if (!message || !key) {
      return res.status(400).json({
        error: 'Message and key are required for HMAC generation'
      });
    }

    auditLogger.log('hmac_generate_start', {
      messageLength: message.length,
      keyLength: key.length,
      algorithm
    });

    try {
      const hmac = crypto.createHmac(algorithm, key).update(message).digest(encoding);

      const result = {
        hmac,
        algorithm,
        encoding,
        messageLength: message.length,
        keyLength: key.length,
        timestamp: new Date().toISOString()
      };

      auditLogger.log('hmac_generate_success', {
        algorithm,
        messageLength: message.length
      });

      res.json({
        success: true,
        data: result,
        message: 'HMAC generated successfully'
      });

    } catch (error) {
      res.status(400).json({
        error: `HMAC generation failed: ${error.message}`
      });
    }

  } catch (error) {
    auditLogger.log('hmac_generate_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Batch Hash Generation endpoint
router.post('/batch', rateLimits.toolExecution, async (req, res) => {
  try {
    const { inputs, algorithm = 'sha256' } = req.body;

    if (!Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({
        error: 'Inputs array is required for batch hashing'
      });
    }

    if (inputs.length > 1000) {
      return res.status(400).json({
        error: 'Maximum 1000 inputs allowed for batch processing'
      });
    }

    auditLogger.log('batch_hash_start', {
      inputCount: inputs.length,
      algorithm
    });

    const results = [];
    let successCount = 0;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      
      try {
        if (typeof input !== 'string') {
          results.push({
            index: i,
            input: input,
            success: false,
            error: 'Input must be a string'
          });
          continue;
        }

        const hash = crypto.createHash(algorithm).update(input).digest('hex');
        
        results.push({
          index: i,
          input: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
          hash,
          length: input.length,
          success: true
        });
        
        successCount++;

      } catch (error) {
        results.push({
          index: i,
          input: input,
          success: false,
          error: error.message
        });
      }
    }

    auditLogger.log('batch_hash_success', {
      inputCount: inputs.length,
      successCount,
      algorithm
    });

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: inputs.length,
          successful: successCount,
          failed: inputs.length - successCount,
          algorithm
        }
      },
      message: `Batch hashing completed: ${successCount}/${inputs.length} successful`
    });

  } catch (error) {
    auditLogger.log('batch_hash_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function detectInputType(input) {
  // Simple input type detection
  if (/^[0-9a-fA-F]+$/.test(input)) {
    return 'hexadecimal';
  } else if (/^[01]+$/.test(input)) {
    return 'binary';
  } else if (/^[A-Za-z0-9+/]*={0,2}$/.test(input)) {
    return 'base64';
  } else if (/^\d+$/.test(input)) {
    return 'numeric';
  } else if (/^[a-zA-Z\s]+$/.test(input)) {
    return 'text';
  } else {
    return 'mixed';
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get supported algorithms
router.get('/algorithms', (req, res) => {
  const algorithms = {
    md5: { name: 'MD5', outputLength: 32, recommended: false, note: 'Not cryptographically secure' },
    sha1: { name: 'SHA-1', outputLength: 40, recommended: false, note: 'Deprecated for security' },
    sha224: { name: 'SHA-224', outputLength: 56, recommended: true },
    sha256: { name: 'SHA-256', outputLength: 64, recommended: true },
    sha384: { name: 'SHA-384', outputLength: 96, recommended: true },
    sha512: { name: 'SHA-512', outputLength: 128, recommended: true },
    'sha3-224': { name: 'SHA3-224', outputLength: 56, recommended: true },
    'sha3-256': { name: 'SHA3-256', outputLength: 64, recommended: true },
    'sha3-384': { name: 'SHA3-384', outputLength: 96, recommended: true },
    'sha3-512': { name: 'SHA3-512', outputLength: 128, recommended: true }
  };

  res.json({
    success: true,
    data: {
      algorithms,
      total: Object.keys(algorithms).length,
      recommended: Object.entries(algorithms).filter(([, info]) => info.recommended).map(([alg]) => alg)
    }
  });
});

// Get tool info
router.get('/info', (req, res) => {
  res.json({
    name: 'Hash Generator',
    description: 'Generate cryptographic hashes using various algorithms including SHA, MD5, and more',
    version: '1.0.0',
    category: 'Security Tools',
    endpoints: ['/generate', '/verify', '/file-hash', '/hmac', '/batch', '/algorithms'],
    features: [
      'Multiple hash algorithms (SHA-256, SHA-512, MD5, etc.)',
      'Hash verification and comparison',
      'HMAC generation with custom keys',
      'Batch processing for multiple inputs',
      'File content hashing',
      'Performance metrics and timing',
      'Input type detection'
    ],
    limits: {
      maxInputLength: 1000000,
      maxBatchSize: 1000,
      supportedEncodings: ['hex', 'base64']
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tool: 'Hash Generator',
    timestamp: new Date().toISOString(),
    endpoints: ['/generate', '/verify', '/file-hash', '/hmac', '/batch', '/algorithms', '/info', '/health']
  });
});

module.exports = router;
