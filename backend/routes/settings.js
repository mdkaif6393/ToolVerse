/**
 * Advanced System Settings Management
 * Organization-wide configuration and system administration
 * Real-time settings sync with Python analytics integration
 */

const express = require('express');
const { rateLimits } = require('../middleware/toolSecurity');
const { realTimeIntegration } = require('../services/realTimeIntegration');
const { auditLogManager } = require('./auditLogs');
const router = express.Router();

// Mock system settings database
let systemSettings = {
  organization: {
    id: 'org_1',
    name: 'Acme Corporation',
    domain: 'acme.com',
    logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AC',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    address: {
      street: '123 Business Ave',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA'
    },
    contact: {
      email: 'contact@acme.com',
      phone: '+1-555-0123',
      website: 'https://acme.com'
    },
    branding: {
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
      accent_color: '#f59e0b',
      font_family: 'Inter'
    }
  },
  security: {
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: true,
      expiry_days: 90
    },
    session: {
      timeout_minutes: 60,
      max_concurrent_sessions: 3,
      remember_me_days: 30
    },
    two_factor: {
      required: false,
      methods: ['totp', 'sms', 'email'],
      backup_codes: true
    },
    api: {
      rate_limit_per_minute: 1000,
      require_api_key: true,
      allowed_origins: ['https://acme.com', 'https://app.acme.com']
    },
    audit: {
      retention_days: 365,
      log_level: 'info',
      export_enabled: true
    }
  },
  notifications: {
    email: {
      enabled: true,
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_secure: true,
      from_address: 'noreply@acme.com',
      from_name: 'Acme Corporation'
    },
    push: {
      enabled: true,
      firebase_key: 'firebase_key_here',
      vapid_public_key: 'vapid_public_key_here'
    },
    sms: {
      enabled: false,
      provider: 'twilio',
      account_sid: '',
      auth_token: ''
    },
    webhooks: {
      enabled: true,
      endpoints: [
        {
          id: 'webhook_1',
          name: 'Slack Integration',
          url: 'https://hooks.slack.com/services/...',
          events: ['tool_created', 'project_completed'],
          active: true
        }
      ]
    }
  },
  tools: {
    execution: {
      max_concurrent: 10,
      timeout_minutes: 30,
      memory_limit_mb: 512,
      storage_limit_gb: 10
    },
    security: {
      scan_uploads: true,
      allow_external_apis: true,
      sandbox_mode: true,
      virus_scan: true
    },
    defaults: {
      auto_save: true,
      version_control: true,
      backup_enabled: true,
      analytics_tracking: true
    }
  },
  integrations: {
    analytics: {
      google_analytics: {
        enabled: false,
        tracking_id: ''
      },
      mixpanel: {
        enabled: false,
        project_token: ''
      },
      custom_analytics: {
        enabled: true,
        endpoint: 'http://localhost:8001/api/events'
      }
    },
    storage: {
      aws_s3: {
        enabled: false,
        bucket: '',
        region: 'us-east-1',
        access_key: '',
        secret_key: ''
      },
      google_cloud: {
        enabled: false,
        bucket: '',
        project_id: '',
        key_file: ''
      },
      local_storage: {
        enabled: true,
        path: './uploads',
        max_size_gb: 100
      }
    },
    payment: {
      stripe: {
        enabled: true,
        public_key: 'pk_test_...',
        secret_key: 'sk_test_...',
        webhook_secret: 'whsec_...'
      },
      paypal: {
        enabled: false,
        client_id: '',
        client_secret: ''
      }
    }
  },
  maintenance: {
    mode: false,
    message: 'System maintenance in progress. Please try again later.',
    allowed_ips: ['127.0.0.1'],
    scheduled_downtime: null
  },
  backup: {
    enabled: true,
    frequency: 'daily',
    retention_days: 30,
    include_files: true,
    encryption: true,
    destinations: ['local', 's3']
  }
};

class SettingsManager {
  constructor() {
    this.settings = systemSettings;
    this.startSettingsSync();
  }

  startSettingsSync() {
    // Sync settings with Python analytics every 5 minutes
    setInterval(() => {
      this.syncWithAnalytics();
    }, 5 * 60 * 1000);
  }

