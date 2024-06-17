// Import Cesium functions
import {
  Cartesian2,
  Cartesian3,
  HorizontalOrigin,
  VerticalOrigin,
  NearFarScalar,
  Color,
  DistanceDisplayCondition,
}
  from '../../libs/Cesium-1.87.1/Source/Cesium.js';
// Import simulator icon class
import simulatorIcon from './simulatorIcon.js';
// Import milsymbol symbols
import { ms, app6b } from '../../libs/milsymbol/index.esm.js';

// Get APP-6 Icons
ms.addIcons(app6b);

// Generates a random integer in [min, max] (edges inclusive)
function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Milsymbol symbol size
const symbolSize = 20;
// Bounds for cities to be generated in (to not include islands)
const BOUNDS = [[-6, 50], [2, 58.5]];
// Speed of icons
const groundSpeed = 0.05;
const airSpeed = 0.5;
const seaSpeed = 0.05;

// Creates a list of city locations from the JSON data
function getCities() {
  const locations = [];

  // Get cities JSON data
  fetch('http://localhost:8080/cesium/data/cities.json')
    .then((cityResponse) => cityResponse.json())

    .then((cities) => {
      for (let i = 0; i < cities.length; i += 1) {
        // Add city if it is within bounds
        const obj = cities[i];
        const longitude = parseFloat(obj.lng);
        const latitude = parseFloat(obj.lat);
        if (longitude > BOUNDS[0][0] && longitude < BOUNDS[1][0]
            && latitude > BOUNDS[0][1] && latitude < BOUNDS[1][1]) {
          locations.push([longitude, latitude]);
        }
      }
      console.log(`Loaded ${locations.length} cities`);
    })
    // Log errors
    .catch((err) => {
      console.log(err);
    });

  return locations;
}

// Creates a list of airport locations from the JSON data
function getAirports() {
  const locations = [];
  // Get airport JSON data
  fetch('http://localhost:8080/cesium/data/airports.json')
    .then((airportResponse) => airportResponse.json())

    .then((airports) => {
      for (let i = 0; i < airports.length; i += 1) {
        // Add airport location to list
        const obj = airports[i];
        locations.push([obj.geoloc.lng, obj.geoloc.lat]);
      }
      console.log(`Loaded ${locations.length} airports`);
    })
    // Log errors
    .catch((err) => {
      console.log(err);
    });

  return locations;
}

// Creates a list of seaport paths (location pairs) from the JSON data
function getSeaports() {
  const locations = [];
  // Get seaport JSON data
  fetch('http://localhost:8080/cesium/data/seaports.json')
    .then((seaportResponse) => seaportResponse.json())
    .then((seaports) => {
      // Add the location of every port with location data
      for (const pair in seaports) {
        if (Object.prototype.hasOwnProperty.call(seaports, pair)) {
          locations.push(seaports[pair]);
        }
      }
      console.log(`Loaded ${locations.length} seaport pairs`);
    })
    // Log errors
    .catch((err) => {
      console.log(err);
    });
  return locations;
}

// Given a list of locations and a minimum and maximum number of points
// pickRandomPoints generates a random list of points from the locations
function pickRandomPoints(locations, min, max) {
  const noLocations = randomIntBetween(min, max);
  let path = [];
  for (let i = 0; i < noLocations; i += 1) {
    // Choose random location
    const loc = locations[randomIntBetween(0, locations.length - 1)];
    path.push(loc);
  }

  return path;
}

// Given a set of points, a speed and a height,
// generatePath creates a path for an icon, moving between the
// points in the list at the speed specified, at the height h
function generatePath(points, speed, h) {
  // Initialise path
  const path = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    // Add next given point to path
    let lastPoint = points[i];
    path.push(new Cartesian3.fromDegrees(lastPoint[0], lastPoint[1], h));

    // Get direction to next given point
    let direction = [points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]];

    // Adjust direction to speed and get number of iterations until we reach next point
    const magnitude = Math.sqrt(direction[0] ** 2 + direction[1] ** 2);
    direction = [(direction[0] / magnitude) * speed, (direction[1] / magnitude) * speed];
    const noIterations = Math.floor(magnitude / speed);

    // Take small steps until we reach next point
    for (let j = 0; j < noIterations; j += 1) {
      lastPoint = [lastPoint[0] + direction[0], lastPoint[1] + direction[1]];
      path.push(new Cartesian3.fromDegrees(lastPoint[0], lastPoint[1], h));
    }
  }

  // Add last point to list
  const l = points.length;
  path.push(new Cartesian3.fromDegrees(points[l - 1][0], points[l - 1][1], h));

  return path;
}

// Class representing a simulator of icons, which generates paths and updates positions
class Simulator {
  constructor(billboards, labels) {
    this.icons = [];
    this.billboards = billboards;
    this.labels = labels;
    // Get city, airport and seaport JSON information
    this.cities = getCities();
    this.airports = getAirports();
    this.seaports = getSeaports();
  }

