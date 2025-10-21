import React, { createContext, FC, ReactNode, useContext } from 'react';
import { useLiveApi, UseLiveApiResults } from '../hooks/use-live-api';

const LiveAPIContext = createContext<UseLiveApiResults | undefined>(undefined);

export type LiveAPIProviderProps = {
  children: ReactNode;
  apiKey: string;
  map: google.maps.maps3d.Map3DElement | null;
  placesLib: google.maps.PlacesLibrary | null;
  elevationLib: google.maps.ElevationLibrary | null;
  geocoder: google.maps.Geocoder | null;
  padding: [number, number, number, number];
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({
  apiKey,
  children,
  map,
  placesLib,
  elevationLib,
  geocoder,
  padding,
}) => {
  const liveAPI = useLiveApi({
    apiKey,
    map,
    placesLib,
    elevationLib,
    geocoder,
    padding,
  });

  return (
    <LiveAPIContext.Provider value={liveAPI}>
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPIContext = () => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error('useLiveAPIContext must be used wihin a LiveAPIProvider');
  }
  return context;
};
