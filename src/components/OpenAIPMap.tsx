import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { openAipConfig } from "@/lib/openaip";
import { aviationStackConfig } from "@/lib/aviationstack";

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

    // OpenAIP-luftrom
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

    // 🔹 Aviationstack: layer for live flights
    const flightsLayer = L.layerGroup().addTo(map);

    async function fetchFlights() {
      try {
        if (!aviationStackConfig.accessKey) {
          console.warn("VITE_AVIATIONSTACK_ACCESS_KEY mangler – hopper over flights.");
          return;
        }

        // Vi henter et globalt sett med aktive flights (begrenset til f.eks. 100)
        const url =
          `${aviationStackConfig.baseUrl}/flights` +
          `?access_key=${encodeURIComponent(aviationStackConfig.accessKey)}` +
          `&flight_status=active&limit=100`;

        const res = await fetch(url);

        if (!res.ok) {
          console.warn("Aviationstack error:", res.status, res.statusText);
          return;
        }

        const json = await res.json();
        const data = json.data || [];

        flightsLayer.clearLayers();

        const bounds = map.getBounds();

        for (const flight of data) {
          const live = flight.live;
          if (!live) continue;
          if (live.is_ground) continue;

          const lat = live.latitude;
          const lon = live.longitude;

          if (lat == null || lon == null) continue;

          // Filtrer til det kartutsnittet brukeren faktisk ser
          if (!bounds.contains([lat, lon])) continue;

          const callsign =
            (flight.flight && (flight.flight.iata || flight.flight.icao || flight.flight.number)) ||
            "Ukjent flight";

          const airlineName = flight.airline?.name || "";
          const altitude = live.altitude;
          const speed = live.speed_horizontal;
          const direction = live.direction;

          const marker = L.circleMarker([lat, lon], {
            radius: 4,
            weight: 1,
            fillOpacity: 0.9,
          });

          const infoParts: string[] = [];
          infoParts.push(`<div><strong>${callsign}</strong></div>`);
          if (airlineName) infoParts.push(`<div>${airlineName}</div>`);
          if (altitude != null) {
            infoParts.push(`<div>Høyde: ${Math.round(altitude)} m</div>`);
          }
          if (speed != null) {
            infoParts.push(`<div>Fart: ${Math.round(speed)} km/t</div>`);
          }
          if (direction != null) {
            infoParts.push(`<div>Kurs: ${Math.round(direction)}°</div>`);
          }

          marker.bindPopup(`<div>${infoParts.join("")}</div>`);
          marker.addTo(flightsLayer);
        }
      } catch (err) {
        console.error("Feil ved henting av Aviationstack-data:", err);
      }
    }

    // Første kall
    fetchFlights();

    // Oppdater hvert 30. sekund (tilpass mht. request-kvote)
    const interval = setInterval(fetchFlights, 30000);

    // Oppdater også når brukeren panorerer/zoomer (men ikke spam)
    let panTimeout: number | undefined;
    map.on("moveend", () => {
      if (panTimeout) window.clearTimeout(panTimeout);
      panTimeout = window.setTimeout(fetchFlights, 1000);
    });

    // Rydd opp ved unmount
    return () => {
      clearInterval(interval);
      map.off("moveend");
      map.remove();
    };
  }, []);

  // Hvis OpenAIP key mangler, viser vi fortsatt kart (kun OSM + flights)
  if (!openAipConfig.apiKey) {
    return (
      <div style={{ width: "100%", height: "100vh" }}>
        <div style={{ padding: 16 }}>
          <h2>OpenAIP API key mangler</h2>
          <p>
            Sett miljøvariabelen <code>VITE_OPENAIP_API_KEY</code> for luftromslag.
            Flight-laget fra Aviationstack vil fortsatt forsøkes vist hvis
            <code>VITE_AVIATIONSTACK_ACCESS_KEY</code> er satt.
          </p>
        </div>
        <div
          ref={mapRef}
          style={{ width: "100%", height: "70vh", marginTop: "1rem" }}
        />
      </div>
    );
  }

  // Normal visning: fullskjermkart med luftrom + flights
  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100vh" }}
    />
  );
}
