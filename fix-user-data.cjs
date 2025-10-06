console.log('🔧 Fixing User Roles and Profiles...\n');

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUserData() {
  try {
    console.log('1️⃣ Checking existing users...');
    
    // Get all users from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }
    
    console.log(`   Found ${users.users.length} users in auth.users`);
    
    if (users.users.length === 0) {
      console.log('⚠️  No users found. Please sign up first in your app.');
      return;
    }
    
    // Process each user
    for (const user of users.users) {
      console.log(`\n👤 Processing user: ${user.email}`);
      
      // 1. Check/Create profile
      console.log('   📝 Checking profile...');
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!existingProfile) {
        console.log('   ➕ Creating profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url || null
          });
        
        if (profileError) {
          console.log('   ❌ Profile creation failed:', profileError.message);
        } else {
          console.log('   ✅ Profile created');
        }
      } else {
        console.log('   ✅ Profile already exists');
      }
      
      // 2. Check/Create user role
      console.log('   🔐 Checking user role...');
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!existingRole) {
        console.log('   ➕ Creating user role...');
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'user'  // Default role
          });
        
        if (roleError) {
          console.log('   ❌ Role creation failed:', roleError.message);
        } else {
          console.log('   ✅ User role created');
        }
      } else {
        console.log('   ✅ User role already exists:', existingRole.role);
      }
      
      // 3. Check/Create dashboard settings
      console.log('   ⚙️  Checking dashboard settings...');
      const { data: existingSettings } = await supabase
        .from('user_dashboard_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!existingSettings) {
        console.log('   ➕ Creating dashboard settings...');
        const { error: settingsError } = await supabase
          .from('user_dashboard_settings')
          .insert({
            user_id: user.id,
            preferred_name: user.user_metadata?.full_name || user.email.split('@')[0],
            greeting_enabled: true,
            show_productivity: true,
            show_projects: true,
            show_clients: true
          });
        
        if (settingsError) {
          console.log('   ❌ Settings creation failed:', settingsError.message);
        } else {
          console.log('   ✅ Dashboard settings created');
        }
      } else {
        console.log('   ✅ Dashboard settings already exist');
      }
    }
    
    // 4. Test data access
    console.log('\n🧪 Testing data access...');
    
    const testTables = [
      { name: 'profiles', count: 0 },
      { name: 'user_roles', count: 0 },
      { name: 'user_dashboard_settings', count: 0 }
    ];
    
    for (const table of testTables) {
      const { data, error } = await supabase.from(table.name).select('*');
      if (error) {
        console.log(`   ❌ ${table.name}: ${error.message}`);
      } else {
        table.count = data.length;
        console.log(`   ✅ ${table.name}: ${data.length} records`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 USER DATA FIX COMPLETED!');
    console.log('='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${users.users.length}`);
    console.log(`   📝 Profiles: ${testTables[0].count}`);
    console.log(`   🔐 Roles: ${testTables[1].count}`);
    console.log(`   ⚙️  Settings: ${testTables[2].count}`);
    console.log('\n✅ Now your dashboard should show proper user data!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUserData();
