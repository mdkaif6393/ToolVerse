const { supabase } = require('../backend/config/supabase');

async function testAnalytics() {
  console.log('🧪 Testing Business Analytics System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking database tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['clients', 'projects', 'invoices', 'business_metrics']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return;
    }

    const tableNames = tables.map(t => t.table_name);
    console.log('✅ Found tables:', tableNames.join(', '));

    // Test 2: Test analytics functions
    console.log('\n2. Testing analytics functions...');
    
    // Get a test user (you may need to adjust this)
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !users.users.length) {
      console.log('⚠️  No users found. Creating sample data for anonymous user...');
      
      // Test with null user_id (will need to be updated for real users)
      const testUserId = '00000000-0000-0000-0000-000000000000';
      
      // Test analytics function
      const { data: analytics, error: analyticsError } = await supabase
        .rpc('get_dashboard_analytics', { user_uuid: testUserId });

      if (analyticsError) {
        console.error('❌ Analytics function error:', analyticsError);
      } else {
        console.log('✅ Analytics function works:', analytics[0]);
      }
    } else {
      const testUserId = users.users[0].id;
      console.log('📊 Testing with user:', testUserId);

      const { data: analytics, error: analyticsError } = await supabase
        .rpc('get_dashboard_analytics', { user_uuid: testUserId });

      if (analyticsError) {
        console.error('❌ Analytics function error:', analyticsError);
      } else {
        console.log('✅ Analytics function works:', analytics[0]);
      }
    }

    // Test 3: Test revenue trends
    console.log('\n3. Testing revenue trends...');
    
    const { data: trends, error: trendsError } = await supabase
      .rpc('get_revenue_trends', { user_uuid: users.users[0]?.id || '00000000-0000-0000-0000-000000000000' });

    if (trendsError) {
      console.error('❌ Revenue trends error:', trendsError);
    } else {
      console.log('✅ Revenue trends function works. Found', trends.length, 'data points');
    }

    // Test 4: Test client growth
    console.log('\n4. Testing client growth...');
    
    const { data: growth, error: growthError } = await supabase
      .rpc('get_client_growth_trends', { user_uuid: users.users[0]?.id || '00000000-0000-0000-0000-000000000000' });

    if (growthError) {
      console.error('❌ Client growth error:', growthError);
    } else {
      console.log('✅ Client growth function works. Found', growth.length, 'data points');
    }

    console.log('\n🎉 Analytics system test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the migration: supabase db push');
    console.log('2. Start the backend server: npm run dev');
    console.log('3. Start the frontend: npm run dev');
    console.log('4. Navigate to /dashboard/analytics to see real-time data');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAnalytics().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
