# Real-time Dashboard Greeting System

## Overview

This system provides a dynamic, personalized dashboard greeting that displays real-time data after user login. It includes:

- **Dynamic Greeting**: Time-based personalized messages using the user's actual name
- **Real Data**: Fetches live data from PostgreSQL database (no mock/static data)
- **New User Support**: Shows zeros for fresh accounts with encouraging messages
- **Real-time Updates**: WebSocket integration for live data updates
- **JWT Authentication**: Secure token-based authentication

## Features Implemented

### ✅ Backend Components

1. **Database Schema** (`supabase/migrations/20241005000001_dashboard_data_schema.sql`)
   - `projects` table for project management
   - `clients` table for client inquiries
   - `productivity_metrics` table for productivity tracking
   - `user_dashboard_settings` table for user preferences
   - Database functions for calculations and summaries

2. **API Endpoints** (`backend/routes/dashboard.js`)
   - `GET /api/dashboard/greeting` - Personalized greeting with stats
   - `GET /api/dashboard/stats` - Detailed dashboard statistics
   - `POST /api/dashboard/settings` - Update dashboard preferences
   - `POST /api/dashboard/productivity` - Add productivity metrics
   - `POST /api/dashboard/sample-data` - Create sample data for testing

3. **WebSocket Server** (`backend/services/websocketServer.js`)
   - Real-time updates for dashboard data
   - JWT-based authentication for WebSocket connections
   - Database change listeners for automatic updates

### ✅ Frontend Components

1. **Custom Hooks** (`src/hooks/useDashboard.ts`)
   - `useDashboardGreeting()` - Fetch greeting data
   - `useDashboardStats()` - Fetch detailed statistics
   - `useDashboardSettings()` - Manage user settings

2. **WebSocket Integration** (`src/services/websocket.ts`)
   - Real-time connection management
   - Automatic reconnection with exponential backoff
   - Dashboard-specific message handling

3. **Enhanced Components**
   - `WelcomeBanner.tsx` - Dynamic greeting with real data
   - Real-time status indicator (Live/Offline)
   - Loading states and error handling

## Setup Instructions

### 1. Database Setup

Run the database initialization script:

```bash
node scripts/init-dashboard.js
```

This will:
- Create all required tables
- Set up database functions
- Create sample data for testing

### 2. Environment Variables

Ensure these variables are set in your `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Start the Backend

```bash
cd backend
npm start
```

The server will start on port 5000 with WebSocket server on port 8080.

### 4. Start the Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## API Usage Examples

### Get Dashboard Greeting

```javascript
// GET /api/dashboard/greeting
// Headers: Authorization: Bearer <jwt_token>

// Response:
{
  "user": {
    "displayName": "John Doe",
    "email": "john@example.com",
    "settings": {
      "greetingEnabled": true,
      "showProductivity": true,
      "showProjects": true,
      "showClients": true
    }
  },
  "greeting": {
    "timeOfDay": "morning",
    "message": "Good morning, John Doe! 👋"
  },
  "stats": {
    "pendingProjects": 3,
    "newClientInquiries": 2,
    "monthlyProductivityPercentage": 15.5,
    "totalProjects": 8,
    "totalClients": 12,
    "completedProjectsThisMonth": 2
  },
  "timestamp": "2024-10-05T18:02:49.000Z"
}
```

### Add Productivity Data

```javascript
// POST /api/dashboard/productivity
// Headers: Authorization: Bearer <jwt_token>

// Request Body:
{
  "metricDate": "2024-10-05",
  "tasksCompleted": 8,
  "tasksPlanned": 10,
  "hoursWorked": 7.5,
  "hoursPlanned": 8.0,
  "focusTimeMinutes": 300,
  "meetingsCount": 2
}
```

## Dynamic Greeting Logic

### Time-based Greetings
- **Morning** (0-11): "Good morning, [name]! 👋"
- **Afternoon** (12-16): "Good afternoon, [name]! 👋"
- **Evening** (17-23): "Good evening, [name]! 👋"

### Message Generation
- **Projects**: "You have X pending projects"
- **Clients**: "X new client inquiries"
- **Productivity**: 
  - Positive: "Your productivity is up X% this month - keep up the great work!"
  - Zero: "Your productivity is 0% this month - let's get started!"
  - Negative: "Your productivity is down X% this month - let's improve together!"

### New User Experience
For users with no data:
```
Good morning, John! 👋
You have 0 pending projects and 0 new client inquiries.
Your productivity is 0% this month - let's get started!
```

## Real-time Updates

### WebSocket Connection
```javascript
// Frontend automatically connects when authenticated
const { isConnected } = useDashboardWebSocket((updateData) => {
  // Handle real-time updates
  refetchDashboardData();
});
```

### Update Triggers
The system automatically sends updates when:
- Projects are created/updated
- Client inquiries are added
- Productivity metrics are updated
- Settings are changed

## Testing

### Manual Testing
1. Register/login to create a user account
2. Visit the dashboard to see the greeting with zeros
3. Use the sample data endpoint: `POST /api/dashboard/sample-data`
4. Refresh to see populated data
5. Check WebSocket status indicator (Live/Offline)

### Database Queries for Testing
```sql
-- Check user data
SELECT * FROM public.users;

-- Check dashboard summary for a user
SELECT get_dashboard_summary('user-uuid-here');

-- Check productivity calculation
SELECT get_monthly_productivity_percentage('user-uuid-here');
```

## Security Features

- **JWT Authentication**: All endpoints require valid JWT tokens
- **Row Level Security**: Users can only access their own data
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: API endpoints have rate limiting protection

## Performance Optimizations

- **Database Indexes**: Optimized queries with proper indexing
- **Connection Pooling**: PostgreSQL connection pooling
- **Caching**: React Query for client-side caching
- **Lazy Loading**: Components load data only when needed

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if port 8080 is available
   - Verify JWT token is valid
   - Check browser console for errors

2. **Database Connection Error**
   - Verify DATABASE_URL is correct
   - Ensure PostgreSQL is running
   - Check database permissions

3. **No Data Showing**
   - Run the sample data script
   - Check database tables are created
   - Verify user authentication

### Debug Commands

```bash
# Check database connection
node -e "require('./backend/config/database').connectDB().then(() => console.log('DB OK'))"

# Test WebSocket server
wscat -c ws://localhost:8080?token=your_jwt_token

# Check API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/dashboard/greeting
```

## Future Enhancements

- [ ] Push notifications for real-time updates
- [ ] Advanced analytics and reporting
- [ ] Customizable dashboard widgets
- [ ] Mobile app integration
- [ ] Team collaboration features
- [ ] Advanced productivity tracking

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check database logs and browser console
4. Verify all environment variables are set correctly
