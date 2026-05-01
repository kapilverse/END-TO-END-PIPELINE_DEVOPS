import asyncio
import websockets
import json
import random
import time

async def simulate_provider(provider_id, start_lat, start_lng):
    uri = f"ws://localhost:8000/ws/track/{provider_id}"
    async with websockets.connect(uri) as websocket:
        lat, lng = start_lat, start_lng
        while True:
            # Small random movement
            lat += random.uniform(-0.0005, 0.0005)
            lng += random.uniform(-0.0005, 0.0005)
            
            data = {
                "lat": lat,
                "lng": lng,
                "timestamp": time.time()
            }
            await websocket.send(json.dumps(data))
            print(f"Provider {provider_id} moved to: {lat}, {lng}")
            await asyncio.sleep(2)

async def main():
    # Simulate 3 providers
    await asyncio.gather(
        simulate_provider(1, 28.6139, 77.2090),
        simulate_provider(2, 28.6239, 77.2190),
        simulate_provider(3, 28.6039, 77.1990)
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
