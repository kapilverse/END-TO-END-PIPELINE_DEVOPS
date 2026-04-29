from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

router = APIRouter()

# Store active connections: {provider_id: [user_websockets]}
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, provider_id: int):
        await websocket.accept()
        if provider_id not in self.active_connections:
            self.active_connections[provider_id] = []
        self.active_connections[provider_id].append(websocket)

    def disconnect(self, websocket: WebSocket, provider_id: int):
        if provider_id in self.active_connections:
            self.active_connections[provider_id].remove(websocket)

    async def broadcast_location(self, provider_id: int, location_data: dict):
        if provider_id in self.active_connections:
            for connection in self.active_connections[provider_id]:
                await connection.send_json(location_data)

manager = ConnectionManager()

@router.websocket("/ws/track/{provider_id}")
async def tracking_endpoint(websocket: WebSocket, provider_id: int):
    await manager.connect(websocket, provider_id)
    try:
        while True:
            # Wait for location updates from the provider app
            data = await websocket.receive_json()
            # Broadcast to all users tracking this provider
            await manager.broadcast_location(provider_id, {
                "provider_id": provider_id,
                "lat": data["lat"],
                "lng": data["lng"],
                "timestamp": data.get("timestamp")
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket, provider_id)
