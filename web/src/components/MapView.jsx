import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to center map when location changes
function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng]);
  return null;
}

const MapView = ({ providers, center = [28.6139, 77.2090] }) => {
  const [trackedLocations, setTrackedLocations] = useState({});

  useEffect(() => {
    const sockets = {};

    providers.forEach(provider => {
      // Connect to WebSocket for each provider to simulate live tracking
      // In a real app, you'd only track the one assigned to the user
      const ws = new WebSocket(`ws://localhost:8000/ws/track/${provider.id}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setTrackedLocations(prev => ({
          ...prev,
          [data.provider_id]: { lat: data.lat, lng: data.lng }
        }));
      };

      sockets[provider.id] = ws;
    });

    return () => {
      Object.values(sockets).forEach(ws => ws.close());
    };
  }, [providers]);

  return (
    <div className="map-wrapper" style={{ height: '500px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {providers.map((provider) => {
          const position = trackedLocations[provider.id] 
            ? [trackedLocations[provider.id].lat, trackedLocations[provider.id].lng]
            : [provider.location?.lat || center[0], provider.location?.lng || center[1]];

          return (
            <Marker key={provider.id} position={position}>
              <Popup>
                <div className="map-popup">
                  <strong>{provider.name}</strong><br />
                  Rating: {provider.rating} ★<br />
                  Price: ₹{provider.price}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <RecenterAutomatically lat={center[0]} lng={center[1]} />
      </MapContainer>
    </div>
  );
};

export default MapView;
