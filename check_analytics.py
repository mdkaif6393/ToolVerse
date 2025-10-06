import sqlite3
import os

db_path = 'analytics-service/analytics.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check total events
    cursor.execute('SELECT COUNT(*) FROM events')
    total_events = cursor.fetchone()[0]
    print(f'✅ Total Events in Database: {total_events}')
    
    # Check recent events
    cursor.execute('SELECT event_type, user_id, timestamp FROM events ORDER BY timestamp DESC LIMIT 5')
    events = cursor.fetchall()
    
    if events:
        print('\n📊 Recent Events:')
        for event in events:
            print(f'  • {event[0]} by {event[1]} at {event[2]}')
    else:
        print('\n⚠️ No events found yet')
    
    # Check system metrics
    cursor.execute('SELECT COUNT(*) FROM system_metrics')
    metrics_count = cursor.fetchone()[0]
    print(f'\n📈 System Metrics Records: {metrics_count}')
    
    # Check tool usage
    cursor.execute('SELECT COUNT(*) FROM tool_usage')
    tool_usage_count = cursor.fetchone()[0]
    print(f'🔧 Tool Usage Records: {tool_usage_count}')
    
    conn.close()
    print('\n✅ Analytics Database is REAL and working!')
else:
    print(f'❌ Database not found at: {db_path}')
    print('Make sure Python analytics service is running')
