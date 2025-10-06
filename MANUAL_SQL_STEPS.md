# 🗄️ Manual SQL Steps

## 📋 What to Run:

### **Step 1: Copy and Run**
```sql
-- Copy entire content of: complete-missing-tables.sql
-- Run in Supabase SQL Editor
```

### **Step 2: After User Signup**
```sql
-- After you sign up in your app, run this to create sample data:
SELECT create_sample_dashboard_data(auth.uid());
```

## 📊 What This Creates:

### **Missing Tables:**
- ✅ `profiles` - User profile information
- ✅ `productivity_metrics` - Daily productivity tracking  
- ✅ `user_dashboard_settings` - Dashboard preferences
- ✅ `project_tasks` - Individual project tasks
- ✅ `invoices` - Invoice management

### **Functions:**
- ✅ `get_dashboard_summary()` - Dashboard statistics
- ✅ `create_sample_dashboard_data()` - Sample data creation
- ✅ `update_updated_at()` - Auto-update timestamps

### **Security:**
- ✅ RLS policies on all tables
- ✅ User-specific data access
- ✅ Proper foreign key relationships

### **Performance:**
- ✅ Indexes on frequently queried columns
- ✅ Optimized queries
- ✅ Efficient data structure

## 🚀 Expected Result:

After running this SQL:
- ✅ All missing tables will be created
- ✅ User roles will show properly
- ✅ User profiles will be accessible
- ✅ Dashboard will display real data
- ✅ No more "table not found" errors

## 🔧 Troubleshooting:

**If any error occurs:**
1. Check if table already exists (script handles this)
2. Verify user permissions
3. Run individual CREATE TABLE statements if needed

**To verify success:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'productivity_metrics', 'user_dashboard_settings');
```
