 require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/layers/TileLayer",
    "esri/widgets/Slider"
  ], function(esriConfig, Map, MapView, FeatureLayer, TileLayer, Slider) {  

  // Create a style for the chartsLayer
  const renderer = {
    type: "simple",  // autocasts as new SimpleRenderer()
    symbol: {
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: [ 255, 0, 0],
      outline: {  // autocasts as new SimpleLineSymbol()
        width: 2,
        color: "black"
      }
    }
  }; 

  // add FIPS TileLayers to the map
  const atlas_1885 = new TileLayer({
     url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Robinson_Atlas_1885/MapServer",
     visible: false
  });

  const fips_1897 = new TileLayer({
     url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Sanborn_1897_5/MapServer",
     visible: false
  });

  const fips_1915 = new TileLayer({
     url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Sanborn_1915/MapServer",
     visible: false
  });

 const fips_1910 = new TileLayer({
     url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Sanborn_1910/MapServer",
     visible: false
  });
  
 const fips_49_51 = new TileLayer({
     url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Sanborn_1949_1951/MapServer",
     visible: true
  });
  
  // Add the excavation sites layer to the map   
  const sitesLayer = new FeatureLayer({
    url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/OHC_Excavation_Boundaries/FeatureServer/0",
    outFields: ["*"], // Return all fields so it can be queried client-side
    renderer: renderer
  });

  const map = new Map({
    basemap: "satellite",
    layers: [atlas_1885, fips_1897, fips_1915, fips_1910, fips_49_51, sitesLayer]
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-83.052756,42.387895],
    zoom: 20
  });

  // set the default opacity of the sanborn layers
  atlas_1885.opacity = 100;  
  fips_1897.opacity = 100;
  fips_1910.opacity = 100;
  fips_1915.opacity = 100;
  fips_49_51.opacity = 100; 

  //map.add(fips_1897);

  // add esri widgets
  const slider = new Slider({
    container: "sliderDiv",
    layout: "vertical",
    min: 0,
    max: 100,
    values: [ 100 ],
    snapOnClickEnabled: false,
    visibleElements: {
      labels: false,
      rangeLabels: true
    }
  });

  // Listen for changes on the opacity slider
  slider.on(['thumb-change', 'thumb-drag'], function(event) {
  atlas_1885.opacity = event.value / 100;  
  fips_1897.opacity = event.value / 100;
  fips_1910.opacity = event.value / 100;
  fips_1915.opacity = event.value / 100;
  fips_49_51.opacity = event.value / 100;   
});

  // Code for the location dropdown menu
  $("#location").change(function () {
    // Get the value of the selected item
    var value = this.value;
    if (value == '1885') {
      atlas_1885.visible = true;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;              
    } else if (value == '1897') {
      atlas_1885.visible = false;
      fips_1897.visible = true;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;       
    } else if (value == '1910') {
      atlas_1885.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = true;
      fips_49_51.visible = false;  
    } else if (value == '1915') {            
      atlas_1885.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = true;
      fips_1910.visible = false;
      fips_49_51.visible = false;  
    } else if (value == '1949') {            
      atlas_1885.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = true;  
    }
  });

  });