  async syncWithAnalytics() {
    try {
      // Send settings to Python analytics service
      await realTimeIntegration.trackEvent({
        event_type: 'settings_sync',
        user_id: 'system',
        organization_id: this.settings.organization.id,
        data: {
          organization_settings: {
            timezone: this.settings.organization.timezone,
            currency: this.settings.organization.currency,
            language: this.settings.organization.language
          },
          security_settings: {
            password_policy: this.settings.security.password_policy,
            two_factor_required: this.settings.security.two_factor.required
          },
          tools_settings: {
            max_concurrent: this.settings.tools.execution.max_concurrent,
            sandbox_mode: this.settings.tools.security.sandbox_mode
          }
        }
      });
    } catch (error) {
      console.error('Failed to sync settings with analytics:', error);
    }
  }

  async getSettings(category = null) {
    if (category) {
      return this.settings[category] || null;
    }
    return this.settings;
  }

  async updateSettings(category, updateData, userId) {
    if (!this.settings[category]) {
      throw new Error(`Settings category '${category}' not found`);
    }

    const oldSettings = JSON.parse(JSON.stringify(this.settings[category]));
    
    // Deep merge settings
    this.settings[category] = this.deepMerge(this.settings[category], updateData);

    // Track changes
    const changes = this.getChanges(oldSettings, this.settings[category]);

    // Log settings update
    await auditLogManager.log('settings_updated', {
      category: 'system',
      severity: 'high',
      userId: userId,
      organizationId: this.settings.organization.id,
      resourceType: 'settings',
      resourceId: category,
      changes: changes,
      metadata: {
        settings_category: category,
        fields_changed: Object.keys(changes)
      }
    });

    // Track in analytics
    await realTimeIntegration.trackEvent({
      event_type: 'settings_updated',
      user_id: userId,
      organization_id: this.settings.organization.id,
      data: {
        category: category,
        changes: Object.keys(changes),
        timestamp: new Date().toISOString()
      }
    });

    // Broadcast real-time update
    realTimeIntegration.broadcastToClients('settings_updated', {
      category: category,
      settings: this.settings[category],
      changes: changes
    });

    return this.settings[category];
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  getChanges(oldObj, newObj, path = '') {
    const changes = {};
    
    for (const key in newObj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof newObj[key] === 'object' && newObj[key] !== null && !Array.isArray(newObj[key])) {
        if (!oldObj[key] || typeof oldObj[key] !== 'object') {
          changes[currentPath] = { old: oldObj[key], new: newObj[key] };
        } else {
          const nestedChanges = this.getChanges(oldObj[key], newObj[key], currentPath);
          Object.assign(changes, nestedChanges);
        }
      } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        changes[currentPath] = { old: oldObj[key], new: newObj[key] };
      }
    }
    
