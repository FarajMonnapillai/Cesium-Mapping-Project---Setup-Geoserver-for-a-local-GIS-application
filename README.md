# Team CS16
### Main repository for Team Project 3
## Table of contents
* [General info](#general-info)
* [Technologies](#technologies)
* [Setup](#setup)
* [Team members](#team-members)

## General info
Our goal with this project is to produce an offline web app using a chosen map server and 3D web framework, to show an interactive globe. The customer has requested the following main features:
* Be able to load data from the map server to be shown in the 3D web app
* A simulator (1000 objects animating once per second)
  * Using [APP-6 Military Icon Symbology](https://en.wikipedia.org/wiki/NATO_Joint_Military_Symbology)
* Layers which can be toggled on and off
* The ability to draw lines and polygons on the globe
* The ability to show terrain data ([SRTM](https://www2.jpl.nasa.gov/srtm/) or otherwise) so the globe is not flat

## Technologies
The technologies used for this web app are:
* Local Server: [**Apache Tomcat 9.0.55**](https://tomcat.apache.org/download-90.cgi#9.0.55)
  * Map Server: [GeoServer 2.20.1 WAR](http://geoserver.org/release/2.20.1/)
  * Terrain Server: [Cesium-terrain-server](https://github.com/geo-data/cesium-terrain-server/)
* 3D Web Framework: [**CesiumJS 1.87.1**](https://github.com/CesiumGS/cesium/releases/1.87.1/)
* APP-6 Symbol Generator: [**Milsymbol 2.0.0**](https://github.com/spatialillusions/milsymbol/releases/tag/v2.0.0)
* JavaScript DOM manipulaton: [**jQuery 3.6.0** (Compressed slim build)](https://code.jquery.com/jquery-3.6.0.slim.min.js)
* CI/CD pipeline and testing are running on: [**Node.js 14.15.4**](https://nodejs.org)
  * Unit Testing: [Jest 27.4.7](https://jestjs.io/)
  * Code Quality Testing: [ESLint 8.6.0](https://eslint.org/)
  * Full list of node dependencies can be found in package.json

## Setup
The steps to run this program are as follows:
* Install [**JDK 8**](https://www.oracle.com/java/technologies/javase/javase8u211-later-archive-downloads.html)
* Ensure that your **JAVA_HOME** or **JRE_HOME** environment variable is set to the version 8 installation
* Install [**The Go Programming Language**](https://go.dev/dl/)
* Open a command prompt and run the command **'go get github.com/geo-data/cesium-terrain-server/cmd/cesium-terrain-server'**
* Run **start.bat** in the main repository folder
* Navigate to **localhost:8080** in a browser to see the 3D web app
#### GeoServer login
* Username: **admin**
* Password: **geoserver**
#### Creating terrain
* Terrain can be created through [this githib repo](https://github.com/tum-gis/cesium-terrain-builder-docker), it requires docker and the tif file of your choosing

## Adding Geoserver Layers
Steps to add a Geoserver layer are as follows:
* Download shapefile (.shp) from online source
* Place file in cs16-main\Server\webapps\geoserver\data\details
* Create shapefile store in geosever admin panel (Remeber Data Source Name and select 'CS16_Web_App' workspace)
* Using that store, create a Geoserver layer
* Go to cs16-main\Server\webapps\cesium\modules\layers\jQueryElements.js
* Add this line of code to initialize the UI for the new layer: 
  * layers.addLayer('{name}', 'CS16_Web_App:{Data Source Name}', {Starting Opacity});
  
## Team members
Philip Coffey (2462160C)   
Adam Fairlie (2461352F)   
Harry Goodwin (2557827G)    
Faraj Monnapillai (2465104M)   



