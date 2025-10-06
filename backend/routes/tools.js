const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const JSZip = require('jszip');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { validateTool } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.zip', '.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only code files and ZIP archives are allowed.'));
    }
  }
});

// ============================================================================
// TOOL CRUD OPERATIONS
// ============================================================================

// GET /api/tools - Get all tools for authenticated user
router.get('/', async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    let query = `
      SELECT t.*, 
             COUNT(*) OVER() as total_count,
             COALESCE(tf.file_count, 0) as file_count
      FROM tools t
      LEFT JOIN (
        SELECT tool_id, COUNT(*) as file_count 
        FROM tool_files 
        GROUP BY tool_id
      ) tf ON t.id = tf.tool_id
      WHERE (t.user_id = $1 OR t.is_public = true)
    `;
    
    const params = [userId];
    let paramIndex = 2;
    
    // Add filters
    if (category) {
      query += ` AND t.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    const tools = result.rows;
    const totalCount = tools.length > 0 ? parseInt(tools[0].total_count) : 0;
    
    res.json({
      tools: tools.map(tool => {
        const { total_count, ...toolData } = tool;
        return toolData;
      }),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

// GET /api/tools/:id - Get specific tool
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const tool = await db.getOne(`
      SELECT t.*, 
             array_agg(
               json_build_object(
                 'id', tf.id,
                 'filename', tf.filename,
                 'file_size', tf.file_size,
                 'file_type', tf.file_type,
                 'is_entry_point', tf.is_entry_point
               )
             ) FILTER (WHERE tf.id IS NOT NULL) as files
      FROM tools t
      LEFT JOIN tool_files tf ON t.id = tf.tool_id
      WHERE t.id = $1 AND (t.user_id = $2 OR t.is_public = true)
      GROUP BY t.id
    `, [id, userId]);
    
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    // Increment view count
    await db.query('SELECT increment_tool_view_count($1)', [id]);
    
    res.json(tool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    res.status(500).json({ error: 'Failed to fetch tool' });
  }
});

// POST /api/tools - Create new tool
router.post('/', upload.array('files', 10), validateTool, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      slug,
      description,
      category,
      icon,
      version,
      language,
      framework,
      tech_stack,
      is_public = true
    } = req.body;
    
    // Parse tech_stack if it's a string
    let parsedTechStack = [];
    if (tech_stack) {
      parsedTechStack = typeof tech_stack === 'string' ? JSON.parse(tech_stack) : tech_stack;
    }
    
    // Create tool record
    const tool = await db.insert('tools', {
      user_id: userId,
      name,
      slug,
      description,
      category,
      icon: icon || '🛠️',
      version: version || '1.0.0',
      language,
      framework,
      tech_stack: JSON.stringify(parsedTechStack),
      is_public: is_public === 'true' || is_public === true,
      status: 'active'
    });
    
    // Process uploaded files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await processUploadedFile(file, tool.id);
      }
    }
    
    res.status(201).json({
      message: 'Tool created successfully',
      tool
    });
  } catch (error) {
    console.error('Error creating tool:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
    }
    
    res.status(500).json({ error: 'Failed to create tool' });
  }
});

// PUT /api/tools/:id - Update tool
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user owns the tool
    const existingTool = await db.getOne(
      'SELECT * FROM tools WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (!existingTool) {
      return res.status(404).json({ error: 'Tool not found or access denied' });
    }
    
    const updateData = { ...req.body };
    
    // Parse tech_stack if provided
    if (updateData.tech_stack && typeof updateData.tech_stack === 'string') {
      updateData.tech_stack = JSON.stringify(JSON.parse(updateData.tech_stack));
    }
    
    const updatedTool = await db.update('tools', id, updateData);
    
    res.json({
      message: 'Tool updated successfully',
      tool: updatedTool
    });
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ error: 'Failed to update tool' });
  }
});

// DELETE /api/tools/:id - Delete tool (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user owns the tool
    const existingTool = await db.getOne(
      'SELECT * FROM tools WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (!existingTool) {
      return res.status(404).json({ error: 'Tool not found or access denied' });
    }
    
    const deletedTool = await db.softDelete('tools', id);
    
    res.json({
      message: 'Tool deleted successfully',
      tool: deletedTool
    });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ error: 'Failed to delete tool' });
  }
});

// ============================================================================
// FILE PROCESSING FUNCTIONS
// ============================================================================

async function processUploadedFile(file, toolId) {
  try {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (fileExtension === '.zip') {
      await processZipFile(file, toolId);
    } else {
      await processSingleFile(file, toolId);
    }
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}

async function processZipFile(file, toolId) {
  try {
    const zipData = await fs.readFile(file.path);
    const zip = await JSZip.loadAsync(zipData);
    
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const content = await zipEntry.async('text');
        const fileName = path.basename(relativePath);
        const fileSize = content.length;
        
        await db.insert('tool_files', {
          tool_id: toolId,
          filename: fileName,
          file_path: relativePath,
          file_size: fileSize,
          file_type: path.extname(fileName).toLowerCase(),
          mime_type: getMimeType(fileName),
          content: content.length < 1000000 ? content : null, // Store content only for small files
          is_entry_point: isEntryPoint(fileName)
        });
      }
    }
    
    // Clean up the ZIP file
    await fs.unlink(file.path);
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    throw error;
  }
}

async function processSingleFile(file, toolId) {
  try {
    const content = await fs.readFile(file.path, 'utf8');
    
    await db.insert('tool_files', {
      tool_id: toolId,
      filename: file.originalname,
      file_path: file.filename,
      file_size: file.size,
      file_type: path.extname(file.originalname).toLowerCase(),
      mime_type: file.mimetype,
      content: content.length < 1000000 ? content : null,
      is_entry_point: isEntryPoint(file.originalname)
    });
  } catch (error) {
    console.error('Error processing single file:', error);
    throw error;
  }
}

// Helper functions
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.jsx': 'application/javascript',
    '.tsx': 'application/typescript',
    '.py': 'text/x-python',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.java': 'text/x-java',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css': 'text/css',
    '.md': 'text/markdown'
  };
  return mimeTypes[ext] || 'text/plain';
}

function isEntryPoint(filename) {
  const entryPoints = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'main.py', '__main__.py'];
  return entryPoints.includes(filename.toLowerCase());
}

module.exports = router;
