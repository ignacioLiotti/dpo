'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Machine } from '../types';
import { geocodeLocation, getBoundsForCoordinates } from '../lib/geocoding';
import { renderToString } from 'react-dom/server';

export function MarkerIcon({ color }: { color: string }) {
  return (
    <div className="relative">
      <div
        className="absolute -inset-2 w-10 h-10 animate-ping rounded-full bg-[#3596ff]"
        style={{
          opacity: 0.2,
        }}
      />
      <div
        className="relative rounded-full border-[3px] border-white shadow-lg transform-gpu bg-[#3596ff] z-10"
        style={{
          width: 20,
          height: 20,
        }}
      >
        <div
          className="absolute inset-0 rounded-full bg-white/20"
          style={{
            backdropFilter: 'blur(1px)',
          }}
        />
      </div>
    </div>
  );
}

const iconHTML = renderToString(<MarkerIcon color="red" />);

const icon = L.divIcon({
  html: iconHTML,
  className: '!m-0', // remove default Leaflet styles
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});


// Fix for default marker icons in react-leaflet
// const icon = L.icon({
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// Component to update map bounds when coordinates change
function BoundsUpdater({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = getBoundsForCoordinates(coordinates);
      map.fitBounds(bounds);
    }
  }, [coordinates, map]);

  return null;
}

interface Props {
  machines: Machine[];
}

export default function MapComponent({ machines }: Props) {
  const mapRef = useRef<L.Map>(null);
  const [coordinates, setCoordinates] = useState<Map<string, [number, number]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Default center (will be updated once coordinates are loaded)
  const defaultCenter: [number, number] = [-34.6037, -58.3816];

  useEffect(() => {
    let mounted = true;

    async function loadCoordinates() {
      setIsLoading(true);
      const newCoordinates = new Map<string, [number, number]>();

      // Process locations in sequence to respect rate limits
      for (const machine of machines) {
        if (!mounted) break;

        const coords = await geocodeLocation(machine.location);
        if (coords) {
          newCoordinates.set(machine.id, coords);
        }
      }

      if (mounted) {
        setCoordinates(newCoordinates);
        setIsLoading(false);
      }
    }

    loadCoordinates();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [machines]);

  const allCoordinates = Array.from(coordinates.values());

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading locations...</p>
          </div>
        </div>
      )}
      <MapContainer
        ref={mapRef}
        key="map"
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <BoundsUpdater coordinates={allCoordinates} />
        {machines.map(machine => {
          const machineCoords = coordinates.get(machine.id);
          if (!machineCoords) return null;

          return (
            <Marker
              key={machine.id}
              position={machineCoords}
              icon={icon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{machine.type}</h3>
                  <p className="text-sm text-muted-foreground">{machine.location}</p>
                  <p className="text-sm mt-2">{machine.specs}</p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                      ${machine.status === 'Available' ? 'bg-green-100 text-green-700' :
                        machine.status === 'In Use' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'}`}
                    >
                      {machine.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
} 