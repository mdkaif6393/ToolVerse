"""
Real Python Analytics Service
FastAPI + Redis + WebSocket for real-time analytics
Industry-level data processing and insights
"""

from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import redis
import json
import asyncio
import uvicorn
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import logging
from pydantic import BaseModel
import sqlite3
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Real Analytics Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection for real-time data
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    logger.info("✅ Redis connected successfully")
except:
    logger.warning("⚠️ Redis not available, using in-memory storage")
    redis_client = None

# SQLite database for persistent analytics
DB_PATH = "analytics.db"

def init_database():
    """Initialize SQLite database for analytics"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            user_id TEXT,
            organization_id TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            data TEXT,
            ip_address TEXT,
            user_agent TEXT
        )
    ''')
    
    # User sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
            session_end DATETIME,
            duration_seconds INTEGER,
            page_views INTEGER DEFAULT 0,
            actions_count INTEGER DEFAULT 0
        )
    ''')
    
    # Tool usage table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tool_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tool_id TEXT NOT NULL,
            tool_name TEXT,
            user_id TEXT,
            usage_type TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            execution_time_ms INTEGER,
            success BOOLEAN,
            error_message TEXT
        )
    ''')
    
    # Real payments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            payment_method TEXT,
            transaction_id TEXT UNIQUE,
            subscription_plan TEXT,
            status TEXT DEFAULT 'completed',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        )
    ''')
    
    # Subscriptions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            plan_name TEXT NOT NULL,
            amount REAL NOT NULL,
            billing_cycle TEXT DEFAULT 'monthly',
            status TEXT DEFAULT 'active',
            start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_date DATETIME,
            next_billing_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # System metrics table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            cpu_usage REAL,
            memory_usage REAL,
            active_users INTEGER,
            api_calls_per_minute INTEGER,
            error_rate REAL
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("✅ Database initialized successfully")

# Initialize database on startup
init_database()

# Pydantic models
class Event(BaseModel):
    event_type: str
    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    data: Optional[Dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class ToolUsage(BaseModel):
    tool_id: str
    tool_name: str
    user_id: Optional[str] = None
    usage_type: str
    execution_time_ms: Optional[int] = None
    success: bool = True
    error_message: Optional[str] = None

class SystemMetrics(BaseModel):
    cpu_usage: float
    memory_usage: float
    active_users: int
    api_calls_per_minute: int
    error_rate: float

class Payment(BaseModel):
    user_id: str
    amount: float
    currency: str = "USD"
    payment_method: str
    transaction_id: str
    subscription_plan: Optional[str] = None
    status: str = "completed"
    metadata: Optional[Dict] = None

class Subscription(BaseModel):
    user_id: str
    plan_name: str
    amount: float
    billing_cycle: str = "monthly"
    status: str = "active"

# WebSocket connections for real-time updates
active_connections: List[WebSocket] = []

class AnalyticsManager:
    def __init__(self):
        self.real_time_data = {}
        self.start_background_tasks()
    
    def start_background_tasks(self):
        """Start background tasks for real-time analytics"""
        asyncio.create_task(self.update_real_time_metrics())
        asyncio.create_task(self.process_analytics_queue())
    
    async def update_real_time_metrics(self):
        """Update real-time metrics every 30 seconds"""
        while True:
            try:
                metrics = await self.calculate_real_time_metrics()
                
                # Store in Redis
                if redis_client:
                    redis_client.setex("real_time_metrics", 60, json.dumps(metrics))
                
                # Broadcast to WebSocket clients
                await self.broadcast_to_clients("metrics_update", metrics)
                
                # Store in database
                await self.store_system_metrics(metrics)
                
            except Exception as e:
                logger.error(f"Error updating real-time metrics: {e}")
            
            await asyncio.sleep(30)
    
    async def process_analytics_queue(self):
        """Process analytics events from queue"""
        while True:
            try:
                if redis_client:
                    # Get events from Redis queue
                    event_data = redis_client.lpop("analytics_queue")
                    if event_data:
                        event = json.loads(event_data)
                        await self.process_event(event)
                
            except Exception as e:
                logger.error(f"Error processing analytics queue: {e}")
            
            await asyncio.sleep(1)
    
    async def calculate_real_time_metrics(self):
        """Calculate real-time system metrics"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get current time windows
        now = datetime.now()
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(days=1)
        
        # Active users (last hour)
        cursor.execute('''
            SELECT COUNT(DISTINCT user_id) FROM events 
            WHERE timestamp > ? AND user_id IS NOT NULL
        ''', (hour_ago,))
        active_users = cursor.fetchone()[0] or 0
        
        # API calls per minute (last hour average)
        cursor.execute('''
            SELECT COUNT(*) FROM events 
            WHERE timestamp > ? AND event_type LIKE '%_api_%'
        ''', (hour_ago,))
        api_calls = cursor.fetchone()[0] or 0
        api_calls_per_minute = api_calls / 60
        
        # Error rate (last hour)
        cursor.execute('''
            SELECT 
                COUNT(CASE WHEN event_type LIKE '%_error%' THEN 1 END) as errors,
                COUNT(*) as total
            FROM events WHERE timestamp > ?
        ''', (hour_ago,))
        result = cursor.fetchone()
        error_rate = (result[0] / result[1] * 100) if result[1] > 0 else 0
        
        # Tool usage stats
        cursor.execute('''
            SELECT COUNT(*) FROM tool_usage 
            WHERE timestamp > ?
        ''', (hour_ago,))
        tools_used = cursor.fetchone()[0] or 0
        
        # Real Revenue calculation
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) FROM payments 
            WHERE timestamp > ? AND status = 'completed'
        ''', (day_ago,))
        revenue_today = cursor.fetchone()[0] or 0.00
        
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) FROM payments 
            WHERE status = 'completed'
        ''')
        total_revenue = cursor.fetchone()[0] or 0.00
        
        # Monthly Recurring Revenue (MRR)
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) FROM subscriptions 
            WHERE status = 'active' AND billing_cycle = 'monthly'
        ''')
        mrr = cursor.fetchone()[0] or 0.00
        
        conn.close()
        
        # Simulate system metrics
        import psutil
        cpu_usage = psutil.cpu_percent()
        memory_usage = psutil.virtual_memory().percent
        
        return {
            "timestamp": now.isoformat(),
            "active_users": active_users,
            "api_calls_per_minute": round(api_calls_per_minute, 2),
            "error_rate": round(error_rate, 2),
            "cpu_usage": cpu_usage,
            "memory_usage": memory_usage,
            "tools_used_last_hour": tools_used,
            "revenue_today": round(revenue_today, 2),
            "total_revenue": round(total_revenue, 2),
            "mrr": round(mrr, 2),
            "arr": round(mrr * 12, 2),
            "total_events_last_hour": api_calls,
            "system_health": "healthy" if error_rate < 5 and cpu_usage < 80 else "warning"
        }
    
    async def store_system_metrics(self, metrics):
        """Store system metrics in database"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO system_metrics 
            (cpu_usage, memory_usage, active_users, api_calls_per_minute, error_rate)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            metrics["cpu_usage"],
            metrics["memory_usage"],
            metrics["active_users"],
            metrics["api_calls_per_minute"],
            metrics["error_rate"]
        ))
        
        conn.commit()
        conn.close()
    
    async def process_event(self, event_data):
        """Process and store analytics event"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO events 
            (event_type, user_id, organization_id, data, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            event_data.get("event_type"),
            event_data.get("user_id"),
            event_data.get("organization_id"),
            json.dumps(event_data.get("data", {})),
            event_data.get("ip_address"),
            event_data.get("user_agent")
        ))
        
        conn.commit()
        conn.close()
        
        # Update real-time counters
        await self.update_real_time_counters(event_data)
    
    async def update_real_time_counters(self, event_data):
        """Update real-time counters"""
        if redis_client:
            # Increment event type counter
            redis_client.incr(f"counter:event:{event_data['event_type']}")
            
            # Increment user activity counter
            if event_data.get("user_id"):
                redis_client.incr(f"counter:user:{event_data['user_id']}")
            
            # Set expiry for counters (24 hours)
            redis_client.expire(f"counter:event:{event_data['event_type']}", 86400)
    
    async def broadcast_to_clients(self, event_type, data):
        """Broadcast data to all WebSocket clients"""
        if active_connections:
            message = json.dumps({
                "type": event_type,
                "data": data,
                "timestamp": datetime.now().isoformat()
            })
            
            # Remove disconnected clients
            disconnected = []
            for connection in active_connections:
                try:
                    await connection.send_text(message)
                except:
                    disconnected.append(connection)
            
            for conn in disconnected:
                active_connections.remove(conn)

# Initialize analytics manager
analytics_manager = AnalyticsManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time analytics"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Send initial data
        if redis_client:
            metrics = redis_client.get("real_time_metrics")
            if metrics:
                await websocket.send_text(json.dumps({
                    "type": "initial_metrics",
                    "data": json.loads(metrics)
                }))
        
        # Keep connection alive
        while True:
            await websocket.receive_text()
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)

@app.post("/api/events")
async def track_event(event: Event, background_tasks: BackgroundTasks):
    """Track analytics event"""
    try:
        event_data = event.dict()
        event_data["timestamp"] = datetime.now().isoformat()
        
        # Add to processing queue
        if redis_client:
            redis_client.rpush("analytics_queue", json.dumps(event_data))
        else:
            # Process immediately if no Redis
            await analytics_manager.process_event(event_data)
        
        return {"success": True, "message": "Event tracked successfully"}
        
    except Exception as e:
        logger.error(f"Error tracking event: {e}")
        raise HTTPException(status_code=500, detail="Failed to track event")

@app.post("/api/tool-usage")
async def track_tool_usage(usage: ToolUsage):
    """Track tool usage"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO tool_usage 
            (tool_id, tool_name, user_id, usage_type, execution_time_ms, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            usage.tool_id,
            usage.tool_name,
            usage.user_id,
            usage.usage_type,
            usage.execution_time_ms,
            usage.success,
            usage.error_message
        ))
        
        conn.commit()
        conn.close()
        
        # Broadcast real-time update
        await analytics_manager.broadcast_to_clients("tool_usage", usage.dict())
        
        return {"success": True, "message": "Tool usage tracked successfully"}
        
    except Exception as e:
        logger.error(f"Error tracking tool usage: {e}")
        raise HTTPException(status_code=500, detail="Failed to track tool usage")

@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics():
    """Get comprehensive dashboard analytics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        
        # Get real-time metrics
        real_time_metrics = {}
        if redis_client:
            metrics_data = redis_client.get("real_time_metrics")
            if metrics_data:
                real_time_metrics = json.loads(metrics_data)
        
        # Get historical data
        df_events = pd.read_sql_query('''
            SELECT * FROM events 
            WHERE timestamp > datetime('now', '-30 days')
        ''', conn)
        
        df_tools = pd.read_sql_query('''
            SELECT * FROM tool_usage 
            WHERE timestamp > datetime('now', '-30 days')
        ''', conn)
        
        df_metrics = pd.read_sql_query('''
            SELECT * FROM system_metrics 
            WHERE timestamp > datetime('now', '-7 days')
            ORDER BY timestamp DESC
        ''', conn)
        
        # Calculate analytics
        total_users = df_events['user_id'].nunique() if not df_events.empty else 0
        total_events = len(df_events)
        total_tool_usage = len(df_tools)
        
        # Tool popularity
        tool_stats = {}
        if not df_tools.empty:
            tool_stats = df_tools.groupby('tool_name').agg({
                'id': 'count',
                'execution_time_ms': 'mean',
                'success': 'mean'
            }).to_dict('index')
        
        # Daily usage trends
        daily_trends = []
        if not df_events.empty:
            df_events['date'] = pd.to_datetime(df_events['timestamp']).dt.date
            daily_counts = df_events.groupby('date').size()
            daily_trends = [{"date": str(date), "count": int(count)} 
                          for date, count in daily_counts.items()]
        
        # User activity patterns
        user_activity = {}
        if not df_events.empty:
            user_counts = df_events.groupby('user_id').size()
            user_activity = {
                "total_users": len(user_counts),
                "avg_events_per_user": float(user_counts.mean()) if len(user_counts) > 0 else 0,
                "most_active_users": user_counts.nlargest(5).to_dict()
            }
        
        conn.close()
        
        return {
            "success": True,
            "data": {
                "real_time_metrics": real_time_metrics,
                "summary": {
                    "total_users": total_users,
                    "total_events": total_events,
                    "total_tool_usage": total_tool_usage,
                    "avg_response_time": df_metrics['cpu_usage'].mean() if not df_metrics.empty else 0
                },
                "tool_stats": tool_stats,
                "daily_trends": daily_trends[-30:],  # Last 30 days
                "user_activity": user_activity,
                "system_health": real_time_metrics.get("system_health", "unknown")
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analytics")

@app.get("/api/analytics/tools/{tool_id}")
async def get_tool_analytics(tool_id: str):
    """Get analytics for specific tool"""
    try:
        conn = sqlite3.connect(DB_PATH)
        
        df = pd.read_sql_query('''
            SELECT * FROM tool_usage 
            WHERE tool_id = ? AND timestamp > datetime('now', '-30 days')
        ''', conn, params=(tool_id,))
        
        if df.empty:
            return {"success": True, "data": {"usage_count": 0, "trends": []}}
        
        # Calculate metrics
        usage_count = len(df)
        success_rate = df['success'].mean() * 100
        avg_execution_time = df['execution_time_ms'].mean()
        
        # Daily usage trends
        df['date'] = pd.to_datetime(df['timestamp']).dt.date
        daily_usage = df.groupby('date').size()
        trends = [{"date": str(date), "usage": int(count)} 
                 for date, count in daily_usage.items()]
        
        conn.close()
        
        return {
            "success": True,
            "data": {
                "tool_id": tool_id,
                "usage_count": usage_count,
                "success_rate": round(success_rate, 2),
                "avg_execution_time": round(avg_execution_time, 2) if avg_execution_time else 0,
                "trends": trends
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting tool analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get tool analytics")

@app.post("/api/payments")
async def track_payment(payment_data: dict):
    """Track a payment transaction"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO payments (user_id, amount, currency, payment_method, transaction_id, subscription_plan, status, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            payment_data.get("user_id"),
            payment_data.get("amount", 0.0),
            payment_data.get("currency", "USD"),
            payment_data.get("payment_method", "card"),
            payment_data.get("transaction_id"),
            payment_data.get("subscription_plan"),
            payment_data.get("status", "completed"),
            json.dumps(payment_data.get("metadata", {}))
        ))
        
        conn.commit()
        conn.close()
        
        # Broadcast real-time update
        await analytics_manager.broadcast_to_clients("payment_received", {
            "amount": payment_data.get("amount", 0.0),
            "currency": payment_data.get("currency", "USD"),
            "user_id": payment_data.get("user_id")
        })
        
        return {"success": True, "message": "Payment tracked successfully"}
    except Exception as e:
        logger.error(f"Error tracking payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/revenue/summary")
async def get_revenue_summary():
    """Get real revenue summary and statistics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Today's revenue
        today = datetime.now().date().isoformat()
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) FROM payments 
            WHERE DATE(timestamp) = ? AND status = 'completed'
        ''', (today,))
        revenue_today = cursor.fetchone()[0]
        
        # Total revenue
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) FROM payments 
            WHERE status = 'completed'
        ''')
        total_revenue = cursor.fetchone()[0]
        
        # Monthly Recurring Revenue
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) FROM subscriptions 
            WHERE status = 'active' AND billing_cycle = 'monthly'
        ''')
        mrr = cursor.fetchone()[0]
        
        # Payment count
        cursor.execute('''
            SELECT COUNT(*) FROM payments WHERE status = 'completed'
        ''')
        payment_count = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "revenue_today": round(revenue_today, 2),
            "total_revenue": round(total_revenue, 2),
            "mrr": round(mrr, 2),
            "arr": round(mrr * 12, 2),
            "payment_count": payment_count,
            "avg_payment": round(total_revenue / payment_count, 2) if payment_count > 0 else 0
        }
    except Exception as e:
        logger.error(f"Error getting revenue summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Real Analytics Service",
        "timestamp": datetime.now().isoformat(),
        "redis_connected": redis_client is not None,
        "database_connected": os.path.exists(DB_PATH),
        "active_websocket_connections": len(active_connections)
    }

if __name__ == "__main__":
    logger.info("🚀 Starting Real Analytics Service...")
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
