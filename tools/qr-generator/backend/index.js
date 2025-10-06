const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas } = require('canvas');
const archiver = require('archiver');
const { rateLimits, auditLogger } = require('../../../backend/middleware/toolSecurity');

const router = express.Router();

// QR Code Generator endpoint
router.post('/generate', rateLimits.toolExecution, async (req, res) => {
  try {
    const { 
      text, 
      format = 'png', 
      width = 256, 
      height = 256, 
      margin = 4,
      color = { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel = 'M'
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Text content is required for QR code generation'
      });
    }

    if (text.length > 4296) {
      return res.status(400).json({
        error: 'Text content too long for QR code (max 4296 characters)'
      });
    }

    auditLogger.log('qr_generate_start', {
      textLength: text.length,
      format,
      dimensions: { width, height }
    });

    const qrOptions = {
      width,
      height,
      margin,
      color,
      errorCorrectionLevel,
      type: format === 'svg' ? 'svg' : 'png'
    };

    let outputPath;
    let qrData;

    if (format === 'svg') {
      qrData = await QRCode.toString(text, { ...qrOptions, type: 'svg' });
      outputPath = path.join('/tmp', `qr-${Date.now()}.svg`);
      await fs.writeFile(outputPath, qrData);
    } else {
      const canvas = createCanvas(width, height);
      await QRCode.toCanvas(canvas, text, qrOptions);
      
      outputPath = path.join('/tmp', `qr-${Date.now()}.${format}`);
      const buffer = canvas.toBuffer(format === 'jpeg' ? 'image/jpeg' : 'image/png');
      await fs.writeFile(outputPath, buffer);
      qrData = `data:image/${format};base64,${buffer.toString('base64')}`;
    }

    auditLogger.log('qr_generate_success', {
      textLength: text.length,
      format,
      fileSize: (await fs.stat(outputPath)).size
    });

    if (req.query.download === 'true') {
      res.download(outputPath, `qr-code.${format}`, (err) => {
        if (!err) {
          setTimeout(() => fs.unlink(outputPath).catch(() => {}), 5000);
        }
      });
    } else {
      res.json({
        success: true,
        dataUrl: qrData,
        format,
        dimensions: { width, height },
        textLength: text.length,
        downloadUrl: `/api/tools/qr-generator/download/${path.basename(outputPath)}`,
        message: 'QR code generated successfully'
      });

      setTimeout(() => fs.unlink(outputPath).catch(() => {}), 10 * 60 * 1000);
    }

  } catch (error) {
    auditLogger.log('qr_generate_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Batch QR Code Generator
router.post('/batch', rateLimits.toolExecution, async (req, res) => {
  try {
    const { 
      items, 
      format = 'png', 
      width = 256, 
      height = 256,
      filenamePrefix = 'qr'
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Items array is required for batch generation'
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 items allowed for batch generation'
      });
    }

    auditLogger.log('qr_batch_start', {
      itemCount: items.length,
      format
    });

    const results = [];
    const zipPath = path.join('/tmp', `qr-batch-${Date.now()}.zip`);
    const output = require('fs').createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const text = typeof item === 'string' ? item : item.text;
      const filename = typeof item === 'object' && item.filename ? item.filename : `${filenamePrefix}-${i + 1}`;

      try {
        const canvas = createCanvas(width, height);
        await QRCode.toCanvas(canvas, text, { width, height });
        
        const buffer = canvas.toBuffer(format === 'jpeg' ? 'image/jpeg' : 'image/png');
        const outputPath = path.join('/tmp', `${filename}.${format}`);
        await fs.writeFile(outputPath, buffer);

        archive.file(outputPath, { name: `${filename}.${format}` });

        results.push({
          index: i + 1,
          text,
          filename: `${filename}.${format}`,
          success: true
        });

        setTimeout(() => fs.unlink(outputPath).catch(() => {}), 1000);

      } catch (error) {
        results.push({
          index: i + 1,
          text,
          filename: `${filename}.${format}`,
          success: false,
          error: error.message
        });
      }
    }

    output.on('close', () => {
      const successCount = results.filter(r => r.success).length;
      
      auditLogger.log('qr_batch_success', {
        itemCount: items.length,
        successCount,
        failureCount: items.length - successCount
      });

      res.download(zipPath, 'qr-codes.zip', (err) => {
        if (!err) {
          setTimeout(() => fs.unlink(zipPath).catch(() => {}), 5000);
        }
      });
    });

    archive.pipe(output);
    archive.finalize();

  } catch (error) {
    auditLogger.log('qr_batch_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Download endpoint
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('/tmp', filename);
  
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

// Get tool info
router.get('/info', (req, res) => {
  res.json({
    name: 'QR Code Generator',
    description: 'Create high-quality QR codes for URLs, text, contact information, and more',
    version: '1.0.0',
    category: 'Productivity Tools',
    endpoints: ['/generate', '/batch', '/download/:filename'],
    supportedFormats: ['png', 'jpeg', 'svg'],
    maxTextLength: 4296,
    maxBatchSize: 100,
    features: [
      'Single QR generation',
      'Batch processing',
      'Custom colors',
      'Multiple formats',
      'Custom dimensions',
      'Error correction levels'
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tool: 'QR Code Generator',
    timestamp: new Date().toISOString(),
    endpoints: ['/generate', '/batch', '/download/:filename', '/info', '/health']
  });
});

module.exports = router;
