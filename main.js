 require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/layers/TileLayer",
    "esri/widgets/Slider",
    "esri/rest/support/Query",
    "esri/geometry/Extent",
    "esri/geometry/projection"
  ], function(esriConfig, Map, MapView, FeatureLayer, TileLayer, Slider, Query, Extent, projection) {  

   let highlight = null; 
   const tableURL = "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/artifact_catalog/FeatureServer/0/";

  // Creates a new table to hold our map attributes  
  const table = new Tabulator("#sites-table", {             
      //height: "88%", 
      virtualDomBuffer: 1600,
      responsiveLayout:"collapse",   
      layout:"fitDataFill",         
      selectable: 1,
      clipboard:true, //enable clipboard functionality,
      groupBy: "attributes.unit",                        
      columns:[
          {title:"Artifact", field:"attributes.artifact", width: 500},
          {title:"Material", field:"attributes.material", width: 300},
          {title:"Unit", field:"attributes.unit", width: 300, visible: false},
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
        getRowData(row);   
      },
      groupHeader:function(value, count, data, group){        
        if (value < 241) {
          return "Site: " + value + "<span style='color:#8c1d40; margin-left:10px;'>(" + count + " items)</span>"; 
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

  projection.load();

   // when a row in the table is seleted or queried, get its attributes.
  // populate a new popup with this information 
  function getRowData(row) {                       
    //view.popup.close();
    const siteId = row._row.data.attributes.master_unit;  
    const siteName = row._row.data.attributes.site;
    const location = row._row.data.attributes.location;
    const context = row._row.data.attributes.context;
    const unit = row._row.data.attributes.unit;
    const siteAbbrv =  row._row.data.attributes.site_abbrv;
    const artifactNum =  row._row.data.attributes.artifact_num;
    const artifactName =  row._row.data.attributes.artifact;
    const artifactMat = row._row.data.attributes.material;
    const artifactFun = row._row.data.attributes.function;
    const mark = row._row.data.attributes.makers_mark;
    const markDetails = row._row.data.attributes.makers_mark_details;
    const notes = row._row.data.attributes.notes;
    const scan = row._row.data.attributes.scan;
    const photoFolder = row._row.data.attributes.photo_id;
    const photo = row._row.data.attributes.photograph;
    const modal = row._row.data.attributes.f3d_model;
    const currentLoc = row._row.data.attributes.current__location;    

    const query = sitesLayer.createQuery();
    // Query the sites layer for the ID
    query.where = "master_unit =" + "'" + siteId + "'";
    query.returnGeometry = true;                 
    query.outFields = "*";
    sitesLayer.queryFeatures(query)
      .then(function(response){
         // returns a feature set with features containing an OBJECTID
         const objectID = response.features[0].attributes.objectid;       
         const locId = response.features[0].attributes.master_unit;   
         console.log(response.features);          
        
         view.whenLayerView(sitesLayer).then(function(layerView) {
            const queryExtent = new Query({
              objectIds: [objectID]
         });    

        const extent = response.features[0].geometry.extent;        

        view.goTo({ center: extent.expand(6) }, { duration: 800 });

        sitesLayer.queryExtent(queryExtent).then(function(result) {               
        });          

        // reduce popup size
        $(function() {            
            $("body:not(.esriIsPhoneSize) #viewDiv .esri-popup.esri-popup--is-docked .esri-popup__main-container").css('padding-bottom', '0px');                
        });
        
        // if any, remove the previous highlights
        if (highlight) {
          highlight.remove();
        }
        // highlight the feature with the returned objectId
        highlight = layerView.highlight([objectID]);
        }) 
        console.log('we are here');
        // check if the clicked record has an existing image
        if (photo !== '' && photo !== null) {
          /*// change the image URL and title to display in the viewer
          document.getElementById('image').src=thumbUrl;
          document.getElementById('image').alt=itemTitle;
          viewer.update();      */          
          
          // open a popup at the drawer location of the selected map
          view.popup.open({                  
            // Set the popup's title to the coordinates of the clicked location
            title: "<h6><b> title",  
            content: "test"/*"<img src='" + thumbUrl + "' class='thumbdisplay'/><br><br><b>Title: </b>" + itemTitle +
            "<br><br><b>Date: </b>" + items[2] + "<br><br><b>Author: </b>" + items[1] + "<br><br><b>Publisher: </b>" + 
            items[4] + "<br><br><b>Scale: </b>" + items[0] + "<br><br><b>Call Number: </b>" + items[5] +
            "<br><br><b>Location: </b>" + locName + locId + "<br><a href=" + "'" + itemLink + 
            "' target='_blank' rel='noopener noreferrer' class='catlink'>View item in ASU Library catalog</a>" +              
            "<a href=" + "'" + indexUrl + "' target='_blank' rel='noopener noreferrer' class='indexlink'>View item in spatial index</a>" +
            "<a href=" + "'" + supUrl + "' target='_blank' rel='noopener noreferrer' class='suplink'>Learn more about this item</a>" +
            "<a href='https://lib.asu.edu/geo/services' target='_blank' rel='noopener noreferrer' class='maroon'>Request access</a>"*/,
            // "<br><br><h6></b><a href='#' id='prev' class='previous round'>&#8249; Previous</a><a href='#' id='next' class='next round'>Next &#8250;</a>",
            location: response.features[0].geometry.centroid, // Set the location of the popup to the clicked location 
            actions: []      
          });                   
        } else {
          view.popup.open({
            // Set the popup's title to the coordinates of the clicked location
            title: "<h6><b>" + truncTitle,   
            content: "<b>Title: </b>" + itemTitle +
            "<br><br><b>Date: </b>" + items[2] + "<br><br><b>Author: </b>" + items[1] + "<br><br><b>Publisher: </b>" + 
            items[4] + "<br><br><b>Scale: </b>" + items[0] + "<br><br><b>Call Number: </b>" + items[5] +
            "<br><br><b>Location: </b>" + locName + locId + "<br><a href=" + "'" + itemLink + 
            "' target='_blank' rel='noopener noreferrer' class='catlink'>View item in ASU Library catalog</a>" +              
            "<a href=" + "'" + indexUrl + "' target='_blank' rel='noopener noreferrer' class='indexlink'>View item in spatial index</a>" +
            "<a href=" + "'" + supUrl + "' target='_blank' rel='noopener noreferrer' class='suplink'>Learn more about this item</a>" +
            "<a href='https://lib.asu.edu/geo/services' target='_blank' rel='noopener noreferrer' class='maroon'>Request access</a>",
            //"<br><br><h6></b><a href='#' id='prev' class='previous round'>&#8249; Previous</a><a href='#' id='next' class='next round'>Next &#8250;</a>",
            location: response.features[0].geometry.centroid, // Set the location of the popup to the clicked location 
            actions: []      
          });                 
        }
      /*  // if any popup links don't have valid URL values, remove them  
        if (itemLink == "NOT FOUND") {
          $(function() {             
            $('.catlink').css({"display":"none"});
          });
        } else {
            $('.catlink').css({"display":"block"});
        }

        if (indexUrl == null) {
          $(function() {             
            $('.indexlink').css({"display":"none"});
          });
        } else {
            $('.indexlink').css({"display":"block"});
        }

        if (supUrl == null) {
          $(function() {             
            $('.suplink').css({"display":"none"});
          });
        } else {
            $('.suplink').css({"display":"block"});
        }*/
   });    
  }

  function highLightSites (results) {
    const objectIds = [];
    results.forEach(function(result) {
      // the result of the REST API Query
      const sites = result.attributes.master_unit;    
      const titles = result.attributes.site; 
      objectIds.push(sites);
    });

    let occurrences = { };
    for (let i = 0, j = objectIds.length; i < j; i++) {
       occurrences[objectIds[i]] = (occurrences[objectIds[i]] || 0) + 1;
    }

    console.log(occurrences);   

    const uniqueIds = [...new Set(objectIds)];
    const recCount = results.length;
    const siteCount = uniqueIds.length;
    console.log(objectIds);
    console.log(uniqueIds);
    const siteQuery = uniqueIds.join(" OR master_unit = ");
    console.log(siteQuery);      
    const query = sitesLayer.createQuery();
    // Query the cabinets layer for the LOC_ID
    query.where = "master_unit = " + siteQuery;
    query.returnGeometry = true;               
    query.returnZ = true;
    query.outFields = ["objectid", "master_unit"];
    siteLayer.queryFeatures(query)
      .then(function(response){
          console.log(response);
          const objIds = [];
         // returns a feature set with features containing an OBJECTID
         const objectID = response.features[0].attributes.OBJECTID;
         const feature = response.features;
         feature.forEach(function(feature) {
          const ids = feature.attributes.OBJECTID;
          objIds.push(ids);
         });
         console.log(objIds);           
        
         view.whenLayerView(sitesLayer).then(function(layerView) {
            const queryExtent = new Query({
              objectIds: [objIds]
            });
            // zoom to the extent of drawer that is clicked on the table  
            var new_ext = new Extent({
              xmin: response.features[0].geometry.extent.xmin, 
              ymin: response.features[0].geometry.extent.ymin, 
              zmin: zmin,
              xmax: response.features[0].geometry.extent.xmax, 
              ymax: response.features[0].geometry.extent.ymax,
              zmax: zmax,                        
              spatialReference: { wkid: 4326 }
            });

            sitesLayer.queryExtent(queryExtent).then(function(result) {                
              view.goTo({
              center: new_ext.expand(14),
             // zoom: 13,
              tilt: 67.85,
              heading: 38.82
              }, {speedFactor: 0.5 });                        
            });
            
            // if any, remove the previous highlights
            if (highlight) {
              highlight.remove();
            }
            // highlight the feature with the returned objectId
            highlight = layerView.highlight(objIds);
            })
            // open a popup at the drawer location of the selected map
            view.popup.open({
              // Set the popup's title to the coordinates of the clicked location                          
              title: "<h6><b>test", 
              content: "Results shown in the sidebar. Click any record for more information.",
              location: response.features[0].geometry.centroid,// Set the location of the popup to the clicked location                      
            });              
            // reduce the popup size  
            $(function() {            
                $("body:not(.esriIsPhoneSize) #viewDiv .esri-popup.esri-popup--is-docked .esri-popup__main-container").css('padding-bottom', '0px');                
            });
       });
  }
   // close button of the sidebar 
  // when someone clicks the advanced search submit button        
  $(".closebtn").click(function(){
    closeNav();
  });

   // Code for the search bar functions
  $( "#searchBtn" ).click(function() {
    view.popup.close();
    table.clearData();
   // $(".esri-icon-table").show();
    // get the value of the search box
    const searchVal = $( "#search" ).val();

    $.ajax({
        dataType: 'json',
        url: tableURL + 'query?where=site+LIKE+%27%25' + searchVal + '%25%27+OR+location+LIKE+%27%25' + searchVal + '%25%27+OR+artifact+LIKE+%27%25' + searchVal +'%25%27+OR+material+LIKE+%27%25' + searchVal + '%25%27+OR+function+LIKE+%27%25' + searchVal + '%25%27+OR+notes+LIKE+%27%25' + searchVal + '%25%27+OR+master_unit+LIKE+%27%25' + searchVal + '%25%27+OR+uniqueid+LIKE+%27%25' + searchVal + '%25%27&objectIds=&time=&resultType=none&outFields=*&returnHiddenFields=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson',
        type: "GET",    
        success: function(data) {
          console.log(data);
         if (data.features.length == 0) {          
          alert('The search returned no results. Please try different terms.');
         } else {      
         // highLightSites(data.features);     
          table.setData(data.features);  
          openNav();        
         } 
        }
        });
  });

   // if users hits enter perform the search   
  $( "#search" ).keyup(function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      document.getElementById("searchBtn").click();
    }        
 }); 
   
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
          if (highlight) {
              highlight.remove();
            }    
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
    const value = this.value;
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