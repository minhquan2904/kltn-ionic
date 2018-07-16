# kltn-ionic

ionic cordova emulate [<platform>]
1. Install
Edit
(both background-geolocation and geolocation)

ionic cordova plugin add cordova-plugin-mauron85-background-geolocation 
npm install --save @ionic-native/background-geolocation 
ionic cordova plugin add cordova-plugin-geolocation --variable GEOLOCATION_USAGE_DESCRIPTION="To locate you"
npm install --save @ionic-native/geolocation

2. Import to app.module.ts
Edit
...

import { Geolocation } from '@ionic-native/geolocation';
import {BackgroundGeolocation} from "@ionic-native/background-geolocation";
...

@NgModule({
  ...

  providers: [
    ...
    BackgroundGeolocation
    Geolocation
    ...
  ]
  ...
})
export class AppModule { }

3. Create service to track device's location
Edit
// locationTracker.service.ts
import {Injectable, NgZone} from '@angular/core';
import {BackgroundGeolocation, BackgroundGeolocationConfig} from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';

@Injectable()
export class LocationTrackerService {
    public watch: any;
    public lat: number = 0;
    public lng: number = 0;
 
 
    constructor(
      public zone: NgZone,
      public backgroundGeolocation: BackgroundGeolocation,
      public geolocation: Geolocation
    ) {
 
    }
 
    public startTracking() {
 
      let config : BackgroundGeolocationConfig = {
        desiredAccuracy: 0,
        stationaryRadius: 20,
        distanceFilter: 10,
        debug: true,
        interval: 2000
      };
 
      this.backgroundGeolocation.configure(config).subscribe((location) => {
 
        console.log('BackgroundGeolocation:  ' + location.latitude + ',' + location.longitude);
 
       
// Update inside of Angular's zone
        this.zone.run(() => {
          this.lat = location.latitude;
          this.lng = location.longitude;
        });
      }, (err) => {
        console.log(err);
        });
 
      this.backgroundGeolocation.start();
 
     
// Background tracking
      let options = {
        frequency: 3000,
        enableHighAccuracy: true
      };
 
      this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
        console.log(position);
 
        this.zone.run(() => {
          this.lat = position.coords.latitude;
          this.lng = position.coords.longitude;
        });
      });
    }
 
    public stopTracking() {
      console.log('stopTracking');
 
      this.backgroundGeolocation.finish();
      this.watch.unsubscribe();
    }
}

Then import it to your app.module.ts as provider 
...
import { LocationTrackerService } from '../_services/LocationTracker.service';
...

@NgModule({
  ...

  providers: [
    ...
    LocationTrackerService,
    ...
  ]
  ...
})
export class AppModule { }

4. Working with location in your component
Edit
// yourpage.html
<ion-header>
  <ion-navbar>
    <ion-title>
      Ionic Blank
    </ion-title>
  </ion-navbar>
</ion-header>

<ion-content padding>
  <h3>Current Latitude: 
{{locationTracker.lat}}
</h3>
  <h3>Current Longitude: 
{{locationTracker.lng}}
</h3>

  <button ion-button full primary (click)="start()">Start Tracking</button>
  <button ion-button full primary (click)="stop()">Stop Tracking</button>
 
  <div id="map" class="map"></div>
</ion-content>

// yourpage.ts
...
import ol from 'openlayers';

import { LocationTrackerService } from '../../_services/index';
...
@ViewChild('map') map;

 
// list marker
  vectorSource = new ol.source.Vector({}); 
 

// marker style
  iconStyle = new ol.style.Style({
   image: new ol.style.Icon(({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.75,
      src: 'http://openlayers.org/en/v3.9.0/examples/data/icon.png'
    }))
  });
 
// layer to add to map
  vectorLayer = new ol.layer.Vector({
    source: this.vectorSource,
    style: this.iconStyle
  });

 
//default map
  london = ol.proj.transform([-0.12755, 51.507222], 'EPSG:4326', 'EPSG:3857');
  view = new ol.View({
      center: this.london,
      zoom: 2
    });
 

// marker
  positionFeature = new ol.Feature();
 
  constructor(public navCtrl: NavController, public locationTracker: LocationTrackerService ) {}
ionViewDidEnter() {
    this.loadmap();
  }

  loadmap() {
   this.map = new ol.Map({
      layers: [new ol.layer.Tile({ source: new ol.source.XYZ({
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      }) }), this.vectorLayer],
      target: document.getElementById('map'),
      view: this.view,
      controls: ol.control.defaults().extend([
        new ol.control.FullScreen(),
        new ol.control.OverviewMap(),
        new ol.control.ZoomToExtent()
      ]),
      interactions:  ol.interaction.defaults().extend([
        new ol.interaction.DoubleClickZoom(),
        new ol.interaction.DragRotateAndZoom()
        ])
    });
   
  }
  public start() {
    this.locationTracker.startTracking();
    let coordinate = ol.proj.fromLonLat([this.locationTracker.lng,this.locationTracker.lat]);
    this.positionFeature.setGeometry(new ol.geom.Point(coordinate));
    this.vectorSource.addFeature(this.positionFeature);
  }

  public stop() {
    this.locationTracker.stopTracking();
  }