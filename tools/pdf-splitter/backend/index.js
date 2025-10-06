const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { rateLimits, auditLogger } = require('../../../backend/middleware/toolSecurity');

const router = express.Router();

// Configure multer for PDF files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Parse page ranges (e.g., "1-5, 10-15")
function parsePageRanges(rangeString) {
  const ranges = [];
  const parts = rangeString.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      ranges.push({ start, end });
    } else {
      const page = parseInt(trimmed);
      ranges.push({ start: page, end: page });
    }
  }
  
  return ranges;
}

// PDF Splitter endpoint
router.post('/split', rateLimits.toolExecution, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { splitType, pageRanges } = req.body;
    
    if (!file || file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    auditLogger.log('pdf_split_start', {
      fileName: file.originalname,
      fileSize: file.size,
      splitType
    });

    const pdfBytes = file.buffer;
    const pdf = await PDFDocument.load(pdfBytes);
    const pageCount = pdf.getPageCount();
    
    const results = [];
    
    if (splitType === 'pages') {
      // Split into individual pages
      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);
        
        const pdfBytes = await newPdf.save();
        const outputPath = path.join('/tmp', `page-${i + 1}-${Date.now()}.pdf`);
        await fs.writeFile(outputPath, pdfBytes);
        
        results.push({
          page: i + 1,
          outputPath,
          fileSize: pdfBytes.length
        });
      }
    } else if (splitType === 'range' && pageRanges) {
      // Split by page ranges
      const ranges = parsePageRanges(pageRanges);
      
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const newPdf = await PDFDocument.create();
        
        const pageIndices = [];
        for (let page = range.start - 1; page < range.end && page < pageCount; page++) {
          pageIndices.push(page);
        }
        
        const pages = await newPdf.copyPages(pdf, pageIndices);
        pages.forEach((page) => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        const outputPath = path.join('/tmp', `range-${range.start}-${range.end}-${Date.now()}.pdf`);
        await fs.writeFile(outputPath, pdfBytes);
        
        results.push({
          range: `${range.start}-${range.end}`,
          outputPath,
          fileSize: pdfBytes.length,
          pageCount: pageIndices.length
        });
      }
    }

    auditLogger.log('pdf_split_success', {
      fileName: file.originalname,
      outputFiles: results.length,
      originalPages: pageCount
    });

    // Create ZIP file with all split PDFs
    const zipPath = path.join('/tmp', `split-${Date.now()}.zip`);
    const output = require('fs').createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.download(zipPath, 'split-pdfs.zip', (err) => {
        if (!err) {
          setTimeout(() => {
            fs.unlink(zipPath).catch(() => {});
            results.forEach(r => fs.unlink(r.outputPath).catch(() => {}));
          }, 5000);
        }
      });
    });

    archive.pipe(output);
    
    for (const splitResult of results) {
      const fileName = path.basename(splitResult.outputPath);
      archive.file(splitResult.outputPath, { name: fileName });
    }
    
    archive.finalize();

  } catch (error) {
    auditLogger.log('pdf_split_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get tool info
router.get('/info', (req, res) => {
  res.json({
    name: 'PDF Splitter',
    description: 'Split PDF into separate pages or extract specific page ranges',
    version: '1.0.0',
    category: 'PDF Tools',
    endpoints: ['/split'],
    supportedFormats: ['application/pdf'],
    maxFileSize: '100MB',
    splitTypes: ['pages', 'range'],
    features: [
      'Split by individual pages',
      'Split by custom ranges',
      'ZIP archive output',
      'Progress tracking',
      'Error handling'
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tool: 'PDF Splitter',
    timestamp: new Date().toISOString(),
    endpoints: ['/split', '/info', '/health']
  });
});

module.exports = router;
