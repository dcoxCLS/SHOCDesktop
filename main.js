 require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/layers/TileLayer",
    "esri/widgets/Slider"
  ], function(esriConfig, Map, MapView, FeatureLayer, TileLayer, Slider) {  


  // Creates a new table to hold our map attributes  
  const table = new Tabulator("#sites-table", {             
      //height: "88%", 
      virtualDomBuffer: 1600,
      responsiveLayout:"collapse",   
      layout:"fitDataFill",         
      selectable: 1,
      clipboard:true, //enable clipboard functionality                        
      columns:[
          {title:"Artifact", field:"attributes.artifact", width: 500},
          {title:"Material", field:"attributes.material", width: 300},
          //{title:"Publisher", field:"attributes.PUBLISHER", width: 300, visible: false},
          //{title:"Date", field:"attributes.DATE", width: 150}         
      ],    
      initialSort:[
        //{column:"attributes.MAP_ORDER", dir:"asc"}, //sort by this first        
      ],        
      // Detect when someone clicks on a row in the table
      rowClick:function(e, row){ 
        view.popup.close();   
        // When the table row is clicked hide the table 
        //$('#drawerModal').modal('hide');        
        // when a row in the table is clicked call the getRowData function
       // getRowData(row);   
      },
      groupHeader:function(value, count, data, group){        
        if (value < 241) {
          return "Drawer: " + value + "<span style='color:#8c1d40; margin-left:10px;'>(" + count + " items)</span>"; 
        }          
      },    
  });        
  
    function openNav() {
      //table.redraw(true);
    document.getElementById("mySidebar").style.width = "20%";
    document.getElementById("viewDiv").style.marginLeft = "20%";
    document.getElementById("viewDiv").style.width = "80%";
   // document.getElementsByClassName("container")[0].style.width = "80%";
    //document.getElementsByClassName("container")[0].style.left = "28%";
  }
  
  /* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
  function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("viewDiv").style.marginLeft = "0";
    document.getElementById("viewDiv").style.width = "100%";
    //document.getElementsByClassName("container")[0].style.width = "60%";
    //document.getElementsByClassName("container")[0].style.left = "3%";
  }
   
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
     url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Robinson_Atlas_1885_Detail/MapServer",
     visible: false
  });

  const atlas_1893 = new TileLayer({
     url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Sauer_Atlas_1893/MapServer",
     visible: false,
     maxScale: 3000
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
    url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/OHC_Excavation_Units/FeatureServer/0",
    outFields: ["*"], // Return all fields so it can be queried client-side
    renderer: renderer,
    popupEnabled: true 
  });

  const map = new Map({
    basemap: "satellite",
    layers: [atlas_1885, atlas_1893, fips_1897, fips_1915, fips_1910, fips_49_51, sitesLayer]
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-83.052756,42.387895],
    zoom: 20
  });

  // set the default opacity of the sanborn layers  
  atlas_1885.opacity = 100;  
  atlas_1893.opacity = 100;
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

  sitesLayer.popupTemplate = {
    title:'{display_name} ({desctemp})',
    content: "<b>Description: </b> Description of the this excavation unit goes here.<br><b>Location: </b>{location} ({locattion_abbrv})<br><b>Site: </b> {site} ({site_abbrv})"
    ,              
   // actions: [tableViewerAction] // adds the custom popup action
  };

  view.on("click", function(event){
    view.hitTest(event, { include: sitesLayer})
      .then(function(response){      
         // get the attibutes from the resulting graphic
         const graphic = response.results[0].graphic;
         console.log(graphic.attributes); 
         const siteId = graphic.attributes.master_unit; 
          $.ajax({
            dataType: 'json',
            url: 'https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/artifact_catalog/FeatureServer/0/query?where=master_unit+%3D+%27' + siteId + '%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&timeReferenceUnknownClient=false&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&f=pjson',
            type: "GET",    
            success: function(data) {
              const features = data.features;
              table.setData(features);
              const numResults = data.features.length;
              const siteTitle = graphic.attributes.desctemp;
              $('#siteTitle').html("Site " + siteTitle);
              $('#results').html(numResults + " artifacts");
              openNav();  
            }
          });          
      });
  });

  // Listen for changes on the opacity slider
  slider.on(['thumb-change', 'thumb-drag'], function(event) {
  atlas_1885.opacity = event.value / 100;  
  atlas_1893.opacity = event.value / 100;
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
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;  
      } else if (value == '1893') {
      atlas_1885.visible = false;
      atlas_1893.visible = true;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;              
    } else if (value == '1897') {
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = true;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;       
    } else if (value == '1910') {
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = true;
      fips_49_51.visible = false;  
    } else if (value == '1915') {            
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = true;
      fips_1910.visible = false;
      fips_49_51.visible = false;  
    } else if (value == '1949') {            
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = true;  
    }
  });

  });