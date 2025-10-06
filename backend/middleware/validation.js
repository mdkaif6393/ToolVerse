const Joi = require('joi');

// Validation schemas
const toolSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().min(1).max(100).pattern(/^[a-z0-9-]+$/).required(),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid('pdf', 'ai', 'business', 'design', 'development', 'productivity').required(),
  icon: Joi.string().max(10).default('🛠️'),
  version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).default('1.0.0'),
  language: Joi.string().max(50).allow(null),
  framework: Joi.string().max(50).allow(null),
  tech_stack: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).default([]),
  is_public: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false')
  ).default(true)
});

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  full_name: Joi.string().max(100).allow('')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  full_name: Joi.string().max(100).allow(''),
  bio: Joi.string().max(500).allow(''),
  avatar_url: Joi.string().uri().allow('')
});

const passwordChangeSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).max(128).required()
});

// Middleware functions
const validateTool = (req, res, next) => {
  const { error, value } = toolSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  req.body = value;
  next();
};

const validateUser = (req, res, next) => {
  const { error, value } = userSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  req.body = value;
  next();
};

const validateLogin = (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  req.body = value;
  next();
};

const validateProfileUpdate = (req, res, next) => {
  const { error, value } = profileUpdateSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  req.body = value;
  next();
};

const validatePasswordChange = (req, res, next) => {
  const { error, value } = passwordChangeSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  req.body = value;
  next();
};

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    req.body = value;
    next();
  };
};

// Query parameter validation
const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('created_at', 'updated_at', 'name', 'view_count', 'download_count').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  });
  
  const { error, value } = schema.validate(req.query, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: errors
    });
  }
  
  req.query = { ...req.query, ...value };
  next();
};

module.exports = {
  validateTool,
  validateUser,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validatePagination,
  validate,
  schemas: {
    toolSchema,
    userSchema,
    loginSchema,
    profileUpdateSchema,
    passwordChangeSchema
  }
};
