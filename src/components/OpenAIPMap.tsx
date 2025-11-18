import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { openAipConfig } from '@/lib/openaip';

interface MapPosition {
  lat: number;
  lng: number;
}

const DEFAULT_POSITION: MapPosition = {
  lat: 63.7000,
  lng: 9.6000,
};

function LocationMarker() {
  const map = useMap();
  const [position, setPosition] = useState<MapPosition | null>(null);

  useEffect(() => {
    map.locate();
    
    map.on('locationfound', (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });

    map.on('locationerror', () => {
      console.log('Location access denied, using default position');
      setPosition(DEFAULT_POSITION);
    });

    return () => {
      map.off('locationfound');
      map.off('locationerror');
    };
  }, [map]);

  return null;
}

export function OpenAIPMap() {
  const [center] = useState<[number, number]>([DEFAULT_POSITION.lat, DEFAULT_POSITION.lng]);

  if (!openAipConfig.apiKey) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-4">OpenAIP API Key Required</h2>
          <p className="text-muted-foreground">
            Please add your OpenAIP API key to the environment variables as VITE_OPENAIP_API_KEY
          </p>
        </div>
      </div>
    );
  }

  const baseTileUrl = `${openAipConfig.tiles.base}?apiKey=${openAipConfig.apiKey}`;
  const airspaceTileUrl = `${openAipConfig.tiles.airspace}?apiKey=${openAipConfig.apiKey}`;

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={center}
        zoom={8}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openaip.net">OpenAIP</a>'
          url={baseTileUrl}
        />
        <TileLayer
          url={airspaceTileUrl}
          opacity={0.5}
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
}
