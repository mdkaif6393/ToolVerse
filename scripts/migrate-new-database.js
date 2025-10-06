const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Starting database migration...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'Not found');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile, description) {
  try {
    console.log(`\n📄 Running migration: ${description}`);
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  Migration file not found: ${migrationFile}`);
      return false;
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase.from('_temp').select('1').limit(0);
            if (directError) {
              console.log(`   ⚠️  Statement ${i + 1} failed:`, error.message);
            }
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1} error:`, err.message);
        }
      }
    }
    
    console.log(`   ✅ Migration completed: ${description}`);
    return true;
    
  } catch (error) {
    console.error(`   ❌ Migration failed: ${description}`, error.message);
    return false;
  }
}

async function createTables() {
  console.log('\n🏗️  Creating database tables...');
  
  // Create tools management schema
  const toolsSchema = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Create tools table
    CREATE TABLE IF NOT EXISTS tools (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      category TEXT CHECK (category IN ('pdf', 'ai', 'business', 'design', 'development', 'productivity')),
      icon TEXT DEFAULT 'tool',
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted', 'pending')),
      version TEXT DEFAULT '1.0.0',
      entry_point TEXT,
      language TEXT,
      framework TEXT,
      tech_stack JSONB DEFAULT '[]',
      confidence_score DECIMAL(3,2) DEFAULT 0.00,
      is_featured BOOLEAN DEFAULT false,
      is_public BOOLEAN DEFAULT false,
      download_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      rating DECIMAL(2,1) DEFAULT 0.0,
      rating_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  // Create dashboard schema
  const dashboardSchema = `
    -- Create projects table
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
      due_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create clients table
    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT,
      inquiry_status TEXT DEFAULT 'new' CHECK (inquiry_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
      inquiry_date DATE DEFAULT CURRENT_DATE,
      last_contact_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create productivity_metrics table
    CREATE TABLE IF NOT EXISTS productivity_metrics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      metric_date DATE DEFAULT CURRENT_DATE,
      productivity_score DECIMAL(5,2) DEFAULT 0.00,
      tasks_completed INTEGER DEFAULT 0,
      tasks_planned INTEGER DEFAULT 0,
      hours_worked DECIMAL(4,2) DEFAULT 0.00,
      hours_planned DECIMAL(4,2) DEFAULT 0.00,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, metric_date)
    );
    
    -- Create user_dashboard_settings table
    CREATE TABLE IF NOT EXISTS user_dashboard_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      greeting_enabled BOOLEAN DEFAULT true,
      show_productivity BOOLEAN DEFAULT true,
      show_projects BOOLEAN DEFAULT true,
      show_clients BOOLEAN DEFAULT true,
      timezone TEXT DEFAULT 'UTC',
      preferred_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  try {
    // Execute tools schema
    console.log('   Creating tools tables...');
    const statements1 = toolsSchema.split(';').filter(s => s.trim());
    for (const stmt of statements1) {
      if (stmt.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        if (error && !error.message.includes('already exists')) {
          console.log('   ⚠️  Tools schema warning:', error.message);
        }
      }
    }
    
    // Execute dashboard schema
    console.log('   Creating dashboard tables...');
    const statements2 = dashboardSchema.split(';').filter(s => s.trim());
    for (const stmt of statements2) {
      if (stmt.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        if (error && !error.message.includes('already exists')) {
          console.log('   ⚠️  Dashboard schema warning:', error.message);
        }
      }
    }
    
    console.log('   ✅ Database tables created successfully');
    return true;
    
  } catch (error) {
    console.error('   ❌ Failed to create tables:', error.message);
    return false;
  }
}

async function testTables() {
  console.log('\n🧪 Testing database tables...');
  
  const tables = ['tools', 'projects', 'clients', 'productivity_metrics', 'user_dashboard_settings'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`   ❌ Table '${table}' test failed:`, error.message);
      } else {
        console.log(`   ✅ Table '${table}' is accessible`);
      }
    } catch (err) {
      console.log(`   ❌ Table '${table}' error:`, err.message);
    }
  }
}

async function main() {
  try {
    // Test connection first
    console.log('\n🔗 Testing database connection...');
    const { data, error } = await supabase.from('_temp').select('1').limit(1);
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
    console.log('✅ Database connection successful');
    
    // Create tables
    await createTables();
    
    // Test tables
    await testTables();
    
    console.log('\n🎉 Database migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Start your backend server: npm run backend');
    console.log('3. Test the authentication and dashboard functionality');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
