import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { openAipConfig } from "@/lib/openaip";

interface MapPosition {
  lat: number;
  lng: number;
}

const DEFAULT_POSITION: MapPosition = {
  lat: 63.7,
  lng: 9.6,
};

function LocationMarker() {
  const map = useMap();
  const [position, setPosition] = useState<MapPosition | null>(null);

  useEffect(() => {
    map.locate();

    function onLocationFound(e: any) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    }

    function onLocationError() {
      console.log("Location access denied, using default position");
      setPosition(DEFAULT_POSITION);
      map.setView(DEFAULT_POSITION, map.getZoom());
    }

    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);

    return () => {
      map.off("locationfound", onLocationFound);
      map.off("locationerror", onLocationError);
    };
  }, [map]);

  return null;
}

export function OpenAIPMap() {
  const [center] = useState<[number, number]>([
    DEFAULT_POSITION.lat,
    DEFAULT_POSITION.lng,
  ]);

  console.log("OpenAIP API key:", openAipConfig.apiKey);

  if (!openAipConfig.apiKey) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            OpenAIP API Key Required
          </h2>
          <p className="text-muted-foreground">
            Please add your OpenAIP API key to the environment variables as
            VITE_OPENAIP_API_KEY
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
        <TileLayer url={airspaceTileUrl} opacity={0.5} />
        <LocationMarker />
      </MapContainer>
    </div>
  );
}
