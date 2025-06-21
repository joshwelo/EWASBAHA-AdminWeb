import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import Layout from './Layout';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: -3.745,
  lng: -38.523
};

const FloodAffectedAreas = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCzQbflN3B55lBQ8vTQKZF5qe9g0Mgrx7Q"
  });

  const [map, setMap] = React.useState(null);
  const [markers, setMarkers] = React.useState([]);

  const onMapClick = React.useCallback((event) => {
    setMarkers((current) => [
      ...current,
      {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);

  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  return (
    <Layout>
      <div className="w-full h-full">
        <div className="px-6 py-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-col gap-3">
              <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Flood Affected Areas</p>
              <p className="text-[#60758a] text-sm font-normal leading-normal">Visual interface to mark and verify affected locations.</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={10}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                  onClick={onMapClick}
                >
                  {markers.map((marker, index) => (
                    <Marker
                      key={index}
                      position={{ lat: marker.lat, lng: marker.lng }}
                      icon={{
                        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                      }}
                    />
                  ))}
                </GoogleMap>
              ) : <div>Loading...</div>}
            </div>
            <div>
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                  <p className="text-[#111418] text-base font-medium leading-normal">Area Information</p>
                  <div className="mt-2">
                    <input type="text" placeholder="Area Name" className="w-full px-3 py-2 text-sm text-gray-700 border rounded-lg focus:outline-none" />
                    <p className="mt-2 text-sm text-gray-500">Alert Count: {markers.length}</p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                    <p className="text-[#111418] text-base font-medium leading-normal">Media Upload</p>
                    <div className="mt-2">
                        <input type="file" multiple className="w-full text-sm text-gray-700"/>
                    </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                    <button className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none">Mark as Flood</button>
                </div>
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                    <p className="text-[#111418] text-base font-medium leading-normal">Alert Summary</p>
                    <textarea placeholder="Summary of reports..." className="w-full h-24 px-3 py-2 mt-2 text-sm text-gray-700 border rounded-lg focus:outline-none"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FloodAffectedAreas; 