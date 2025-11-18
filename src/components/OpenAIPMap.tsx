import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { openAipConfig } from "@/lib/openaip";
import { airplanesLiveConfig } from "@/lib/airplaneslive";

const DEFAULT_POS: [number, number] = [63.7, 9.6];

export function OpenAIPMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Init Leaflet-kart
    const map = L.map(mapRef.current).setView(DEFAULT_POS, 8);

    // OSM base
    L.tileLayer(openAipConfig.tiles.base, {
      attribution: openAipConfig.attribution,
      subdomains: "abc",
    }).addTo(map);

    // OpenAIP luftrom-overlay (hvis API-key finnes)
    if (openAipConfig.apiKey) {
      const airspaceUrl = openAipConfig.tiles.airspace.replace('{key}', openAipConfig.apiKey);
      L.tileLayer(airspaceUrl, {
        opacity: 0.55,
        subdomains: "abc",
      }).addTo(map);
    } else {
      console.warn("Mangler VITE_OPENAIP_API_KEY – viser kun OSM uten luftromslag.");
    }

    // Prøv å sette kartet til brukerens posisjon
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          map.setView(coords, 9);
        },
        () => {
          console.log("Geolokasjon nektet, bruker default posisjon");
        }
      );
    }

    // Lag et eget lag for flytrafikk
    const aircraftLayer = L.layerGroup().addTo(map);

    async function fetchAircraft() {
      try {
        const center = map.getCenter();
        const radiusNm = 150; // radius i nautiske mil rundt kartets sentrum

        const url =
          `${airplanesLiveConfig.baseUrl}/point/` +
          `${center.lat}/${center.lng}/${radiusNm}`;

        console.log("Airplanes.live URL:", url);

        const response = await fetch(url);
        if (!response.ok) {
          console.warn("Airplanes.live error:", response.status, response.statusText);
          return;
        }

        const json = await response.json();

        // JSON-format er typisk { aircraft: [ {...}, {...} ] }
        const aircraft = json.aircraft || [];

        aircraftLayer.clearLayers();

        for (const ac of aircraft) {
          const lat = ac.lat;
          const lon = ac.lon;

          if (lat == null || lon == null) continue;

          const marker = L.circleMarker([lat, lon], {
            radius: 4,
            color: "#ffdd00",
            weight: 1,
            fillOpacity: 0.9,
          });

          const popup = `
            <div>
              <strong>${ac.call || "Ukjent callsign"}</strong><br/>
              ICAO24: ${ac.hex || "?"}<br/>
              Høyde: ${ac.alt_baro ?? "?"} ft<br/>
              Fart: ${ac.gs ?? "?"} kt<br/>
              Heading: ${ac.track ?? "?"}°<br/>
              Type: ${ac.t || "?"}
            </div>
          `;

          marker.bindPopup(popup);
          marker.addTo(aircraftLayer);
        }
      } catch (err) {
        console.error("Feil ved henting av Airplanes.live:", err);
      }
    }

    // Første kall
    fetchAircraft();

    // Oppdater hvert 10. sekund (API er rate limited til 1 request/sek)
    const interval = setInterval(fetchAircraft, 10000);

    // Oppdater når bruker panorerer/zoomer (med enkel debounce)
    let refreshTimer: number | undefined;
    map.on("moveend", () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = window.setTimeout(fetchAircraft, 800);
    });

    // Rydd opp ved unmount
    return () => {
      clearInterval(interval);
      map.off("moveend");
      map.remove();
    };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
}
