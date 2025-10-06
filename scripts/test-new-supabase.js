const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not found');
console.log('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'Not found');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create clients for both anon and service role
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function testConnection() {
  try {
    // Test basic connection with anon key
    console.log('\n📡 Testing basic connection (anon key)...');
    const { data, error } = await supabaseAnon.from('projects').select('count').limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('✅ Anon connection successful! (Table "projects" doesn\'t exist yet - this is expected)');
    } else if (error) {
      console.log('⚠️  Anon connection established but got error:', error.message);
    } else {
      console.log('✅ Anon connection successful! Found existing data.');
    }

    // Test service role connection if available
    if (supabaseService) {
      console.log('\n🔧 Testing service role connection...');
      const { data: serviceData, error: serviceError } = await supabaseService.from('projects').select('count').limit(1);
      
      if (serviceError && serviceError.code === 'PGRST116') {
        console.log('✅ Service role connection successful! (Table "projects" doesn\'t exist yet - this is expected)');
      } else if (serviceError) {
        console.log('⚠️  Service role connection established but got error:', serviceError.message);
      } else {
        console.log('✅ Service role connection successful! Found existing data.');
      }
    }

    // Test auth
    console.log('\n🔐 Testing authentication...');
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (this is normal for initial setup)');
    } else {
      console.log('✅ User authenticated:', user?.email || 'Anonymous');
    }

    console.log('\n🎉 Supabase connection test complete!');
    console.log('\nNext steps:');
    console.log('1. Run database migration: node scripts/migrate-new-database.js');
    console.log('2. Or use the batch file: migrate-database.bat');
    console.log('3. Start your development server: npm run dev');
    console.log('4. Start your backend server: npm run backend');
    console.log('5. Test the application functionality');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
