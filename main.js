 require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/layers/TileLayer",
    "esri/widgets/Slider"
  ], function(esriConfig, Map, MapView, FeatureLayer, TileLayer, Slider) {

  esriConfig.apiKey = "YOUR_API_KEY";

  // Create a style for the chartsLayer
  const renderer = {
    type: "simple",  // autocasts as new SimpleRenderer()
    symbol: {
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: [ 255, 128, 0, 0.5 ],
      outline: {  // autocasts as new SimpleLineSymbol()
        width: 2,
        color: "gray"
      }
    }
  }; 

  // add FIPS TileLayers to the map
  const atlas_1885 = new TileLayer({
     url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Robinson_Atlas_1885/MapServer",
     visible: true
  });

  const fips_1897 = new TileLayer({
     url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Sanborn_1897_5/MapServer",
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
     visible: false
  });
  
  // Add the excavation sites layer to the map   
  const sitesLayer = new FeatureLayer({
    url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/OHC_Excavation_Boundaries/FeatureServer/0",
    outFields: ["*"], // Return all fields so it can be queried client-side
    renderer: renderer
  });

  const map = new Map({
    basemap: "satellite",
    layers: [atals_1885, fips_1897, fips_1915, fips_1910, fips_49_51, sitesLayer]
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-83.0496,42.3928],
    zoom: 16
  });  

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

  });