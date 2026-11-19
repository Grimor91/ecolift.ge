import { Component, OnInit } from '@angular/core';

// Google Maps is loaded only on this page, not in index.html: the other pages
// stay free of outside scripts, which the security checks (SRI, CSP) reward.
const MAPS_URL = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDFaXNvUSNlqQoqlNBgCgppWcSeYxb5kDM';
let mapsLoading: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve();
  if (!mapsLoading) {
    mapsLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = MAPS_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        mapsLoading = null;
        reject();
      };
      document.head.appendChild(script);
    });
  }
  return mapsLoading;
}

@Component({
  selector: 'app-aboutus',
  templateUrl: './aboutus.component.html',
  styleUrls: ['./aboutus.component.css']
})
export class AboutusComponent implements OnInit {
  mapReady = false;
  center: google.maps.LatLngLiteral = {
      lat: 41.638648,
      lng: 41.622260,
  };
  zoom = 4;
  markerOptions: google.maps.MarkerOptions = {
      draggable: false
  };
  markerPositions: google.maps.LatLngLiteral[] = [];

  ngOnInit(): void {
    loadGoogleMaps().then(() => (this.mapReady = true), () => {});
  }

  addMarker(event: google.maps.MapMouseEvent) {
      if (event.latLng != null) this.markerPositions.push(event.latLng.toJSON());
  }
}