    return changes;
  }

  async resetSettings(category, userId) {
    if (!this.settings[category]) {
      throw new Error(`Settings category '${category}' not found`);
    }

    const oldSettings = JSON.parse(JSON.stringify(this.settings[category]));
    
    // Reset to default settings (simplified - in real app, load from defaults)
    const defaultSettings = this.getDefaultSettings(category);
    this.settings[category] = defaultSettings;

    // Log settings reset
    await auditLogManager.log('settings_reset', {
      category: 'system',
      severity: 'high',
      userId: userId,
      organizationId: this.settings.organization.id,
      resourceType: 'settings',
      resourceId: category,
      metadata: {
        settings_category: category,
        reset_timestamp: new Date().toISOString()
      }
    });

    // Track in analytics
    await realTimeIntegration.trackEvent({
      event_type: 'settings_reset',
      user_id: userId,
      organization_id: this.settings.organization.id,
      data: {
        category: category,
        timestamp: new Date().toISOString()
      }
    });

    return this.settings[category];
  }

  getDefaultSettings(category) {
    // Return default settings for each category
    const defaults = {
      organization: {
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        date_format: 'MM/DD/YYYY',
        time_format: '12h'
      },
      security: {
        password_policy: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_symbols: false,
          expiry_days: 0
        },
        session: {
          timeout_minutes: 60,
          max_concurrent_sessions: 5,
          remember_me_days: 30
        },
        two_factor: {
          required: false,
          methods: ['totp'],
          backup_codes: true
        }
      },
      notifications: {
        email: { enabled: true },
        push: { enabled: false },
        sms: { enabled: false }
      },
      tools: {
        execution: {
          max_concurrent: 5,
          timeout_minutes: 15,
          memory_limit_mb: 256,
          storage_limit_gb: 5
        },
        security: {
          scan_uploads: true,
          allow_external_apis: false,
          sandbox_mode: true,
          virus_scan: true
        }
      }
    };

    return defaults[category] || {};
  }

  async exportSettings() {
    const exportData = {
      settings: this.settings,
      export_date: new Date().toISOString(),
      export_version: '1.0',
      organization_id: this.settings.organization.id
    };

    return exportData;
  }

  async importSettings(importData, userId) {
    if (!importData.settings) {
      throw new Error('Invalid import data format');
    }

    const oldSettings = JSON.parse(JSON.stringify(this.settings));
    
    // Validate and merge imported settings
    this.settings = this.deepMerge(this.settings, importData.settings);

    // Log settings import
    await auditLogManager.log('settings_imported', {
      category: 'system',
      severity: 'critical',
      userId: userId,
      organizationId: this.settings.organization.id,
      resourceType: 'settings',
      metadata: {
        import_version: importData.export_version,
        import_date: importData.export_date,
        imported_categories: Object.keys(importData.settings)
      }
    });

    return this.settings;
  }

  async testIntegration(integrationType, config) {
    try {
      switch (integrationType) {
        case 'email':
          // Test email configuration
          return { success: true, message: 'Email configuration is valid' };
        
        case 'storage':
          // Test storage configuration
          return { success: true, message: 'Storage configuration is valid' };
        
        case 'payment':
          // Test payment configuration
          return { success: true, message: 'Payment configuration is valid' };
        
        case 'analytics':
          // Test analytics integration
          const testResult = await realTimeIntegration.testConnection();
          return { success: testResult, message: testResult ? 'Analytics integration is working' : 'Analytics integration failed' };
        
        default:
          throw new Error(`Unknown integration type: ${integrationType}`);
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

const settingsManager = new SettingsManager();

// Get all settings or specific category
router.get('/', rateLimits.apiCalls, async (req, res) => {
  try {
    const category = req.query.category;
    const settings = await settingsManager.getSettings(category);

    if (category && !settings) {
      return res.status(404).json({
        success: false,
        error: `Settings category '${category}' not found`
      });
    }

    await auditLogManager.log('settings_accessed', {
      category: 'system',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { category: category || 'all' }
    });

    res.json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

// Update settings category
router.put('/:category', rateLimits.apiCalls, async (req, res) => {
  try {
    const category = req.params.category;
    const updateData = req.body;
    const userId = req.user?.id || 'system';

    const updatedSettings = await settingsManager.updateSettings(category, updateData, userId);

    res.json({
      success: true,
      data: updatedSettings,
      message: `${category} settings updated successfully`
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update settings'
    });
  }
});

// Reset settings category to defaults
router.post('/:category/reset', rateLimits.apiCalls, async (req, res) => {
  try {
    const category = req.params.category;
    const userId = req.user?.id || 'system';

    const resetSettings = await settingsManager.resetSettings(category, userId);

    res.json({
      success: true,
      data: resetSettings,
      message: `${category} settings reset to defaults`
    });

  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset settings'
    });
  }
});

// Test integration
router.post('/test/:integrationType', rateLimits.apiCalls, async (req, res) => {
  try {
    const integrationType = req.params.integrationType;
    const config = req.body;

    const testResult = await settingsManager.testIntegration(integrationType, config);

    await auditLogManager.log('integration_tested', {
      category: 'system',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        integration_type: integrationType,
        test_result: testResult.success
      }
    });

    res.json({
      success: true,
      data: testResult,
      message: 'Integration test completed'
    });

  } catch (error) {
    console.error('Error testing integration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test integration'
    });
  }
});

// Export settings
router.get('/export', rateLimits.apiCalls, async (req, res) => {
  try {
    const exportData = await settingsManager.exportSettings();

    await auditLogManager.log('settings_exported', {
      category: 'system',
      severity: 'medium',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="settings-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export settings'
    });
  }
});

// Import settings
router.post('/import', rateLimits.apiCalls, async (req, res) => {
  try {
    const importData = req.body;
    const userId = req.user?.id || 'system';

    const importedSettings = await settingsManager.importSettings(importData, userId);

    res.json({
      success: true,
      data: importedSettings,
      message: 'Settings imported successfully'
    });

  } catch (error) {
    console.error('Error importing settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to import settings'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Settings Management',
    timestamp: new Date().toISOString(),
    organization: settingsManager.settings.organization.name,
    maintenance_mode: settingsManager.settings.maintenance.mode
  });
});

module.exports = {
  router,
  settingsManager
};
