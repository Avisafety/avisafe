import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { openAipConfig } from "@/lib/openaip";

const DEFAULT_POSITION: [number, number] = [63.7, 9.6];

export function OpenAIPMap() {
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

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={DEFAULT_POSITION}
        zoom={8}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openaip.net">OpenAIP</a>'
          url={baseTileUrl}
        />
      </MapContainer>
    </div>
  );
}
