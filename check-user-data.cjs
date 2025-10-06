console.log('🔍 Checking User Data in Database...\n');

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserData() {
  try {
    // Check profiles table
    console.log('📝 Profiles Table:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.log('❌ Error:', profilesError.message);
    } else {
      console.log(`   Records: ${profiles.length}`);
      profiles.forEach((profile, i) => {
        console.log(`   ${i + 1}. ${profile.full_name} (${profile.email})`);
      });
    }
    
    // Check user_roles table
    console.log('\n🔐 User Roles Table:');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (rolesError) {
      console.log('❌ Error:', rolesError.message);
    } else {
      console.log(`   Records: ${roles.length}`);
      roles.forEach((role, i) => {
        console.log(`   ${i + 1}. User ID: ${role.user_id.substring(0, 8)}... Role: ${role.role}`);
      });
    }
    
    // Check dashboard settings
    console.log('\n⚙️  Dashboard Settings Table:');
    const { data: settings, error: settingsError } = await supabase
      .from('user_dashboard_settings')
      .select('*');
    
    if (settingsError) {
      console.log('❌ Error:', settingsError.message);
    } else {
      console.log(`   Records: ${settings.length}`);
      settings.forEach((setting, i) => {
        console.log(`   ${i + 1}. ${setting.preferred_name} - Greeting: ${setting.greeting_enabled}`);
      });
    }
    
    // Check auth users
    console.log('\n👥 Auth Users:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error:', authError.message);
    } else {
      console.log(`   Total Users: ${authUsers.users.length}`);
      authUsers.users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} - Created: ${new Date(user.created_at).toLocaleDateString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserData();
