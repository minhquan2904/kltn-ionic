import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs/Rx';

import 'rxjs/add/operator/map';
import 'rxjs/add/observable/interval';
import ol from 'openlayers';

import { appResource } from '../../_resources/location';
import { LocationTrackerService } from '../../_services/index'
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  // providers: [Subscription]
})
export class HomePage {
  @ViewChild('map') map;
  isStartTracking: boolean = false;
  // list marker
  vectorSource = new ol.source.Vector({}); 
  public markerArray: Array<any> = [];
  public index: any = 0; // index to loop demo
  sub: Subscription;
  // marker style
  iconStyle = new ol.style.Style({
    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */({
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
  
  constructor(public navCtrl: NavController, 
    public locationTracker: LocationTrackerService) {

  }
  
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
    this.locationTracker.startTracking(this.vectorSource, this.view);
    // let coordinate = ol.proj.fromLonLat([this.locationTracker.lng,this.locationTracker.lat]);
    // this.positionFeature.setGeometry(new ol.geom.Point(coordinate));
    // this.vectorSource.addFeature(this.positionFeature);
    
    this.isStartTracking = true;

  }

  public stop() {
    this.locationTracker.stopTracking();
    this.isStartTracking = false;
  }

  public demo() {
    console.log("start interval!");
    Object.keys(appResource.location).forEach((key) =>  {
      
      let coordinate = ol.proj.fromLonLat([appResource.location[key].lng,appResource.location[key].lat]);
      let positionFeature = new ol.Feature();
      positionFeature.setGeometry(new ol.geom.Point(coordinate));
      this.markerArray.push(positionFeature);
    });
    this.sub = Observable.interval(5000).subscribe((val) => {
      this.addMarker(this.index);
    })
  }

  public addMarker(index) {
    //  console.log(this.markerArray[index].getGeometry());
    
    
    this.index += 1;
    if(index > this.markerArray.length -1 ) {
      this.sub.unsubscribe();
    } else {
      this.view.setZoom(15);

      this.vectorSource.addFeature(this.markerArray[index]);
      this.view.setCenter(this.markerArray[index].getGeometry().getCoordinates());
    }
    //console.log(this.markerArray.length)
  }
}
