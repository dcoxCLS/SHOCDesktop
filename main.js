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
   const siteTableURL = "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Archaeology_Artifacts_v4/FeatureServer/0/";
   const bldgTableURL = "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/HHM_Objects_Catalog_v2/FeatureServer/0/";
   $.fn.modal.Constructor.prototype._enforceFocus = function() {}; // modal does not interfere with search text box input

  // Creates a new table to hold our map attributes  
  const siteTable = new Tabulator("#sites-table", {    
      // placeholder:"No Data Available",         
      //height: "88%", 
      virtualDomBuffer: 1600,
      responsiveLayout:"collapse",   
      layout:"fitDataFill",         
      selectable: 1,
      clipboard:true, //enable clipboard functionality,
      groupBy: "attributes.master_unit",                        
      columns:[
      {title:"Artifact", field:"attributes.artifact", width: 500},
      {title:"Material", field:"attributes.material", width: 300},
      {title:"Master Unit", field:"attributes.master_unit", width: 300, visible: false},
      {title:"Unit", field:"attributes.unit", width: 300, visible: false},
          //{title:"Publisher", field:"attributes.PUBLISHER", width: 300, visible: false},
          //{title:"Date", field:"attributes.DATE", width: 150}         
          ],    
          initialSort:[
        {column:"attributes.unit", dir:"asc"}, //sort by this first        
        ],        
      // Detect when someone clicks on a row in the table
      rowClick:function(e, row){ 
        view.popup.close();   
        // When the table row is clicked hide the table 
        //$('#drawerModal').modal('hide');        
        // when a row in the table is clicked call the getRowData function
        getRowData(row, "sites");   
      },
      groupHeader:function(value, count, data, group){        
      //  if (value < 241) {
        return "Site: " + value + "<span style='color:#FF0000; margin-left:10px;'>(" + count + " artifacts)</span>"; 
       // }          
     },    
   }); 

  // Creates a new table to hold our map attributes  
  const bldgTable = new Tabulator("#buildings-table", {             
      //height: "88%", 
      virtualDomBuffer: 1600,
      responsiveLayout:"collapse",   
      layout:"fitDataFill",         
      selectable: 1,
      clipboard:true, //enable clipboard functionality,
      groupBy: "attributes.alt_place_id",                        
      columns:[
      {title:"Name", field:"attributes.item_name", width: 500},
      {title:"Description", field:"attributes.brief_description", width: 300, visible:false},
      {title:"ID", field:"attributes.alt_place_id", width: 300, visible: false},
      {title:"Catalog Number", field:"attributes.catalog_number", width: 300, visible: true},
      {title:"Year", field:"attributes.year_", width: 300, visible: false},
          //{title:"Date", field:"attributes.DATE", width: 150}         
          ],    
          initialSort:[
        {column:"attributes.alt_place_id", dir:"asc"}, //sort by this first        
        ],        
      // Detect when someone clicks on a row in the table
      rowClick:function(e, row){ 
        view.popup.close();   
        // When the table row is clicked hide the table 
        //$('#drawerModal').modal('hide');        
        // when a row in the table is clicked call the getRowData function
        getRowData(row, "buildings");   
      },
      groupHeader:function(value, count, data, group){        
      //  if (value < 241) {
        return "Building: " + value + "<span style='color:#FF0000; margin-left:10px;'>(" + count + " objects)</span>"; 
       // }          
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

  // setup a new viewer to display the artifact images
  const viewer = new Viewer(document.getElementById('galley'), {
    navbar: false,
    inline: false,
    toolbar: {
      zoomIn: 1,
      zoomOut: 1,
      oneToOne: 1,
      reset: 1,
      prev: 1,
      play: {
        show: 1,
        size: 'large',
      },
      next: 1,
      rotateLeft: 1,
      rotateRight: 1,
      flipHorizontal: 1,
      flipVertical: 1,
    },
    viewed() {
        //viewer.zoomTo(1);
      },
    });  

    // setup a new viewer to display the site images
    const siteViewer = new Viewer(document.getElementById('sitegalley'), {
      navbar: false,
      inline: false,
      toolbar: {
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: 1,
        play: {
          show: 1,
          size: 'large',
        },
        next: 1,
        rotateLeft: 1,
        rotateRight: 1,
        flipHorizontal: 1,
        flipVertical: 1,
      },
      viewed() {
        //viewer.zoomTo(1);
      },
    }); 

    // setup a new viewer to display the site images
    const objViewer = new Viewer(document.getElementById('objgalley'), {
      navbar: false,
      inline: false,
      toolbar: {
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: 1,
        play: {
          show: 1,
          size: 'large',
        },
        next: 1,
        rotateLeft: 1,
        rotateRight: 1,
        flipHorizontal: 1,
        flipVertical: 1,
      },
      viewed() {
        //viewer.zoomTo(1);
      },
    });  

    projection.load();

  // when a row in the table is seleted or queried, get its attributes.
  // populate a new popup with this information 
  function getRowData(row, table) {   
    document.getElementById("galley").innerHTML = "";     
    document.getElementById("objgalley").innerHTML = ""; 
    $('#siteModal').modal('hide');
    $('#buildingModal').modal('hide');      
    $('.nav-tabs a[href="#artdetails"]').tab('show');             
    //view.popup.close();
    if (table == "sites") {
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
      const model = row._row.data.attributes.f3d_model;
      const currentLoc = row._row.data.attributes.current__location;     
      console.log(model);

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

           $('#artName').html("<b>Artifact: " + artifactName + "</b>");
           $('#artModal').modal('show');
           $('#objModal').modal('hide'); 
           $('#artNum').html("<b>Artifact Number: </b>" + artifactNum);
           $('#artdesc').html("<b>Description: </b>" + notes);
           $('#artloc').html("<b>Location: </b>" + location);
           $('#artunit').html("<b>Unit: </b>" + unit);
           $('#artcontext').html("<b>Context: </b>" + context);
           console.log('we are here');

          // check if the record has a 3D model
          if (model == "In progress" || model == "No") {            
            document.getElementById("modelframe").src = "";
          } else {
            document.getElementById("modelframe").src= model;
          }

          // check if the clicked record has an existing image
          if (photo !== '' || photo !== null) {
            const artPhotos = photo.split(",");          
            document.getElementById("artPic").src="https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/artifacts/" + photoFolder + "/" + artPhotos[0];
            const galley = document.getElementById('galley');
            
            artPhotos.forEach((photo, index) => {
              console.log(photo);
              const urlTrim = photo.replace(/ /g, "");
              const item = document.createElement("img");
              item.className = "data-original";
              item.classList.add("data-original");
              item.src = "https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/artifacts/" + photoFolder + "/" + urlTrim;
              item.addEventListener("click", () => photoClickHandler(photo, index));
              document.getElementById("galley").appendChild(item);
            });

            function photoClickHandler(photo, index) {
              document.getElementById('galley').src="https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/artifacts/" + photoFolder + "/" + photo.replace(/ /g, "");            
              viewer.update();
            };         
            
            // open a popup at the drawer location of the selected map
            view.popup.open({                  
              // Set the popup's title to the coordinates of the clicked location
              title: "<h6><b> title",  
              content: "test",
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
        }); 
    } else if (table == "buildings") {
      const bldgId = row._row.data.attributes.alt_place_id;  
      const itemName = row._row.data.attributes.item_name;
      const itemDate = row._row.data.attributes.date_;
      const catNum = row._row.data.attributes.catalog_number;
      const desc = row._row.data.attributes.brief_description;
      const scanned =  row._row.data.attributes.scanned;
      const photos =  row._row.data.attributes.app_photos;     
      const model = row._row.data.attributes.f3d_model;  
      const objYear = row._row.data.attributes.year_;
      console.log(objYear);
      if (objYear != "NO MAP") {
        $("#location").val(objYear).trigger('change');
      } else {
        $("#location").val('Modern').trigger('change');
      }
/*
      if (bldgId == '121|Modern') {
        $("#location").val('Modern').trigger('change');

      } else if (bldgId == '100|1915') {
        $("#location").val('1915').trigger('change');
      }*/

      const query = sitesLayer.createQuery();
          // Query the sites layer for the ID
          query.where = "uniqueid =" + "'" + bldgId + "'";
          query.returnGeometry = true;                 
          query.outFields = "*";
          buildingsLayer.queryFeatures(query)
          .then(function(response){
               // returns a feature set with features containing an OBJECTID
               const objectID = response.features[0].attributes.objectid;       
               const locId = response.features[0].attributes.uniqueid;   
               console.log(response.features);          

              view.whenLayerView(buildingsLayer).then(function(layerView) {
                const queryExtent = new Query({
                  objectIds: [objectID]
                });    

                const extent = response.features[0].geometry.extent;        

                view.goTo({ center: extent.expand(6) }, { duration: 800 });

                buildingsLayer.queryExtent(queryExtent).then(function(result) {               
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

           $('#objName').html("<b>" + itemName + "</b>");
           $('#objModal').modal('show');
           $('#artModal').modal('hide'); 
           $('#objdesc').html("<b>Description: </b>" + desc);
           $('#objdate').html("<b>Date: </b>" + itemDate);
           $('#catnum').html("<b>Catalog Number: </b>" + catNum);          

          // check if the clicked record has an existing image
          if (photos !== '' && photos !== null) {
            $('#objPic').show();
            const objPhotos = photos.split(",");          
            document.getElementById("objPic").src="https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/objects/" + catNum + "/" + objPhotos[0];
            const objgalley = document.getElementById('objgalley');
            
            objPhotos.forEach((photo, index) => {
              console.log(photo);
              const urlTrim = photo.replace(/ /g, "");
              const item = document.createElement("img");
              item.className = "data-original";
              item.classList.add("data-original");
              item.src = "https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/objects/" + catNum + "/" + urlTrim;
              item.addEventListener("click", () => objPhotoClickHandler(photo, index));
              document.getElementById("objgalley").appendChild(item);
            });

            function objPhotoClickHandler(photo, index) {
              document.getElementById('objgalley').src="https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/objects/" + catNum + "/" + photo.replace(/ /g, "");            
              objViewer.update();
            };                    

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
                $('#objPic').hide();
                view.popup.open({
                  // Set the popup's title to the coordinates of the clicked location
                  title: "<h6><b> title",    
                  content: "content",
                  location: response.features[0].geometry.centroid, // Set the location of the popup to the clicked location 
                  actions: []      
                });                 
              }     
            });
        }  
  }

  function highLightSites (results, type) {
    if (type == "artifact") {
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
     const idsInQuotes = uniqueIds.map(id => `'${id}'`);
     console.log(idsInQuotes);
     const siteQuery = idsInQuotes.join(" OR master_unit = ");
     console.log(siteQuery);      
     const query = sitesLayer.createQuery();
      // Query the cabinets layer for the LOC_ID
      query.where = "master_unit = " + siteQuery;
      query.returnGeometry = true;    
      query.outFields = ["objectid", "master_unit"];
      sitesLayer.queryFeatures(query)
      .then(function(response){
        console.log(response);
        const objIds = [];
           // returns a feature set with features containing an OBJECTID
           const objectID = response.features[0].attributes.objectid;
           const feature = response.features;
           feature.forEach(function(feature) {
            const ids = feature.attributes.objectid;
            objIds.push(ids);
          });
           console.log(objIds);           

           view.whenLayerView(sitesLayer).then(function(layerView) {
            const queryExtent = new Query({
              objectIds: [objIds]
            });

            sitesLayer.queryExtent(queryExtent).then(function(result) {                
              let extent = response.features[0].geometry.extent;
              response.features.forEach(function(feature) {
                extent = extent.union(feature.geometry.extent);
              });

              view.goTo({ center: extent.expand(1.3) }, { duration: 400 }); 

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
            });
    } else if (type == 'object') {
      const objectIds = [];
      results.forEach(function(result) {
          // the result of the REST API Query
          const buildings = result.attributes.alt_place_id;    
          const names = result.attributes.item_name; 
          objectIds.push(buildings);
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
     const idsInQuotes = uniqueIds.map(id => `'${id}'`);
     console.log(idsInQuotes);
     const siteQuery = idsInQuotes.join(" OR uniqueid = ");
     console.log(siteQuery);      
     const query = buildingsLayer.createQuery();
        // Query the cabinets layer for the LOC_ID
        query.where = "uniqueid =" + siteQuery;
        query.returnGeometry = true;    
        query.outFields = ["objectid", "uniqueid"];
        buildingsLayer.queryFeatures(query)
        .then(function(response){
          console.log(response);
          const objIds = [];
             // returns a feature set with features containing an OBJECTID
             const objectID = response.features[0].attributes.objectid;
             const feature = response.features;
             feature.forEach(function(feature) {
              const ids = feature.attributes.objectid;
              objIds.push(ids);
            });
             console.log(objIds);           

             view.whenLayerView(buildingsLayer).then(function(layerView) {
              const queryExtent = new Query({
                objectIds: [objIds]
              });

              buildingsLayer.queryExtent(queryExtent).then(function(result) {                
                let extent = response.features[0].geometry.extent;
                response.features.forEach(function(feature) {
                  extent = extent.union(feature.geometry.extent);
                });

                view.goTo({ center: extent.expand(1.3) }, { duration: 400 }); 

              });

                // if any, remove the previous highlights
                if (highlight) {
                  highlight.remove();
                }
                // highlight the feature with the returned objectId
                highlight = layerView.highlight(objIds);
              })

             setFeatureLayerFilter("year = 'Modern'" );
                // open a popup at the drawer location of the selected map
                view.popup.open({
                  // Set the popup's title to the coordinates of the clicked location                          
                  title: "<h6><b>test", 
                  content: "Results shown in the sidebar. Click any record for more information.",
                  location: response.features[0].geometry.centroid,// Set the location of the popup to the clicked location                      
                });            
              });
      }
    }
   // close button of the sidebar 
  // when someone clicks the advanced search submit button        
  $(".closebtn").click(function(){
    closeNav();
  });

   // Code for the search bar functions
   $( "#submit" ).click(function() {
    view.popup.close();
    siteTable.clearData();
    bldgTable.clearData();     
    // get the value of the search box
    const searchVal = $( "#search" ).val();
    // get the value of the search type dropdown
    var typeVal = $( "#searchtype" ).val();
    if (typeVal == 'Artifacts') {
      $.ajax({
        dataType: 'json',
        url: siteTableURL + 'query?where=Upper(site)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27+OR+Upper(location)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27+OR+Upper(artifact)+LIKE+%27%25' + searchVal.toUpperCase() +'%25%27+OR+Upper(material)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27+OR+Upper(function)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27+OR+Upper(notes)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27+OR+Upper(master_unit)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27+OR+Upper(uniqueid)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27&objectIds=&time=&resultType=none&outFields=*&returnHiddenFields=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson',
        type: "GET",    
        success: function(data) {
          console.log(data);
          if (data.features.length == 0) {          
            alert('The search returned no results. Please try different terms.');
          } else {      
            highLightSites(data.features, "artifact");   
            siteTable.clearData();
            bldgTable.clearData();  
            siteTable.setData(data.features); 
            $("#sites-table").show();
            $("#buildings-table").hide();
            const numResults = data.features.length;             
            if (searchVal.length > 25) {
              const shortSearchVal = (searchVal.substring(0, 25) + "...");              
              $('#results').html(numResults + " artifacts found for " + '"' + shortSearchVal + '"'); 
            } else {
              $('#results').html(numResults + " artifacts found for " + '"' + searchVal + '"'); 
            }
            openNav();        
          } 
        }
      });
    } else if (typeVal == "HHM Objects") {
      $.ajax({
        dataType: 'json',
        url: bldgTableURL + 'query?where=Upper(item_name)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27+OR+Upper(brief_description)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27+OR+Upper(working_notes)+LIKE+%27%25' + searchVal.toUpperCase() +'%25%27+OR+year_+LIKE+%27%25' + searchVal + '%25%27+OR+Upper(current_location)+LIKE+%27%25' + searchVal.toUpperCase() + '%25%27+OR+date_+LIKE+%27%25' + searchVal + '%25%27&objectIds=&time=&resultType=none&outFields=*&returnHiddenFields=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson',
        type: "GET",    
        success: function(data) {
          $("#siteTitle").html("Search Results:");
          if (data.features.length == 0) {          
            alert('The search returned no results. Please try different terms.');
          } else {      
            highLightSites(data.features, "object");
            siteTable.clearData();
            bldgTable.clearData();     
            bldgTable.setData(data.features);  
            $("#sites-table").hide();
            $("#buildings-table").show();
            const numResults = data.features.length; 
            if (searchVal.length > 25) {
              const shortSearchVal = (searchVal.substring(0, 25) + "...");
              $('#results').html(numResults + " objects found for " + '"' + shortSearchVal + '"'); 
            } else {
              $('#results').html(numResults + " objects found for " + '"' + searchVal + '"'); 
            }
            openNav();        
          } 
        }
      });
    }
  });

   // if users hits enter perform the search   
   $( "#search" ).keyup(function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      document.getElementById("submit").click();
    }        
  }); 
   
  // Create a style for the sitesLayer
  const sitesRenderer = {
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

  // Create a style for the buildingsLayer
  const buildingsRenderer = {
    type: "simple",  // autocasts as new SimpleRenderer()
    symbol: {
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: [ 255, 0, 0, 0],
      outline: {  // autocasts as new SimpleLineSymbol()
        width: 2,
        color: [157, 0, 255],
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

  const aerial_1951 = new TileLayer({
   url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Aerial_1951/MapServer",
   visible: false
 });
  
  // Add the excavation sites layer to the map   
  const sitesLayer = new FeatureLayer({
    url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/OHC_Excavation_Units_NEW/FeatureServer/1",
    outFields: ["*"], // Return all fields so it can be queried client-side
    renderer: sitesRenderer,
    popupEnabled: true 
  });

  // Add the Sanborn buildings layer to the map   
  const buildingsLayer = new FeatureLayer({
    url: "https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/Hamtramck_Buildings_NEW/FeatureServer/0",
    outFields: ["*"], // Return all fields so it can be queried client-side
    renderer: buildingsRenderer,
    popupEnabled: true 
  });

  const map = new Map({
    basemap: "satellite",
    layers: [atlas_1885, atlas_1893, fips_1897, fips_1915, fips_1910, fips_49_51, aerial_1951, sitesLayer, buildingsLayer]
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-83.052756,42.387895],
    zoom: 20
  });

  // bring the sites layer to the front
  map.reorder(sitesLayer, 99999);

  // set the default opacity of the sanborn layers  
  atlas_1885.opacity = 100;  
  atlas_1893.opacity = 100;
  fips_1897.opacity = 100;
  fips_1910.opacity = 100;
  fips_1915.opacity = 100;
  fips_49_51.opacity = 100; 
  aerial_1951.opacity = 100;
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

  // setup the filter for the sanborn layers

  function setFeatureLayerFilter(expression) {
    buildingsLayer.definitionExpression = expression;  
  }

  // Display the 49-51 Sanborn on map load
  setFeatureLayerFilter("year = '1949_1951' OR year = 'Modern'" );

  sitesLayer.popupTemplate = {
    title:'{display_name} ({desctemp})',
    content: "<b>Description: </b> Description of the this excavation unit goes here.<br><b>Location: </b>{location} ({locattion_abbrv})<br><b>Site: </b> {site} ({site_abbrv})"
    ,              
   // actions: [tableViewerAction] // adds the custom popup action
 };
 buildingsLayer.popupTemplate = {
  title:'{display_name} ({desctemp})',
  content: "<b>Description: </b> Description of the this excavation unit goes here.<br><b>Location: </b>{location} ({locattion_abbrv})<br><b>Site: </b> {site} ({site_abbrv})"
  ,              
   // actions: [tableViewerAction] // adds the custom popup action
 };

 view.when(function () {
  // Watch for when features are selected
  view.popup.watch("selectedFeature", function (graphic) {
    if (graphic) {
      if (highlight) {
        highlight.remove();
      } 
      if (graphic.layer.title == "Hamtramck Buildings NEW - Hamtramck Bldgs Merge Nov4 2022") {
        console.log(graphic);
        const bldgFunction = graphic.attributes.function;
        const occupant = graphic.attributes.occupant;
        const notes = graphic.attributes.notes;
        const address = graphic.attributes.address;
        const basement = graphic.attributes.basement;
        const numStories = graphic.attributes.num_stories;
        const material = graphic.attributes.bldg_mat1;
        const placeName = graphic.attributes.place_nam;
        const bldgId = graphic.attributes.uniqueid;
        const year = graphic.attributes.year;
        const type = graphic.attributes.bldg_type;            

        $('#buildingModal').modal('show');
        $('#objModal').modal('hide');
        $('#artModal').modal('hide');  
        $('#buildingName').html("<b>" + address + "</b>");
        $('#buildingtype').html("<b> Building Type: </b>" + type);
        $('#buildingadd').html("<b> Address: </b>" + address);
        $('#buildingplace').html("<b> Place Name: </b>" + placeName);
        $('#buildingmat').html("<b> Building Material: </b>" + material);
        $('#buildingyear').html("<b> Year: </b>" + year);
        $('#buildingstories').html("<b> Stories: </b>" + numStories);
        $('#buildingfunction').html("<b>Function: </b>" + bldgFunction);
        $('#buildingocc').html("<b>Occupant: </b>" + occupant);
        $('#buildingnotes').html("<b>Notes: </b>" + notes);
        $('buildingbasement').html("<b>Basement: </b>" + basement);

        if (bldgId == '121|Modern' || bldgId == '100|1915' || bldgId == '122|Modern' || bldgId == '123|Modern') {
          $('#viewHHMCat').show();
        } else {
          $('#viewHHMCat').hide();
        }

        $('#siteModal').modal('hide');
        $('#artModal').modal('hide');

        if (bldgFunction == '' || bldgFunction == null) {
          $('#buildingfunction').hide();
        } else {
          $('#buildingfunction').show();
        }

        if (notes == '' || notes == null) {
          $('#buildingnotes').hide();
        } else {
          $('#buildingnotes').show();
        }

        if (placeName == '' || placeName == null) {
          $('#buildingplace').hide();
        } else {
          $('#buildingplace').show();
        }

        if (occupant == '' || occupant == null) {
          $('#buildingocc').hide();
        } else {
          $('#buildingocc').show();
        }
        const qryResultIds = [];
        const artifactQuery = {
         spatialRelationship: "intersects", // Relationship operation to apply
         geometry: graphic.geometry,  // The sketch feature geometry
         outFields: ["master_unit"], // Attributes to return
         returnGeometry: true
        };

        sitesLayer.queryFeatures(artifactQuery)
        .then((results) => {
          if (results.features.length > 0) {
            $('#viewBldgCat').show();
            const features = results.features;
            features.forEach(function(result) {
              const unit = result.attributes.master_unit;
              qryResultIds.push(unit);              
            });             
            const artQryInQuotes = qryResultIds.map(id => `'${id}'`);
            const artQryString = artQryInQuotes.join(" OR master_unit = ");
            console.log(artQryString);
            $.ajax({
          dataType: 'json',
          url: siteTableURL + 'query?where=master_unit=' + artQryString + '&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&timeReferenceUnknownClient=false&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&f=pjson',
          type: "GET",    
          success: function(data) {
            const features = data.features;
            siteTable.clearData();
            //bldgTable.clearData();
            const numResults = data.features.length;                
              $('#results').html(numResults + " artifacts");
              $('#buildingartifacts').html("<b>Artifacts associated with this building:</b> " + numResults);
              $( "#viewBldgCat" ).click(function() {
                $('#results').html(numResults + " artifacts");
                siteTable.setData(features);
                $("#buildings-table").hide();
                $("#sites-table").show();                
                openNav();       
              });            
            }
          });
          } else {
             $( "#viewBldgCat" ).click(function() {
              $('#results').html("0 artifacts");
              siteTable.clearData();
             });
            //siteTable.clearData();
            //$('#viewBldgCat').hide();
            $('#buildingartifacts').html("<b>Artifacts associated with this building:</b> 0 ");
          }
          console.log("Feature count: " + results.features.length)
        }).catch((error) => {
          console.log(error);
        });

        $.ajax({
          dataType: 'json',
          url: bldgTableURL + 'query?where= alt_place_id+%3D+%27' + bldgId + '%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&timeReferenceUnknownClient=false&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&f=pjson',
          type: "GET",    
          success: function(data) {
            const features = data.features;
            //bldgTable.clearData();
            siteTable.clearData();
            bldgTable.setData(features);
            const numResults = data.features.length;
              //const bldgName = graphic.attributes.desctemp;
              $('#siteTitle').html(address);
              $('#results').html(numResults + " objects");
              $('#numartifacts').html("<b>Artifacts cataloged:</b> " + numResults);
              $( "#viewHHMCat" ).click(function() {
                $('#results').html(numResults + " objects");
                $("#sites-table").hide();
                $("#buildings-table").show();
                openNav();       
              });            
            }
          });       
      } else if (graphic.layer.title == "OHC Excavation Units NEW - OHC Excavation Footprints v3" ) {
       $('.nav-tabs a[href="#sitedetails"]').tab('show'); 
       const siteId = graphic.attributes.master_unit; 
       const displayName = graphic.attributes.display_name;
       const site = graphic.attributes.site;
       const location = graphic.attributes.location;
       const notes = graphic.attributes.notes; 
       const photos = graphic.attributes.photos;
       const drawings = graphic.attributes.drawings;
       const reports = graphic.attributes.reports;
       const docFolder = graphic.attributes.master_unit;

       document.getElementById("sitegalley").innerHTML = "";
       document.getElementById("doclist").innerHTML = "";
       $('#buildingModal').modal('hide');
       $('#artModal').modal('hide');
       $('#objModal').modal('hide'); 

       $('#siteModal').modal('show');
       $('#siteName').html("<b>" + displayName + "</b>");
       $('#sitedesc').html('<b>Description: </b> The description of the excavation site will go here');
       $('#siteloc').html('<b>Location: </b>' + location);
       $('#site').html('<b>Site: </b>' + site);
       $('#sitenote').html('<b>Notes: </b>' + notes);

       // check if there are many doucments
       if (reports !== '' && reports !== null) {
        const siteDocs = reports.split(",");
        siteDocs.forEach(function(report) {            
          const li = document.createElement("li");
          const link = document.createElement('a');
          link.setAttribute('href', "https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/sites/" + docFolder + "/" + report);
          link.setAttribute('target', "_blank");
          link.innerText = report;                      
          li.classList.add("list-group-item");      
          li.innerHTML = '<i class="fa fa-file" aria-hidden="true"></i> ';     
          li.appendChild(link);
          document.getElementById("doclist").appendChild(li);
        });
      }

       // check if the clicked record has any drawings
       if (drawings !== '' && drawings !== null) {
        $("#drawPic").show();
        const drawingPhotos = drawings.split(",");
        document.getElementById("drawPic").src="https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/sites/" + docFolder + "/" + drawingPhotos[0]; 
      } else if (drawings == "" || drawings == null) {
        $("#drawPic").hide();
      }

       // check if the clicked record has an existing image
       if (photos !== '' && photos !== null) {
        const sitePhotos = photos.split(","); 
        $("#sitePic").show();         
        document.getElementById("sitePic").src="https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/sites/" + docFolder + "/" + sitePhotos[0];          ;
        
        sitePhotos.forEach((photo, index) => {            
          const urlTrim = photo.replace(/ /g, "");
          const item = document.createElement("img");
          item.className = "data-original";
          item.classList.add("data-original");
          item.src = "https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/sites/" + docFolder + "/" + urlTrim;
          item.addEventListener("click", () => siteClickHandler(photo, index));
          document.getElementById("sitegalley").appendChild(item);
        });
      } else if (photos == '' || photos == null) {
        $("#sitePic").hide();
      }

      function siteClickHandler(photo, index) {
        document.getElementById('sitegalley').src="https://portal1-geo.sabu.mtu.edu/images/hamtramck/photos/sites/" + docFolder + "/" + photo.replace(/ /g, "");            
        siteViewer.update();
          //viewer.show();
      };          

        $.ajax({
          dataType: 'json',
          url: 'https://portal1-geo.sabu.mtu.edu/server/rest/services/Hosted/artifact_catalog/FeatureServer/0/query?where=master_unit+%3D+%27' + siteId + '%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&timeReferenceUnknownClient=false&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&f=pjson',
          type: "GET",    
          success: function(data) {
            const features = data.features;                  
            const numResults = data.features.length;
            const siteTitle = graphic.attributes.desctemp;
            $('#siteTitle').html("Site " + siteTitle);
            $('#results').html(numResults + " artifacts");
            $('#numartifacts').html("<b>Artifacts cataloged:</b> " + numResults);
            bldgTable.clearData();
            siteTable.clearData();
            $( "#viewCat" ).click(function() {
              $("#sites-table").show();
              $("#buildings-table").hide();
              siteTable.setData(features);
              openNav(); 
            });            
          }
        });      
      }
    }
  })
}); 

  // Listen for changes on the opacity slider
  slider.on(['thumb-change', 'thumb-drag'], function(event) {
    atlas_1885.opacity = event.value / 100;  
    atlas_1893.opacity = event.value / 100;
    fips_1897.opacity = event.value / 100;
    fips_1910.opacity = event.value / 100;
    fips_1915.opacity = event.value / 100;
    fips_49_51.opacity = event.value / 100;
    aerial_1951.opacity = event.value / 100;   
  });

  // Code for the location dropdown menu
  $("#location").change(function () {
    // Get the value of the selected item
    const value = this.value;
    if (value == '1885') {  
      setFeatureLayerFilter("year = 'Modern'" );    
      atlas_1885.visible = true;
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;
      aerial_1951.visible = false;  
    } else if (value == '1893') {
      setFeatureLayerFilter("year = 'Modern'" ); 
      atlas_1885.visible = false;
      atlas_1893.visible = true;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;  
      aerial_1951.visible = false;            
    } else if (value == '1897') {
      setFeatureLayerFilter("year = '1897' OR year = 'Modern'" );
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = true;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;
      aerial_1951.visible = false;       
    } else if (value == '1910') {
      setFeatureLayerFilter("year = '1910' OR year = 'Modern'" );
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = true;
      fips_49_51.visible = false; 
      aerial_1951.visible = false; 
    } else if (value == '1915') { 
      setFeatureLayerFilter("year = '1915' OR year = 'Modern'" );           
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = true;
      fips_1910.visible = false;
      fips_49_51.visible = false;  
      aerial_1951.visible = false;
    } else if (value == '1949_1951') { 
      setFeatureLayerFilter("year = '1949_1951' OR year = 'Modern'" );           
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = true;
      aerial_1951.visible = false;  
    } else if (value == '1951') {  
      setFeatureLayerFilter("year = 'Modern'" );           
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;
      aerial_1951.visible = true;  
    } else if (value == 'Modern') {
      setFeatureLayerFilter("year = 'Modern'" ); 
      atlas_1885.visible = false;
      atlas_1893.visible = false;
      fips_1897.visible = false;
      fips_1915.visible = false;
      fips_1910.visible = false;
      fips_49_51.visible = false;
      aerial_1951.visible = false;
    }
  });

  const values = ['1890-1899', '1900-1910', '1911-1920', '1940-1949', '1950-1959']
  const formatter = (index) => values[index]


  // With JQuery
  $("#timeslider").slider({
    tooltip_position: 'bottom',
  //value: [1897-1900, 1910-1920, 1915-1940, 1949-1951],
  ticks: [1897, 1910, 1915, 1949, 1951],
 // ticks_labels: ['1890-1899', '1900-1910', '1911-1920', '1950-1959', '$400'],
 lock_to_ticks: true,
 labelledby: "test",
  //formatter: formatter,
   //rangeHighlights: [{ "start": 1880, "end": 1900, "class": "category1" },
                    //  { "start": 1900, "end": 1910, "class": "category2" },
                  //    ]
                });

});