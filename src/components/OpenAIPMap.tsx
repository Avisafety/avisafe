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

    // OSM-bakgrunn
    L.tileLayer(openAipConfig.tiles.base, {
      attribution: openAipConfig.attribution,
      subdomains: "abc",
    }).addTo(map);

    // OpenAIP-luftrom (bygger URL med apiKey i stedet for {key}-option)
    if (openAipConfig.apiKey && openAipConfig.tiles.airspace) {
      const airspaceUrl = openAipConfig.tiles.airspace.replace("{key}", openAipConfig.apiKey);

      L.tileLayer(airspaceUrl, {
        opacity: 0.55,
        subdomains: "abc",
      }).addTo(map);
    } else if (!openAipConfig.apiKey) {
      console.warn("OpenAIP API key mangler – viser kun OSM-bakgrunn (ingen luftromslag).");
    }

    // Geolokasjon med fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          map.setView(coords, 9);
        },
        () => {
          console.log("Geolokasjon nektet, bruker default posisjon");
        },
      );
    }

    // Eget lag for flytrafikk (Airplanes.live)
    const aircraftLayer = L.layerGroup().addTo(map);

    async function fetchAircraft() {
      try {
        const center = map.getCenter();
        const radiusNm = 150; // radius i nautiske mil rundt kartets sentrum

        const url = `${airplanesLiveConfig.baseUrl}/point/` + `${center.lat}/${center.lng}/${radiusNm}`;

        console.log("Airplanes.live URL:", url);

        const response = await fetch(url);
        if (!response.ok) {
          console.warn("Airplanes.live error:", response.status, response.statusText);
          return;
        }

        const json = await response.json();
        console.log("Airplanes.live response:", json);

        // Airplanes.live bruker typisk "ac" som liste med fly
        const aircraft = json.ac || json.aircraft || [];

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

    // Oppdater etter pan/zoom (med enkel debounce)
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
