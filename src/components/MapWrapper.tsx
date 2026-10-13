'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] md:h-[420px] rounded-2xl bg-[#e3e3e2]/40 animate-pulse flex flex-col items-center justify-center border border-[#e3e3e2] text-[#666666] text-sm gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-[#421d24] border-t-transparent animate-spin" />
      <span>Loading OpenStreetMap view...</span>
    </div>
  ),
});

interface MapWrapperProps {
  latitude: number;
  longitude: number;
  label: string;
  ip: string;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <MapComponent {...props} />;
}
