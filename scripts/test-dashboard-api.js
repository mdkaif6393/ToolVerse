const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

// Test configuration
const testConfig = {
  email: 'test@example.com',
  password: 'testpassword123',
  fullName: 'Test User'
};

let authToken = null;

async function testAPI() {
  console.log('🧪 Testing Dashboard API Endpoints\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test 2: Register/Login
    console.log('\n2. Testing authentication...');
    try {
      // Try to register
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: testConfig.email,
        password: testConfig.password,
        full_name: testConfig.fullName
      });
      authToken = registerResponse.data.token;
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        // User already exists, try login
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: testConfig.email,
          password: testConfig.password
        });
        authToken = loginResponse.data.token;
        console.log('✅ User login successful');
      } else {
        throw error;
      }
    }

    if (!authToken) {
      throw new Error('Failed to obtain auth token');
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // Test 3: Dashboard Greeting (Initial - should show zeros)
    console.log('\n3. Testing dashboard greeting (initial state)...');
    const greetingResponse = await axios.get(`${BASE_URL}/api/dashboard/greeting`, { headers });
    const greeting = greetingResponse.data;
    
    console.log('✅ Greeting received:');
    console.log(`   Message: ${greeting.greeting.message}`);
    console.log(`   Pending Projects: ${greeting.stats.pendingProjects}`);
    console.log(`   New Inquiries: ${greeting.stats.newClientInquiries}`);
    console.log(`   Productivity: ${greeting.stats.monthlyProductivityPercentage}%`);

    // Test 4: Create Sample Data
    console.log('\n4. Creating sample data...');
    await axios.post(`${BASE_URL}/api/dashboard/sample-data`, {}, { headers });
    console.log('✅ Sample data created');

    // Test 5: Dashboard Greeting (After sample data)
    console.log('\n5. Testing dashboard greeting (with data)...');
    const greetingResponse2 = await axios.get(`${BASE_URL}/api/dashboard/greeting`, { headers });
    const greeting2 = greetingResponse2.data;
    
    console.log('✅ Updated greeting received:');
    console.log(`   Message: ${greeting2.greeting.message}`);
    console.log(`   Pending Projects: ${greeting2.stats.pendingProjects}`);
    console.log(`   New Inquiries: ${greeting2.stats.newClientInquiries}`);
    console.log(`   Productivity: ${greeting2.stats.monthlyProductivityPercentage}%`);

    // Test 6: Dashboard Stats
    console.log('\n6. Testing detailed dashboard stats...');
    const statsResponse = await axios.get(`${BASE_URL}/api/dashboard/stats`, { headers });
    const stats = statsResponse.data;
    
    console.log('✅ Dashboard stats received:');
    console.log(`   Total Projects: ${stats.projects.total_projects}`);
    console.log(`   Total Clients: ${stats.clients.total_clients}`);
    console.log(`   Recent Projects: ${stats.projects.recent.length}`);
    console.log(`   Productivity Trend Days: ${stats.productivity.trend.length}`);

    // Test 7: Add Productivity Data
    console.log('\n7. Testing productivity data addition...');
    const today = new Date().toISOString().split('T')[0];
    await axios.post(`${BASE_URL}/api/dashboard/productivity`, {
      metricDate: today,
      tasksCompleted: 8,
      tasksPlanned: 10,
      hoursWorked: 7.5,
      hoursPlanned: 8.0,
      focusTimeMinutes: 300,
      meetingsCount: 2
    }, { headers });
    console.log('✅ Productivity data added');

    // Test 8: Update Settings
    console.log('\n8. Testing dashboard settings update...');
    await axios.post(`${BASE_URL}/api/dashboard/settings`, {
      greetingEnabled: true,
      showProductivity: true,
      showProjects: true,
      showClients: true,
      timezone: 'UTC',
      preferredName: 'Test User'
    }, { headers });
    console.log('✅ Dashboard settings updated');

    // Test 9: WebSocket Info
    console.log('\n9. Testing WebSocket info endpoint...');
    const wsInfoResponse = await axios.get(`${BASE_URL}/api/websocket/info`);
    const wsInfo = wsInfoResponse.data;
    
    console.log('✅ WebSocket info received:');
    console.log(`   WebSocket URL: ${wsInfo.websocketUrl}`);
    console.log(`   Connected Users: ${wsInfo.stats.connectedUsers}`);
    console.log(`   Total Connections: ${wsInfo.stats.totalConnections}`);

    console.log('\n🎉 All API tests passed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Health check');
    console.log('   ✅ Authentication (register/login)');
    console.log('   ✅ Dashboard greeting (initial & with data)');
    console.log('   ✅ Sample data creation');
    console.log('   ✅ Detailed dashboard stats');
    console.log('   ✅ Productivity data addition');
    console.log('   ✅ Settings update');
    console.log('   ✅ WebSocket info');

    console.log('\n🚀 Ready to test the frontend!');
    console.log('   1. Start the frontend: npm run dev');
    console.log('   2. Navigate to: http://localhost:5173');
    console.log('   3. Login with:', testConfig.email, '/', testConfig.password);
    console.log('   4. Check the dashboard greeting section');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('Checking if backend server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Backend server is not running on port 5000');
    console.log('Please start the backend server first:');
    console.log('   cd backend && npm start');
    process.exit(1);
  }

  console.log('✅ Backend server is running\n');
  await testAPI();
}

if (require.main === module) {
  main();
}

module.exports = { testAPI };
