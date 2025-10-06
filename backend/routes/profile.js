/**
 * Advanced Profile Management System
 * User preferences, security settings, and account management
 * Real-time profile updates with Python analytics integration
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { rateLimits } = require('../middleware/toolSecurity');
const { realTimeIntegration } = require('../services/realTimeIntegration');
const { auditLogManager } = require('./auditLogs');
const router = express.Router();

// Mock user profiles database
let userProfiles = [
  {
    id: 'john_doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    display_name: 'John Doe',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    phone: '+1-555-0123',
    timezone: 'America/New_York',
    language: 'en',
    role: 'admin',
    organization_id: 'org_1',
    organization_name: 'Acme Corporation',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-10-03T14:20:00Z',
    last_login: '2024-10-04T05:30:00Z',
    login_count: 245,
    is_active: true,
    is_verified: true,
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false
      },
      dashboard: {
        layout: 'grid',
        widgets: ['analytics', 'recent_tools', 'projects', 'clients'],
        refresh_interval: 30
      },
      tools: {
        auto_save: true,
        default_format: 'pdf',
        quality_preset: 'high'
      }
    },
    security: {
      two_factor_enabled: true,
      password_last_changed: '2024-08-15T00:00:00Z',
      failed_login_attempts: 0,
      account_locked: false,
      trusted_devices: [
        {
          id: 'device_1',
          name: 'MacBook Pro',
          last_used: '2024-10-04T05:30:00Z',
          ip_address: '192.168.1.100'
        }
      ],
      api_keys: [
        {
          id: 'key_1',
          name: 'Production API',
          key: 'sk_prod_abc123...',
          created_at: '2024-09-01T00:00:00Z',
          last_used: '2024-10-03T12:00:00Z',
          permissions: ['read', 'write']
        }
      ]
    },
    billing: {
      plan: 'pro',
      subscription_id: 'sub_123',
      billing_email: 'billing@example.com',
      payment_method: 'card_ending_4242',
      next_billing_date: '2024-11-01T00:00:00Z',
      usage: {
        tools_executed: 1250,
        storage_used: 2.5, // GB
        api_calls: 15000
      }
    },
    activity_stats: {
      tools_created: 15,
      projects_completed: 8,
      total_revenue: 45000,
      client_satisfaction: 4.8
    }
  }
];

class ProfileManager {
  constructor() {
    this.profiles = userProfiles;
    this.startActivityTracking();
  }

  startActivityTracking() {
    // Update activity stats every hour
    setInterval(() => {
      this.updateActivityStats();
    }, 60 * 60 * 1000);
  }

  async updateActivityStats() {
    // Update user activity statistics
    this.profiles.forEach(async (profile) => {
      // Track user activity in Python analytics
      await realTimeIntegration.trackEvent({
        event_type: 'user_activity_update',
        user_id: profile.id,
        organization_id: profile.organization_id,
        data: {
          login_count: profile.login_count,
          tools_created: profile.activity_stats.tools_created,
          projects_completed: profile.activity_stats.projects_completed,
          last_login: profile.last_login
        }
      });
    });
  }

  async getProfile(userId) {
    const profile = this.profiles.find(p => p.id === userId);
    if (!profile) return null;

    // Remove sensitive data
    const safeProfile = { ...profile };
    delete safeProfile.security.api_keys;
    delete safeProfile.billing.payment_method;

    return safeProfile;
  }

  async updateProfile(userId, updateData) {
    const profileIndex = this.profiles.findIndex(p => p.id === userId);
    if (profileIndex === -1) return null;

    const oldProfile = { ...this.profiles[profileIndex] };
    const updatedProfile = {
      ...this.profiles[profileIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    this.profiles[profileIndex] = updatedProfile;

    // Track changes
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (JSON.stringify(oldProfile[key]) !== JSON.stringify(updateData[key])) {
        changes[key] = {
          old: oldProfile[key],
          new: updateData[key]
        };
      }
    });

    // Track profile update
    await realTimeIntegration.trackEvent({
      event_type: 'profile_updated',
      user_id: userId,
      organization_id: updatedProfile.organization_id,
      data: {
        changes: Object.keys(changes),
        fields_updated: Object.keys(updateData)
      }
    });

    // Broadcast real-time update
    realTimeIntegration.broadcastToClients('profile_updated', {
      user_id: userId,
      changes
    });

    return updatedProfile;
  }

  async updatePreferences(userId, preferences) {
    const profileIndex = this.profiles.findIndex(p => p.id === userId);
    if (profileIndex === -1) return null;

    this.profiles[profileIndex].preferences = {
      ...this.profiles[profileIndex].preferences,
      ...preferences
    };
    this.profiles[profileIndex].updated_at = new Date().toISOString();

    // Track preference changes
    await realTimeIntegration.trackEvent({
      event_type: 'preferences_updated',
      user_id: userId,
      organization_id: this.profiles[profileIndex].organization_id,
      data: {
        preferences_changed: Object.keys(preferences)
      }
    });

    return this.profiles[profileIndex];
  }

  async updateSecurity(userId, securityData) {
    const profileIndex = this.profiles.findIndex(p => p.id === userId);
    if (profileIndex === -1) return null;

    const profile = this.profiles[profileIndex];

    // Handle password change
    if (securityData.new_password) {
      if (!securityData.current_password) {
        throw new Error('Current password is required');
      }

      // In real implementation, verify current password
      const hashedPassword = await bcrypt.hash(securityData.new_password, 10);
      profile.security.password_last_changed = new Date().toISOString();
      
      // Track password change
      await realTimeIntegration.trackEvent({
        event_type: 'password_changed',
        user_id: userId,
        organization_id: profile.organization_id,
        data: {
          timestamp: new Date().toISOString()
        }
      });
    }

    // Handle 2FA toggle
    if (typeof securityData.two_factor_enabled === 'boolean') {
      profile.security.two_factor_enabled = securityData.two_factor_enabled;
      
      await realTimeIntegration.trackEvent({
        event_type: securityData.two_factor_enabled ? '2fa_enabled' : '2fa_disabled',
        user_id: userId,
        organization_id: profile.organization_id,
        data: {
          timestamp: new Date().toISOString()
        }
      });
    }

    profile.updated_at = new Date().toISOString();
    return profile;
  }

  async createApiKey(userId, keyData) {
    const profileIndex = this.profiles.findIndex(p => p.id === userId);
    if (profileIndex === -1) return null;

    const profile = this.profiles[profileIndex];
    const newKey = {
      id: `key_${Date.now()}`,
      name: keyData.name,
      key: `sk_${keyData.name.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 20)}`,
      created_at: new Date().toISOString(),
      last_used: null,
      permissions: keyData.permissions || ['read']
    };

    profile.security.api_keys.push(newKey);
    profile.updated_at = new Date().toISOString();

    // Track API key creation
    await realTimeIntegration.trackEvent({
      event_type: 'api_key_created',
      user_id: userId,
      organization_id: profile.organization_id,
      data: {
        key_name: newKey.name,
        permissions: newKey.permissions
      }
    });

    return newKey;
  }

  async revokeApiKey(userId, keyId) {
    const profileIndex = this.profiles.findIndex(p => p.id === userId);
    if (profileIndex === -1) return false;

    const profile = this.profiles[profileIndex];
    const keyIndex = profile.security.api_keys.findIndex(k => k.id === keyId);
    
    if (keyIndex === -1) return false;

    const revokedKey = profile.security.api_keys[keyIndex];
    profile.security.api_keys.splice(keyIndex, 1);
    profile.updated_at = new Date().toISOString();

    // Track API key revocation
    await realTimeIntegration.trackEvent({
      event_type: 'api_key_revoked',
      user_id: userId,
      organization_id: profile.organization_id,
      data: {
        key_name: revokedKey.name,
        key_id: keyId
      }
    });

    return true;
  }

  async getActivityHistory(userId, filters = {}) {
    // In real implementation, fetch from audit logs
    const activities = [
      {
        id: 1,
        type: 'login',
        description: 'User logged in',
        timestamp: '2024-10-04T05:30:00Z',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...'
      },
      {
        id: 2,
        type: 'tool_created',
        description: 'Created PDF Merger tool',
        timestamp: '2024-10-03T14:20:00Z',
        metadata: { tool_name: 'PDF Merger' }
      }
    ];

    // Apply filters
    let filteredActivities = activities;
    
    if (filters.type) {
      filteredActivities = filteredActivities.filter(a => a.type === filters.type);
    }

    if (filters.start_date) {
      filteredActivities = filteredActivities.filter(a => 
        new Date(a.timestamp) >= new Date(filters.start_date)
      );
    }

    if (filters.end_date) {
      filteredActivities = filteredActivities.filter(a => 
        new Date(a.timestamp) <= new Date(filters.end_date)
      );
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const startIndex = (page - 1) * limit;

    return {
      activities: filteredActivities.slice(startIndex, startIndex + limit),
      pagination: {
        current_page: page,
        per_page: limit,
        total_activities: filteredActivities.length,
        total_pages: Math.ceil(filteredActivities.length / limit)
      }
    };
  }

  async exportUserData(userId) {
    const profile = this.profiles.find(p => p.id === userId);
    if (!profile) return null;

    // Get user's activity history
    const activityHistory = await this.getActivityHistory(userId, { limit: 1000 });

    const exportData = {
      profile: {
        ...profile,
        // Remove sensitive data
        security: {
          ...profile.security,
          api_keys: profile.security.api_keys.map(key => ({
            ...key,
            key: key.key.substring(0, 10) + '...' // Mask API keys
          }))
        }
      },
      activity_history: activityHistory.activities,
      export_date: new Date().toISOString(),
      export_version: '1.0'
    };

    // Track data export
    await realTimeIntegration.trackEvent({
      event_type: 'user_data_exported',
      user_id: userId,
      organization_id: profile.organization_id,
      data: {
        export_size: JSON.stringify(exportData).length,
        timestamp: new Date().toISOString()
      }
    });

    return exportData;
  }

  async deleteAccount(userId, confirmationData) {
    const profileIndex = this.profiles.findIndex(p => p.id === userId);
    if (profileIndex === -1) return false;

    const profile = this.profiles[profileIndex];

    // Verify confirmation
    if (confirmationData.confirmation_text !== 'DELETE MY ACCOUNT') {
      throw new Error('Invalid confirmation text');
    }

    // Mark account as deleted (soft delete)
    profile.is_active = false;
    profile.deleted_at = new Date().toISOString();
    profile.updated_at = new Date().toISOString();

    // Track account deletion
    await realTimeIntegration.trackEvent({
      event_type: 'account_deleted',
      user_id: userId,
      organization_id: profile.organization_id,
      data: {
        deletion_reason: confirmationData.reason,
        timestamp: new Date().toISOString()
      }
    });

    return true;
  }
}

const profileManager = new ProfileManager();

// Get user profile
router.get('/', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'john_doe'; // Mock user
    const profile = await profileManager.getProfile(userId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    await auditLogManager.log('profile_accessed', {
      category: 'user',
      userId: userId,
      organizationId: profile.organization_id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: profile,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update profile
router.put('/', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'john_doe';
    const updateData = req.body;

    const updatedProfile = await profileManager.updateProfile(userId, updateData);
    
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    await auditLogManager.log('profile_updated', {
      category: 'user',
      severity: 'medium',
      userId: userId,
      organizationId: updatedProfile.organization_id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: updateData
    });

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Update preferences
router.put('/preferences', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'john_doe';
    const preferences = req.body;

    const updatedProfile = await profileManager.updatePreferences(userId, preferences);
    
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: updatedProfile.preferences,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

// Update security settings
router.put('/security', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'john_doe';
    const securityData = req.body;

    const updatedProfile = await profileManager.updateSecurity(userId, securityData);
    
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    await auditLogManager.log('security_settings_updated', {
      category: 'security',
      severity: 'high',
      userId: userId,
      organizationId: updatedProfile.organization_id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        settings_changed: Object.keys(securityData)
      }
    });

    res.json({
      success: true,
      data: {
        two_factor_enabled: updatedProfile.security.two_factor_enabled,
        password_last_changed: updatedProfile.security.password_last_changed
      },
      message: 'Security settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update security settings'
    });
  }
});

// Create API key
router.post('/api-keys', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'john_doe';
    const keyData = req.body;

    const newKey = await profileManager.createApiKey(userId, keyData);
    
    if (!newKey) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    await auditLogManager.log('api_key_created', {
      category: 'security',
      severity: 'medium',
      userId: userId,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        key_name: newKey.name,
        permissions: newKey.permissions
      }
    });

    res.status(201).json({
      success: true,
      data: newKey,
      message: 'API key created successfully'
    });

  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key'
    });
  }
});

// Revoke API key
router.delete('/api-keys/:keyId', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'john_doe';
    const keyId = req.params.keyId;

    const success = await profileManager.revokeApiKey(userId, keyId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    await auditLogManager.log('api_key_revoked', {
      category: 'security',
      severity: 'medium',
      userId: userId,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { key_id: keyId }
    });

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

// Get activity history
router.get('/activity', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'john_doe';
    const filters = req.query;

    const result = await profileManager.getActivityHistory(userId, filters);

    res.json({
      success: true,
      data: result,
      message: 'Activity history retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity history'
    });
  }
});

// Export user data
router.get('/export', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'john_doe';
    const exportData = await profileManager.exportUserData(userId);
    
    if (!exportData) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    await auditLogManager.log('user_data_exported', {
      category: 'user',
      severity: 'medium',
      userId: userId,
      organizationId: exportData.profile.organization_id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export user data'
    });
  }
});

// Delete account
router.delete('/account', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'john_doe';
    const confirmationData = req.body;

    const success = await profileManager.deleteAccount(userId, confirmationData);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    await auditLogManager.log('account_deleted', {
      category: 'user',
      severity: 'critical',
      userId: userId,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        deletion_reason: confirmationData.reason
      }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete account'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Profile Management',
    timestamp: new Date().toISOString(),
    total_profiles: profileManager.profiles.length
  });
});

module.exports = {
  router,
  profileManager
};
