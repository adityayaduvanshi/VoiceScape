import React, { useCallback, useState, useEffect, useRef } from 'react';

import ControlTray from './components/ControlTray';
import ErrorScreen from './components/ErrorScreen';
import StreamingConsole from './components/streaming-console/StreamingConsole';
import PopUp from './components/popup/PopUp';
import Sidebar from './components/Sidebar';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
// FIX: Correctly import APIProvider as a named export.
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Map3D, Map3DCameraProps } from './components/map-3d';
import { useMapStore } from './lib/state';
import { MapController } from './lib/map-controller';

const API_KEY = process.env.GEMINI_API_KEY as string;
if (typeof API_KEY !== 'string') {
  throw new Error('Missing required environment variable: GEMINI_API_KEY');
}

const INITIAL_VIEW_PROPS = {
  center: {
    lat: 28.6448,
    lng: 77.216721,
    altitude: 300,
  },
  range: 3000,
  heading: 0,
  tilt: 30,
  roll: 0,
};

/**
 * The main application component. It serves as the primary view controller,
 * orchestrating the layout of UI components and reacting to global state changes
 * to update the 3D map.
 */
function AppComponent() {
  const [map, setMap] = useState<google.maps.maps3d.Map3DElement | null>(null);
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);
  // Subscribe to marker and camera state from the global Zustand store.
  const {
    markers,
    cameraTarget,
    setCameraTarget,
    preventAutoFrame,
    setUserLocation,
  } = useMapStore();
  const mapController = useRef<MapController | null>(null);

  const maps3dLib = useMapsLibrary('maps3d');
  const elevationLib = useMapsLibrary('elevation');

  const [showPopUp, setShowPopUp] = useState(true);

  const consolePanelRef = useRef<HTMLDivElement>(null);
  const controlTrayRef = useRef<HTMLElement>(null);
  // Padding state is used to ensure map content isn't hidden by UI elements.
  const [padding, setPadding] = useState<[number, number, number, number]>([
    0.05, 0.05, 0.05, 0.05,
  ]);

  // Effect: Get user's initial location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords = { lat: latitude, lng: longitude };
          setViewProps((prev) => ({
            ...prev,
            center: { ...prev.center, ...userCoords, altitude: 500 },
            range: 5000,
          }));
          setUserLocation(userCoords);
        },
        (error) => {
          console.error('Geolocation error on initial load: ', error.message);
          // If geolocation fails, the app will just use the default Chicago location.
        }
      );
    }
  }, [setUserLocation]);

  useEffect(() => {
    if (geocodingLib) {
      setGeocoder(new geocodingLib.Geocoder());
    }
  }, [geocodingLib]);

  useEffect(() => {
    if (map && maps3dLib && elevationLib) {
      mapController.current = new MapController({
        map,
        maps3dLib,
        elevationLib,
      });
    }
    // Invalidate the controller if its dependencies change.
    return () => {
      mapController.current = null;
    };
  }, [map, maps3dLib, elevationLib]);

  useEffect(() => {
    const calculatePadding = () => {
      const consoleEl = consolePanelRef.current;
      const trayEl = controlTrayRef.current;
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      if (!consoleEl || !trayEl) return;

      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      const top = 0.05;
      const right = 0.05;
      let bottom = 0.05;
      let left = 0.05;

      if (!isMobile) {
        // On desktop, console is on the left. The tray is now inside it.
        left = Math.max(left, consoleEl.offsetWidth / vw + 0.02); // add 2% buffer
        // The tray no longer covers the bottom of the map on desktop.
      }

      setPadding([top, right, bottom, left]);
    };

    // Use ResizeObserver for more reliable updates on the elements themselves.
    const observer = new ResizeObserver(calculatePadding);
    if (consolePanelRef.current) observer.observe(consolePanelRef.current);
    if (controlTrayRef.current) observer.observe(controlTrayRef.current);

    // Also listen to window resize
    window.addEventListener('resize', calculatePadding);

    // Initial calculation after a short delay to ensure layout is stable
    const timeoutId = setTimeout(calculatePadding, 100);

    return () => {
      window.removeEventListener('resize', calculatePadding);
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleClosePopUp = () => {
    setShowPopUp(false);
  };

  useEffect(() => {
    if (map) {
      const banner = document.querySelector(
        '.vAygCK-api-load-alpha-banner'
      ) as HTMLElement;
      if (banner) {
        banner.style.display = 'none';
      }
    }
  }, [map]);

  useEffect(() => {
    if (!mapController.current) return;

    const controller = mapController.current;
    controller.clearMap();

    if (markers.length > 0) {
      controller.addMarkers(markers);
    }

    // Combine all points from markers for framing
    const markerPositions = markers.map((m) => m.position);
    const allEntities = [...markerPositions].map((p) => ({ position: p }));

    if (allEntities.length > 0 && !preventAutoFrame) {
      controller.frameEntities(allEntities, padding);
    }
  }, [markers, padding, preventAutoFrame]); // Re-run when markers or padding change

  // Effect: Reactively handle direct camera movement requests.
  // This effect listens for changes to `cameraTarget`. Tools can set this state
  // to request a direct camera flight to a specific location or view. Once the
  // flight is initiated, the target is cleared to prevent re-triggering.
  useEffect(() => {
    if (cameraTarget && mapController.current) {
      mapController.current.flyTo(cameraTarget);
      // Reset the target so it doesn't re-trigger on re-renders
      setCameraTarget(null);
      // After a direct camera flight, reset the auto-frame prevention flag
      // to ensure subsequent marker updates behave as expected.
      useMapStore.getState().setPreventAutoFrame(false);
    }
  }, [cameraTarget, setCameraTarget]);

  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
    setViewProps((oldProps) => ({ ...oldProps, ...props }));
  }, []);

  return (
    <LiveAPIProvider
      apiKey={API_KEY}
      map={map}
      placesLib={placesLib}
      elevationLib={elevationLib}
      geocoder={geocoder}
      padding={padding}
    >
      <ErrorScreen />
      <Sidebar />
      {showPopUp && <PopUp onClose={handleClosePopUp} />}
      <div className="streaming-console">
        <div className="console-panel" ref={consolePanelRef}>
          <StreamingConsole />
          <ControlTray trayRef={controlTrayRef} />
        </div>
        <div className="map-panel">
          <Map3D
            ref={(element) => setMap(element ?? null)}
            onCameraChange={handleCameraChange}
            {...viewProps}
          ></Map3D>
        </div>
      </div>
    </LiveAPIProvider>
  );
}

/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  return (
    <div className="App">
      <APIProvider
        version={'alpha'}
        apiKey={'AIzaSyCYTvt7YMcKjSNTnBa42djlndCeDvZHkr0'}
        solutionChannel={'gmp_aistudio_itineraryapplet_v1.0.0'}
      >
        <AppComponent />
      </APIProvider>
    </div>
  );
}

export default App;
