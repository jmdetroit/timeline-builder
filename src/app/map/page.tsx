'use client';

import dynamic from 'next/dynamic';

const MapEditorLayout = dynamic(() => import('@/components/map/MapEditorLayout'), {
  ssr: false,
});

export default function MapPage() {
  return <MapEditorLayout />;
}
