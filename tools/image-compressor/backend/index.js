const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { rateLimits, auditLogger } = require('../../../backend/middleware/toolSecurity');

const router = express.Router();

// Configure multer for image files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Image Compressor endpoint
router.post('/compress', rateLimits.toolExecution, upload.array('files', 20), async (req, res) => {
  try {
    const files = req.files;
    const { 
      quality = 80, 
      format = 'original', 
      width, 
      height, 
      maintainAspectRatio = true 
    } = req.body;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'At least one image file is required'
      });
    }

    auditLogger.log('image_compress_start', {
      fileCount: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
      quality: parseInt(quality)
    });

    const results = [];
    const outputDir = path.join('/tmp', `compressed-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    for (const file of files) {
      try {
        let sharpInstance = sharp(file.buffer);
        
        // Get original metadata
        const metadata = await sharpInstance.metadata();
        
        // Resize if dimensions provided
        if (width || height) {
          const resizeOptions = {
            width: width ? parseInt(width) : undefined,
            height: height ? parseInt(height) : undefined,
            fit: maintainAspectRatio ? 'inside' : 'fill',
            withoutEnlargement: true
          };
          sharpInstance = sharpInstance.resize(resizeOptions);
        }
        
        // Determine output format
        let outputFormat = format === 'original' ? metadata.format : format;
        let outputExtension = outputFormat;
        
        // Apply format-specific compression
        switch (outputFormat) {
          case 'jpeg':
          case 'jpg':
            sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality) });
            outputExtension = 'jpg';
            break;
          case 'png':
            sharpInstance = sharpInstance.png({ 
              quality: parseInt(quality),
              compressionLevel: Math.floor((100 - parseInt(quality)) / 10)
            });
            break;
          case 'webp':
            sharpInstance = sharpInstance.webp({ quality: parseInt(quality) });
            break;
          case 'avif':
            sharpInstance = sharpInstance.avif({ quality: parseInt(quality) });
            break;
          default:
            // Keep original format
            break;
        }
        
        // Generate output
        const outputBuffer = await sharpInstance.toBuffer();
        const outputFilename = `${path.parse(file.originalname).name}.${outputExtension}`;
        const outputPath = path.join(outputDir, outputFilename);
        
        await fs.writeFile(outputPath, outputBuffer);
        
        // Calculate compression stats
        const originalSize = file.size;
        const compressedSize = outputBuffer.length;
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
        
        results.push({
          originalName: file.originalname,
          outputName: outputFilename,
          originalSize,
          compressedSize,
          compressionRatio: `${compressionRatio}%`,
          spaceSaved: originalSize - compressedSize,
          outputPath,
          success: true
        });
        
      } catch (error) {
        results.push({
          originalName: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    const successfulResults = results.filter(r => r.success);
    
    auditLogger.log('image_compress_success', {
      fileCount: files.length,
      successCount: successfulResults.length,
      totalOriginalSize: successfulResults.reduce((acc, r) => acc + r.originalSize, 0),
      totalCompressedSize: successfulResults.reduce((acc, r) => acc + r.compressedSize, 0)
    });

    if (successfulResults.length === 1) {
      // Single file - direct download
      const result = successfulResults[0];
      res.download(result.outputPath, result.outputName, (err) => {
        if (!err) {
          setTimeout(() => {
            fs.rm(outputDir, { recursive: true }).catch(() => {});
          }, 5000);
        }
      });
    } else {
      // Multiple files - create ZIP
      const zipPath = path.join('/tmp', `compressed-images-${Date.now()}.zip`);
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        res.download(zipPath, 'compressed-images.zip', (err) => {
          if (!err) {
            setTimeout(() => {
              fs.unlink(zipPath).catch(() => {});
              fs.rm(outputDir, { recursive: true }).catch(() => {});
            }, 5000);
          }
        });
      });

      archive.pipe(output);
      
      for (const result of successfulResults) {
        archive.file(result.outputPath, { name: result.outputName });
      }
      
      // Add compression report
      const report = {
        summary: {
          totalFiles: files.length,
          successfulFiles: successfulResults.length,
          failedFiles: results.filter(r => !r.success).length,
          totalOriginalSize: successfulResults.reduce((acc, r) => acc + r.originalSize, 0),
          totalCompressedSize: successfulResults.reduce((acc, r) => acc + r.compressedSize, 0),
          totalSpaceSaved: successfulResults.reduce((acc, r) => acc + r.spaceSaved, 0)
        },
        results
      };
      
      archive.append(JSON.stringify(report, null, 2), { name: 'compression-report.json' });
      archive.finalize();
    }

  } catch (error) {
    auditLogger.log('image_compress_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Image Resize endpoint
router.post('/resize', rateLimits.toolExecution, upload.array('files', 20), async (req, res) => {
  try {
    const files = req.files;
    const { width, height, fit = 'inside', format = 'original' } = req.body;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'At least one image file is required'
      });
    }

    if (!width && !height) {
      return res.status(400).json({
        error: 'Width or height must be specified'
      });
    }

    auditLogger.log('image_resize_start', {
      fileCount: files.length,
      dimensions: { width: parseInt(width), height: parseInt(height) }
    });

    const results = [];
    const outputDir = path.join('/tmp', `resized-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    for (const file of files) {
      try {
        const sharpInstance = sharp(file.buffer);
        const metadata = await sharpInstance.metadata();
        
        const resizeOptions = {
          width: width ? parseInt(width) : undefined,
          height: height ? parseInt(height) : undefined,
          fit: fit,
          withoutEnlargement: true
        };
        
        let outputFormat = format === 'original' ? metadata.format : format;
        let processedImage = sharpInstance.resize(resizeOptions);
        
        // Apply format
        switch (outputFormat) {
          case 'jpeg':
          case 'jpg':
            processedImage = processedImage.jpeg({ quality: 90 });
            break;
          case 'png':
            processedImage = processedImage.png();
            break;
          case 'webp':
            processedImage = processedImage.webp({ quality: 90 });
            break;
        }
        
        const outputBuffer = await processedImage.toBuffer();
        const outputFilename = `${path.parse(file.originalname).name}_resized.${outputFormat}`;
        const outputPath = path.join(outputDir, outputFilename);
        
        await fs.writeFile(outputPath, outputBuffer);
        
        results.push({
          originalName: file.originalname,
          outputName: outputFilename,
          originalSize: file.size,
          newSize: outputBuffer.length,
          originalDimensions: { width: metadata.width, height: metadata.height },
          newDimensions: { width: parseInt(width) || metadata.width, height: parseInt(height) || metadata.height },
          outputPath,
          success: true
        });
        
      } catch (error) {
        results.push({
          originalName: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    const successfulResults = results.filter(r => r.success);
    
    auditLogger.log('image_resize_success', {
      fileCount: files.length,
      successCount: successfulResults.length
    });

    if (successfulResults.length === 1) {
      const result = successfulResults[0];
      res.download(result.outputPath, result.outputName, (err) => {
        if (!err) {
          setTimeout(() => {
            fs.rm(outputDir, { recursive: true }).catch(() => {});
          }, 5000);
        }
      });
    } else {
      // Multiple files - create ZIP
      const zipPath = path.join('/tmp', `resized-images-${Date.now()}.zip`);
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        res.download(zipPath, 'resized-images.zip', (err) => {
          if (!err) {
            setTimeout(() => {
              fs.unlink(zipPath).catch(() => {});
              fs.rm(outputDir, { recursive: true }).catch(() => {});
            }, 5000);
          }
        });
      });

      archive.pipe(output);
      
      for (const result of successfulResults) {
        archive.file(result.outputPath, { name: result.outputName });
      }
      
      archive.finalize();
    }

  } catch (error) {
    auditLogger.log('image_resize_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get tool info
router.get('/info', (req, res) => {
  res.json({
    name: 'Image Compressor',
    description: 'Compress and optimize images while maintaining quality',
    version: '1.0.0',
    category: 'Design Tools',
    endpoints: ['/compress', '/resize'],
    supportedFormats: ['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif'],
    maxFiles: 20,
    maxFileSize: '50MB',
    features: [
      'Image compression with quality control',
      'Format conversion',
      'Batch processing',
      'Image resizing',
      'Aspect ratio preservation',
      'Compression statistics'
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tool: 'Image Compressor',
    timestamp: new Date().toISOString(),
    endpoints: ['/compress', '/resize', '/info', '/health']
  });
});

module.exports = router;
