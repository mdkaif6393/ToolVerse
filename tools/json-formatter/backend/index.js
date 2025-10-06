const express = require('express');
const { rateLimits, auditLogger } = require('../../../backend/middleware/toolSecurity');

const router = express.Router();

// JSON Formatter endpoint
router.post('/format', rateLimits.toolExecution, async (req, res) => {
  try {
    const { 
      input, 
      indent = 2, 
      sortKeys = false, 
      removeComments = true,
      validateOnly = false 
    } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        error: 'JSON input string is required'
      });
    }

    auditLogger.log('json_format_start', {
      inputLength: input.length,
      validateOnly
    });

    let jsonObject;
    let errors = [];
    let warnings = [];

    // Parse JSON with detailed error reporting
    try {
      let cleanInput = input;
      if (removeComments) {
        cleanInput = cleanInput.replace(/\/\/.*$/gm, '');
        cleanInput = cleanInput.replace(/\/\*[\s\S]*?\*\//g, '');
      }

      jsonObject = JSON.parse(cleanInput);
    } catch (parseError) {
      const errorMatch = parseError.message.match(/position (\d+)/);
      const position = errorMatch ? parseInt(errorMatch[1]) : 0;
      
      const lines = input.substring(0, position).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;

      errors.push({
        type: 'syntax',
        message: parseError.message,
        line,
        column,
        position
      });

      return res.status(400).json({
        success: false,
        errors,
        message: 'Invalid JSON syntax'
      });
    }

    // Validate JSON structure
    const validation = validateJSON(jsonObject);
    warnings = validation.warnings;

    if (validateOnly) {
      auditLogger.log('json_validate_success', {
        inputLength: input.length,
        warningCount: warnings.length
      });

      return res.json({
        success: true,
        valid: true,
        warnings,
        stats: getJSONStats(jsonObject),
        message: 'JSON is valid'
      });
    }

    // Format JSON
    let formattedJSON;
    if (sortKeys) {
      formattedJSON = JSON.stringify(sortObjectKeys(jsonObject), null, indent);
    } else {
      formattedJSON = JSON.stringify(jsonObject, null, indent);
    }

    const minifiedJSON = JSON.stringify(jsonObject);

    const stats = getJSONStats(jsonObject);
    stats.originalSize = input.length;
    stats.formattedSize = formattedJSON.length;
    stats.minifiedSize = minifiedJSON.length;
    stats.compressionRatio = ((stats.originalSize - stats.minifiedSize) / stats.originalSize * 100).toFixed(2);

    auditLogger.log('json_format_success', {
      inputLength: input.length,
      outputLength: formattedJSON.length,
      compressionRatio: stats.compressionRatio
    });

    res.json({
      success: true,
      formatted: formattedJSON,
      minified: minifiedJSON,
      warnings,
      stats,
      message: 'JSON formatted successfully'
    });

  } catch (error) {
    auditLogger.log('json_format_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// JSON Minifier endpoint
router.post('/minify', rateLimits.toolExecution, async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        error: 'JSON input string is required'
      });
    }

    auditLogger.log('json_minify_start', {
      inputLength: input.length
    });

    let jsonObject;
    try {
      jsonObject = JSON.parse(input);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON syntax',
        details: parseError.message
      });
    }

    const minified = JSON.stringify(jsonObject);
    const originalSize = input.length;
    const minifiedSize = minified.length;
    const compressionRatio = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);

    auditLogger.log('json_minify_success', {
      inputLength: originalSize,
      outputLength: minifiedSize,
      compressionRatio
    });

    res.json({
      success: true,
      minified,
      stats: {
        originalSize,
        minifiedSize,
        compressionRatio: `${compressionRatio}%`,
        spaceSaved: originalSize - minifiedSize
      },
      message: 'JSON minified successfully'
    });

  } catch (error) {
    auditLogger.log('json_minify_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function validateJSON(obj, path = '') {
  const warnings = [];
  
  function traverse(current, currentPath) {
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        traverse(item, `${currentPath}[${index}]`);
      });
    } else if (typeof current === 'object' && current !== null) {
      Object.keys(current).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        if (key.includes(' ')) {
          warnings.push({
            type: 'naming',
            message: `Property name contains spaces: "${key}"`,
            path: newPath
          });
        }
        
        if (current[key] === null) {
          warnings.push({
            type: 'value',
            message: `Null value found`,
            path: newPath
          });
        }
        
        traverse(current[key], newPath);
      });
    }
  }
  
  traverse(obj, path);
  return { warnings };
}

function getJSONStats(obj) {
  const stats = {
    type: Array.isArray(obj) ? 'array' : typeof obj,
    depth: 0,
    keys: 0,
    values: 0,
    arrays: 0,
    objects: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0
  };
  
  function analyze(current, depth = 0) {
    stats.depth = Math.max(stats.depth, depth);
    
    if (Array.isArray(current)) {
      stats.arrays++;
      current.forEach(item => analyze(item, depth + 1));
    } else if (typeof current === 'object' && current !== null) {
      stats.objects++;
      Object.keys(current).forEach(key => {
        stats.keys++;
        analyze(current[key], depth + 1);
      });
    } else {
      stats.values++;
      if (typeof current === 'string') stats.strings++;
      else if (typeof current === 'number') stats.numbers++;
      else if (typeof current === 'boolean') stats.booleans++;
      else if (current === null) stats.nulls++;
    }
  }
  
  analyze(obj);
  return stats;
}

function sortObjectKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  } else if (typeof obj === 'object' && obj !== null) {
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortObjectKeys(obj[key]);
    });
    return sorted;
  }
  return obj;
}

// Get tool info
router.get('/info', (req, res) => {
  res.json({
    name: 'JSON Formatter',
    description: 'Format, validate, and beautify JSON data with syntax highlighting and error detection',
    version: '1.0.0',
    category: 'Development Tools',
    endpoints: ['/format', '/minify'],
    features: [
      'JSON formatting and beautification',
      'JSON minification',
      'Syntax validation',
      'Error reporting with line numbers',
      'Statistics and analysis',
      'Key sorting',
      'Comment removal'
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tool: 'JSON Formatter',
    timestamp: new Date().toISOString(),
    endpoints: ['/format', '/minify', '/info', '/health']
  });
});

module.exports = router;
