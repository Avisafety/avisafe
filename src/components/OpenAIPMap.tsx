import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { openAipConfig } from "@/lib/openaip";

const DEFAULT_POSITION: [number, number] = [63.7, 9.6];

export function OpenAIPMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Init Leaflet-kart
    const map = L.map(mapRef.current).setView(DEFAULT_POSITION, 8);

    // OSM bakgrunn
    L.tileLayer(openAipConfig.tiles.base, {
      attribution: openAipConfig.attribution,
      subdomains: "abc",
    }).addTo(map);

    // OpenAIP overlay (hvis apiKey finnes)
    if (openAipConfig.apiKey) {
      const airspaceUrl = openAipConfig.tiles.airspace.replace('{key}', openAipConfig.apiKey);
      L.tileLayer(airspaceUrl, {
        opacity: 0.6,
        subdomains: "abc",
      }).addTo(map);
    } else {
      console.warn("Mangler VITE_OPENAIP_API_KEY – viser kun OSM.");
    }

    // Geolokasjon med fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          map.setView(coords, 10);
        },
        () => {
          console.log("Geolokasjon nektet, bruker default posisjon");
        }
      );
    }

    // Rydd opp når komponenten unmountes
    return () => {
      map.remove();
    };
  }, []);

  // Hvis API-key mangler, viser vi OSM-kart + liten info
  if (!openAipConfig.apiKey) {
    return (
      <div style={{ width: "100%", height: "100vh" }}>
        <div style={{ padding: 16 }}>
          <h2>OpenAIP API key mangler</h2>
          <p>
            Sett miljøvariabelen <code>VITE_OPENAIP_API_KEY</code> i Lovable Environment Settings.
          </p>
        </div>
        <div
          ref={mapRef}
          style={{ width: "100%", height: "70vh", marginTop: "1rem" }}
        />
      </div>
    );
  }

  // Normal visning: fullskjermkart
  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100vh" }}
    />
  );
}
