# ToolVerse Quick Start Guide

## ✅ Backend Server is Running!
Your backend server is already running on http://localhost:3001

## 🗄️ Database Setup Required

You need to create the database tables in your Supabase project. Here are two ways to do it:

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Open your project: https://rjytmzruonsedcuvgxvf.supabase.co
3. Go to "SQL Editor" in the left sidebar
4. Copy and paste the contents of `create-tables-simple.sql`
5. Click "Run" to execute the SQL

### Option 2: Manual Table Creation
If the SQL doesn't work, create these tables manually in Supabase:

**projects table:**
- id: uuid (primary key, default: gen_random_uuid())
- user_id: uuid (foreign key to auth.users)
- name: text (required)
- description: text
- status: text (default: 'pending')
- priority: text (default: 'medium')
- progress_percentage: integer (default: 0)
- due_date: date
- created_at: timestamptz (default: now())
- updated_at: timestamptz (default: now())

**clients table:**
- id: uuid (primary key, default: gen_random_uuid())
- user_id: uuid (foreign key to auth.users)
- name: text (required)
- company: text
- email: text
- phone: text
- inquiry_status: text (default: 'new')
- inquiry_date: date (default: current_date)
- last_contact_date: date
- created_at: timestamptz (default: now())
- updated_at: timestamptz (default: now())

**productivity_metrics table:**
- id: uuid (primary key, default: gen_random_uuid())
- user_id: uuid (foreign key to auth.users)
- metric_date: date (default: current_date)
- productivity_score: decimal(5,2) (default: 0.00)
- tasks_completed: integer (default: 0)
- tasks_planned: integer (default: 0)
- hours_worked: decimal(4,2) (default: 0.00)
- hours_planned: decimal(4,2) (default: 0.00)
- created_at: timestamptz (default: now())

**user_dashboard_settings table:**
- id: uuid (primary key, default: gen_random_uuid())
- user_id: uuid (foreign key to auth.users, unique)
- greeting_enabled: boolean (default: true)
- show_productivity: boolean (default: true)
- show_projects: boolean (default: true)
- show_clients: boolean (default: true)
- timezone: text (default: 'UTC')
- preferred_name: text
- created_at: timestamptz (default: now())
- updated_at: timestamptz (default: now())

## 🚀 Start Frontend

Once the database tables are created, start your frontend:

```bash
npm run dev
```

## 🔧 Current Status

✅ **Backend Server**: Running on http://localhost:3001
✅ **Database Connection**: Connected to Supabase
✅ **Authentication**: Working with Supabase Auth
⏳ **Database Tables**: Need to be created (see above)
⏳ **Frontend**: Ready to start

## 🌐 URLs

- **Backend Health**: http://localhost:3001/health
- **Frontend**: http://localhost:8080 (after running `npm run dev`)
- **Supabase Dashboard**: https://supabase.com/dashboard/project/rjytmzruonsedcuvgxvf

## 🔍 Troubleshooting

If you see "Dashboard greeting fetch error", it means:
1. Either the database tables haven't been created yet
2. Or you need to sign up/sign in to create a user account first

The dashboard will work once you:
1. Create the database tables (see above)
2. Sign up for an account in your app
3. The backend will then be able to fetch your personalized dashboard data
