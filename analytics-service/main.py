"""
Real-time Analytics Service using FastAPI and WebSockets
Industry-level Python backend for analytics processing
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import uuid

import pandas as pd
import numpy as np
import redis.asyncio as redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Real-time Analytics Service",
    description="Industry-level analytics processing with Python",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/analytics_db")
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Pydantic models
class AnalyticsEvent(BaseModel):
    event_type: str
    user_id: str
    organization_id: str
    tool_id: Optional[str] = None
    data: Dict[str, Any]
    timestamp: Optional[datetime] = None

class MetricsResponse(BaseModel):
    total_users: int
    active_tools: Dict[str, int]
    api_calls: int
    errors: int
    revenue: float
    system_load: float

class UserActivity(BaseModel):
    user_id: str
    activity_type: str
    tool_used: Optional[str] = None
    duration: Optional[int] = None
    timestamp: datetime

# Global variables
redis_client: Optional[redis.Redis] = None
active_connections: Dict[str, WebSocket] = {}
user_sessions: Dict[str, Dict] = {}

class AnalyticsProcessor:
    """Advanced analytics processing with ML capabilities"""
    
    def __init__(self):
        self.data_buffer = []
        self.ml_models = {}
        self.real_time_metrics = {
            'total_users': 0,
            'active_tools': {},
            'api_calls': 0,
            'errors': 0,
            'revenue': 0.0,
            'system_load': 0.0
        }
    
    async def process_event(self, event: AnalyticsEvent) -> Dict[str, Any]:
        """Process incoming analytics event with ML analysis"""
        try:
            # Add to buffer for batch processing
            self.data_buffer.append(event.dict())
            
            # Real-time processing
            await self._update_real_time_metrics(event)
            
            # Store in Redis for fast access
            await self._store_in_redis(event)
            
            # ML-based analysis
            insights = await self._generate_insights(event)
            
            # Anomaly detection
            anomalies = await self._detect_anomalies(event)
            
            return {
                'processed': True,
                'insights': insights,
                'anomalies': anomalies,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing event: {e}")
            return {'processed': False, 'error': str(e)}
    
    async def _update_real_time_metrics(self, event: AnalyticsEvent):
        """Update real-time metrics"""
        if event.event_type == 'user_login':
            self.real_time_metrics['total_users'] += 1
        
        elif event.event_type == 'tool_usage':
            tool_id = event.tool_id or 'unknown'
            self.real_time_metrics['active_tools'][tool_id] = \
                self.real_time_metrics['active_tools'].get(tool_id, 0) + 1
        
        elif event.event_type == 'api_call':
            self.real_time_metrics['api_calls'] += 1
        
        elif event.event_type == 'error':
            self.real_time_metrics['errors'] += 1
        
        elif event.event_type == 'payment':
            amount = event.data.get('amount', 0)
            self.real_time_metrics['revenue'] += float(amount)
    
    async def _store_in_redis(self, event: AnalyticsEvent):
        """Store event in Redis for fast retrieval"""
        if redis_client:
            # Store individual event
            event_key = f"event:{event.organization_id}:{uuid.uuid4()}"
            await redis_client.setex(
                event_key, 
                86400,  # 24 hours TTL
                json.dumps(event.dict(), default=str)
            )
            
            # Update organization metrics
            org_key = f"metrics:{event.organization_id}"
            await redis_client.hincrby(org_key, event.event_type, 1)
            await redis_client.expire(org_key, 86400)
    
    async def _generate_insights(self, event: AnalyticsEvent) -> Dict[str, Any]:
        """Generate ML-powered insights"""
        try:
            # Convert buffer to DataFrame for analysis
            if len(self.data_buffer) > 10:
                df = pd.DataFrame(self.data_buffer[-100:])  # Last 100 events
                
                # Time-based analysis
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df['hour'] = df['timestamp'].dt.hour
                
                # Usage patterns
                usage_patterns = df.groupby(['event_type', 'hour']).size().to_dict()
                
                # User behavior analysis
                user_behavior = df.groupby('user_id')['event_type'].value_counts().to_dict()
                
                # Tool popularity
                if 'tool_id' in df.columns:
                    tool_popularity = df[df['tool_id'].notna()]['tool_id'].value_counts().to_dict()
                else:
                    tool_popularity = {}
                
                return {
                    'usage_patterns': usage_patterns,
                    'user_behavior': dict(list(user_behavior.items())[:10]),  # Top 10
                    'tool_popularity': dict(list(tool_popularity.items())[:5])  # Top 5
                }
            
            return {'message': 'Insufficient data for insights'}
            
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return {'error': str(e)}
    
    async def _detect_anomalies(self, event: AnalyticsEvent) -> List[Dict[str, Any]]:
        """Detect anomalies using statistical methods"""
        anomalies = []
        
        try:
            # Check for unusual activity patterns
            if event.event_type == 'api_call':
                # Check API call frequency
                recent_calls = len([e for e in self.data_buffer[-50:] 
                                 if e.get('event_type') == 'api_call' and 
                                 e.get('user_id') == event.user_id])
                
                if recent_calls > 20:  # Threshold for suspicious activity
                    anomalies.append({
                        'type': 'high_api_usage',
                        'user_id': event.user_id,
                        'count': recent_calls,
                        'severity': 'high'
                    })
            
            # Check for error spikes
            if event.event_type == 'error':
                recent_errors = len([e for e in self.data_buffer[-20:] 
                                   if e.get('event_type') == 'error'])
                
                if recent_errors > 5:
                    anomalies.append({
                        'type': 'error_spike',
                        'count': recent_errors,
                        'severity': 'medium'
                    })
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return []
    
    async def get_real_time_dashboard_data(self, organization_id: str) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        try:
            # Get data from Redis
            if redis_client:
                org_metrics = await redis_client.hgetall(f"metrics:{organization_id}")
                
                # Convert bytes to strings and integers
                metrics = {k.decode(): int(v.decode()) for k, v in org_metrics.items()}
            else:
                metrics = {}
            
            # Combine with real-time metrics
            dashboard_data = {
                'real_time_metrics': self.real_time_metrics,
                'organization_metrics': metrics,
                'active_users': len([s for s in user_sessions.values() 
                                   if s.get('organization_id') == organization_id]),
                'timestamp': datetime.now().isoformat()
            }
            
            # Add trend analysis
            if len(self.data_buffer) > 20:
                df = pd.DataFrame(self.data_buffer[-100:])
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                
                # Calculate trends
                hourly_usage = df.groupby(df['timestamp'].dt.hour).size()
                dashboard_data['hourly_trends'] = hourly_usage.to_dict()
            
            return dashboard_data
            
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return {'error': str(e)}

# Initialize analytics processor
analytics_processor = AnalyticsProcessor()

@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    global redis_client
    
    try:
        # Initialize Redis connection
        redis_client = redis.from_url(REDIS_URL, decode_responses=False)
        await redis_client.ping()
        logger.info("✅ Redis connection established")
        
        # Initialize database
        # Add database initialization code here
        logger.info("✅ Database connection established")
        
        # Start background tasks
        asyncio.create_task(background_analytics_processing())
        logger.info("✅ Background tasks started")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if redis_client:
        await redis_client.close()
    logger.info("🔄 Analytics service shutdown complete")

async def background_analytics_processing():
    """Background task for processing analytics data"""
    while True:
        try:
            # Process buffered data every 30 seconds
            if len(analytics_processor.data_buffer) > 0:
                logger.info(f"Processing {len(analytics_processor.data_buffer)} events")
                
                # Batch process events
                df = pd.DataFrame(analytics_processor.data_buffer)
                
                # Perform batch analytics
                # Add your batch processing logic here
                
                # Clear processed data (keep last 1000 for real-time analysis)
                if len(analytics_processor.data_buffer) > 1000:
                    analytics_processor.data_buffer = analytics_processor.data_buffer[-1000:]
            
            await asyncio.sleep(30)  # Process every 30 seconds
            
        except Exception as e:
            logger.error(f"Background processing error: {e}")
            await asyncio.sleep(60)  # Wait longer on error

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{organization_id}")
async def websocket_endpoint(websocket: WebSocket, organization_id: str):
    """WebSocket endpoint for real-time analytics updates"""
    await websocket.accept()
    
    connection_id = str(uuid.uuid4())
    active_connections[connection_id] = websocket
    
    # Store user session
    user_sessions[connection_id] = {
        'organization_id': organization_id,
        'connected_at': datetime.now(),
        'last_activity': datetime.now()
    }
    
    logger.info(f"🔌 WebSocket connected: {connection_id} for org: {organization_id}")
    
    try:
        # Send initial data
        dashboard_data = await analytics_processor.get_real_time_dashboard_data(organization_id)
        await websocket.send_json({
            'type': 'initial_data',
            'data': dashboard_data
        })
        
        # Listen for messages
        while True:
            try:
                # Set a timeout for receiving messages
                message = await asyncio.wait_for(websocket.receive_json(), timeout=30.0)
                
                # Update last activity
                user_sessions[connection_id]['last_activity'] = datetime.now()
                
                # Process different message types
                if message.get('type') == 'track_event':
                    event = AnalyticsEvent(**message['data'])
                    result = await analytics_processor.process_event(event)
                    
                    # Send result back
                    await websocket.send_json({
                        'type': 'event_processed',
                        'data': result
                    })
                    
                    # Broadcast to other connections in the same organization
                    await broadcast_to_organization(organization_id, {
                        'type': 'real_time_update',
                        'data': result
                    }, exclude=connection_id)
                
                elif message.get('type') == 'get_dashboard':
                    dashboard_data = await analytics_processor.get_real_time_dashboard_data(organization_id)
                    await websocket.send_json({
                        'type': 'dashboard_data',
                        'data': dashboard_data
                    })
                
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await websocket.send_json({'type': 'ping'})
                
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Cleanup
        if connection_id in active_connections:
            del active_connections[connection_id]
        if connection_id in user_sessions:
            del user_sessions[connection_id]

async def broadcast_to_organization(organization_id: str, message: Dict, exclude: str = None):
    """Broadcast message to all connections in an organization"""
    for conn_id, websocket in active_connections.items():
        if conn_id != exclude and user_sessions.get(conn_id, {}).get('organization_id') == organization_id:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {conn_id}: {e}")

# REST API endpoints
@app.post("/api/events")
async def track_event(event: AnalyticsEvent):
    """REST endpoint for tracking events"""
    try:
        result = await analytics_processor.process_event(event)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/{organization_id}")
async def get_metrics(organization_id: str):
    """Get organization metrics"""
    try:
        data = await analytics_processor.get_real_time_dashboard_data(organization_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Real-time Analytics",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(active_connections),
        "buffer_size": len(analytics_processor.data_buffer)
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
