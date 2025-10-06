# 🚀 Supabase Integration Setup Guide

This guide will help you set up Supabase database and storage for the Tools Management System.

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm installed
- The project cloned locally

## 🔧 Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Sign in or create an account

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project name: `crafta-tools-suite`
   - Enter database password (save this!)
   - Select region closest to you
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 2-3 minutes
   - You'll see a dashboard when ready

## 🗄️ Step 2: Set Up Database Schema

1. **Open SQL Editor**
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New query"

2. **Run Schema Script**
   - Copy the contents of `supabase-schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

3. **Verify Tables**
   - Go to "Table Editor"
   - You should see the `tools` table
   - Sample data should be populated

## 🔑 Step 3: Get API Keys

1. **Go to Settings**
   - Click "Settings" in sidebar
   - Go to "API" section

2. **Copy Credentials**
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🌐 Step 4: Configure Environment Variables

1. **Create .env File**
   ```bash
   cp .env.example .env
   ```

2. **Add Your Credentials**
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 📁 Step 5: Set Up Storage Bucket

1. **Go to Storage**
   - In Supabase dashboard, click "Storage"
   - You should see a `tools` bucket created by the schema

2. **Verify Bucket Settings**
   - Click on `tools` bucket
   - Ensure it's set to "Public"
   - Check that policies allow public access

## 📦 Step 6: Install Dependencies

```bash
# Install Supabase client (already in package.json)
npm install

# Or if you need to add it manually:
npm install @supabase/supabase-js
```

## 🧪 Step 7: Test the Connection

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Tools Admin**
   - Go to `/dashboard/tools-admin`
   - Try creating a new tool
   - Upload a file to test storage

3. **Test Tools Page**
   - Go to `/dashboard/tools`
   - You should see sample tools loaded
   - Try using a tool (opens in iframe)

## 🔒 Step 8: Security Configuration (Optional)

### Enable Row Level Security (RLS)

The schema already enables RLS with permissive policies. For production, you may want to restrict access:

```sql
-- Example: Only allow authenticated users
CREATE POLICY "Authenticated users only" ON tools
    FOR ALL USING (auth.role() = 'authenticated');

-- Example: Users can only manage their own tools
CREATE POLICY "Users manage own tools" ON tools
    FOR ALL USING (auth.uid() = user_id);
```

### Storage Security

```sql
-- Example: Restrict file uploads to authenticated users
CREATE POLICY "Authenticated uploads only" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'tools' AND 
        auth.role() = 'authenticated'
    );
```

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Double-check your `.env` file
   - Ensure no extra spaces in keys
   - Restart development server

2. **CORS Errors**
   - Add your domain to Supabase Auth settings
   - Go to Authentication > Settings > Site URL

3. **Storage Upload Fails**
   - Check bucket policies in Storage > Policies
   - Ensure bucket is public if needed

4. **Database Connection Issues**
   - Verify project URL is correct
   - Check if project is paused (free tier)

### Debug Steps

1. **Check Browser Console**
   - Look for network errors
   - Check API responses

2. **Test API Directly**
   ```javascript
   // In browser console
   console.log(import.meta.env.VITE_SUPABASE_URL);
   console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
   ```

3. **Verify Database**
   - Go to Table Editor in Supabase
   - Check if data exists in `tools` table

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## 🎉 Success!

If everything is working:
- ✅ Tools load from Supabase database
- ✅ You can create new tools via admin panel
- ✅ File uploads work to Supabase Storage
- ✅ Tools open in iframe with real URLs
- ✅ CRUD operations work (Create, Read, Update, Delete)

Your tools management system is now fully connected to Supabase! 🚀
