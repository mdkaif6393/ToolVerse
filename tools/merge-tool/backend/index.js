const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { rateLimits, auditLogger } = require('../../../backend/middleware/toolSecurity');

const router = express.Router();

// Configure multer for PDF files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// PDF Merger endpoint
router.post('/merge', rateLimits.toolExecution, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    
    if (!files || files.length < 2) {
      return res.status(400).json({
        error: 'At least 2 PDF files are required for merging'
      });
    }

    // Validate all files are PDFs
    const invalidFiles = files.filter(file => file.mimetype !== 'application/pdf');
    if (invalidFiles.length > 0) {
      return res.status(400).json({
        error: 'All files must be PDF format',
        invalidFiles: invalidFiles.map(f => f.originalname)
      });
    }

    auditLogger.log('pdf_merge_start', {
      fileCount: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0)
    });

    // Create new PDF document
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
      const pdfBytes = file.buffer;
      const pdf = await PDFDocument.load(pdfBytes);
      const pageIndices = pdf.getPageIndices();
      
      const pages = await mergedPdf.copyPages(pdf, pageIndices);
      pages.forEach((page) => mergedPdf.addPage(page));
    }
    
    const pdfBytes = await mergedPdf.save();
    const outputPath = path.join('/tmp', `merged-${Date.now()}.pdf`);
    await fs.writeFile(outputPath, pdfBytes);
    
    auditLogger.log('pdf_merge_success', {
      fileCount: files.length,
      outputSize: pdfBytes.length,
      pageCount: mergedPdf.getPageCount()
    });

    // Send file for download
    res.download(outputPath, 'merged-document.pdf', (err) => {
      if (!err) {
        // Cleanup after download
        setTimeout(() => fs.unlink(outputPath).catch(() => {}), 5000);
      }
    });

  } catch (error) {
    auditLogger.log('pdf_merge_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get merge tool info
router.get('/info', (req, res) => {
  res.json({
    name: 'PDF Merger',
    description: 'Combine multiple PDF documents into a single file',
    version: '1.0.0',
    category: 'PDF Tools',
    endpoints: ['/merge'],
    supportedFormats: ['application/pdf'],
    maxFiles: 10,
    maxFileSize: '50MB',
    features: [
      'Merge multiple PDFs',
      'Maintain original quality',
      'Automatic file validation',
      'Progress tracking',
      'Error handling'
    ]
  });
});

// Health check for merge tool
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tool: 'PDF Merger',
    timestamp: new Date().toISOString(),
    endpoints: ['/merge', '/info', '/health']
  });
});

module.exports = router;