  // Generates a set of icons given parameters
  generate(noItems, minPoints, maxPoints, minH, maxH) {
    // List of milsymbol symbols which can be used for ground units
    const groundSymbols = [new ms.Symbol('SUGPU-----', { size: symbolSize }),
      new ms.Symbol('SFGPU-----', { size: symbolSize }),
      new ms.Symbol('SHGPU-----', { size: symbolSize }),
    ];
    // List of milsymbol symbols which can be used for air units
    const airSymbols = [new ms.Symbol('SUAPMF----', { size: symbolSize }),
      new ms.Symbol('SFAPMF----', { size: symbolSize }),
      new ms.Symbol('SHAPMF----', { size: symbolSize }),
    ];
    // List of milsymbol symbols which can be used for sea units
    const seaSymbols = [new ms.Symbol('SUUPS-----', { size: symbolSize }),
      new ms.Symbol('SFUPS-----', { size: symbolSize }),
      new ms.Symbol('SHUPS-----', { size: symbolSize }),
    ];

    // Data for the icon labels
    const friendlyColour = new Color(0.5, 0.87, 1.0, 1.0);
    const unknownColour = new Color(1.0, 1.0, 0.5, 1.0);
    const hostileColour = new Color(1.0, 0.5, 0.5, 1.0);
    const labelData = [
      { colour: unknownColour, text: 'Unknown' },
      { colour: friendlyColour, text: 'Friendly' },
      { colour: hostileColour, text: 'Hostile' },
    ];

    // Generate icons
    for (let i = 0; i < noItems; i += 1) {
      // Parameters
      let symbol;
      let path;
      let labelText;
      let colour;
      let randInt;

      // The first icon is a ground symbol, then air, then sea, and this pattern continues
      if (i % 3 === 0) {
        // Choose symbol type (friendly, hostile, unknown)
        randInt = randomIntBetween(0, groundSymbols.length - 1);
        symbol = groundSymbols[randInt].asCanvas();
        // Choose a number of cities and generate a path between them
        const points = pickRandomPoints(this.cities, minPoints, maxPoints);
        path = generatePath(points, groundSpeed, 0);
        // Choose correct label colour and text
        colour = labelData[randInt].colour;
        labelText = `${labelData[randInt].text} Ground Unit`;

        // Air symbols
      } else if (i % 3 === 1) {
        // Choose symbol type (friendly, hostile, unknown)
        randInt = randomIntBetween(0, airSymbols.length - 1);
        symbol = airSymbols[randInt].asCanvas();
        // Choose a number of airports and generate a path between them
        const points = pickRandomPoints(this.airports, minPoints, maxPoints);
        path = generatePath(points, airSpeed, randomIntBetween(minH, maxH));
        // Choose correct label colour and text
        colour = labelData[randInt].colour;
        labelText = `${labelData[randInt].text} Air Unit`;

        // Sea symbols
      } else {
        // Choose symbol type (friendly, hostile, unknown)
        randInt = randomIntBetween(0, seaSymbols.length - 1);
        symbol = seaSymbols[randInt].asCanvas();
        // Choose a number of seaports and generate a path between them
        const points = this.seaports[randomIntBetween(0, this.seaports.length - 1)];
        path = generatePath(points, seaSpeed, 0);
        // Choose correct label colour and text
        colour = labelData[randInt].colour;
        labelText = `${labelData[randInt].text} Sea Unit`;
      }

      // Create icon with generated path
      const icon = new simulatorIcon(path);
      this.icons.push(icon);

      // Create image on map
      const billboard = {
        image: symbol,
        position: icon.nextPoint(),
        eyeOffset: new Cartesian3(0.0, 0.0, 0.0), // default
        horizontalOrigin: HorizontalOrigin.LEFT, // default
        verticalOrigin: VerticalOrigin.TOP,
        scaleByDistance: new NearFarScalar(1000, 1.5, 8.0e6, 0.2),
        disableDepthTestDistance: 4000000,
      };

      // Create text label
      const label = {
        text: labelText,
        fillColor: colour,
        distanceDisplayCondition: new DistanceDisplayCondition(0, 150000.0),
        backgroundColor: new Color(0.165, 0.165, 0.165, 0.3),
        showBackground: true,
        font: '10px sans-serif',
        position: icon.nextPoint(),
        eyeOffset: new Cartesian3(0.0, 0.0, 0.0),
        pixelOffset: new Cartesian2(0, 50),
        horizontalOrigin: HorizontalOrigin.CENTER,
        scaleByDistance: new NearFarScalar(1000, 1.5, 8.0e6, 0.2),
        disableDepthTestDistance: 4000000,
      };

      // Add to scene
      this.billboards.add(billboard);
      this.labels.add(label);
    }
  }

  // Resets billboards and icons
  reset() {
    this.billboards.removeAll();
    this.labels.removeAll();
    this.icons = [];
  }

  update() {
    // Update board and label positions
    for (let i = 0; i < this.billboards.length; i += 1) {
      const nextPoint = this.icons[i].nextPoint();
      const board = this.billboards.get(i);
      board.position = nextPoint;
      const label = this.labels.get(i);
      label.position = nextPoint;
    }
  }
}

export {
  BOUNDS,
  randomIntBetween,
  getCities,
  getAirports,
  getSeaports,
  pickRandomPoints,
  generatePath,
  Simulator,
};
