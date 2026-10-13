'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  label: string;
  ip: string;
}

export default function MapComponent({ latitude, longitude, label, ip }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 11,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom NetScope Pulse Marker using DivIcon
    const customIcon = L.divIcon({
      className: 'netscope-marker',
      html: `
        <div style="position: relative; width: 28px; height: 28px;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(113, 76, 182, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 4px; border-radius: 9999px; background-color: #421d24; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);"></div>
          <div style="position: absolute; top: 10px; left: 10px; width: 8px; height: 8px; border-radius: 9999px; background-color: #d4c7ff;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: inherit; padding: 4px; font-size: 13px; color: #292827; line-height: 1.4;">
        <strong style="color: #421d24; font-size: 14px;">${ip}</strong><br/>
        <span>${label}</span><br/>
        <small style="color: #666666;">Approx. coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>
      </div>
    `);

    // Invalidate size after brief tick to ensure container layout finished
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, label, ip]);

  return (
    <div className="relative w-full h-[360px] md:h-[420px] rounded-2xl overflow-hidden border border-[#e3e3e2] bg-[#f2f0eb]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#e3e3e2] text-xs font-medium text-[#292827] shadow-sm">
        Approximate Geolocation
      </div>
    </div>
  );
}
