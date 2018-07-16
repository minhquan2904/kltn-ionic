import {Injectable, NgZone} from '@angular/core';
import {BackgroundGeolocation, BackgroundGeolocationConfig} from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import ol from 'openlayers';

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
  
    public startTracking(vectorSource, view) {
  
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
          // add marker to source 
          let positionFeature = new ol.Feature();
          let coordinate = ol.proj.fromLonLat([location.longitude,location.latitude]);
          positionFeature.setGeometry(new ol.geom.Point(coordinate));
          vectorSource.addFeature(positionFeature);
          view.setZoom(13);
          view.setCenter(coordinate);
          //default
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
        let positionFeature = new ol.Feature();
        let coordinate = ol.proj.fromLonLat([position.coords.longitude,position.coords.latitude]);
        positionFeature.setGeometry(new ol.geom.Point(coordinate));
        vectorSource.addFeature(positionFeature);
        console.log('afds');
        this.zone.run(() => {
          //add marker to source
          
          
          //default
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