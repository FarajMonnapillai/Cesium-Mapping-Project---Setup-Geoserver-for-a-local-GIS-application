// Import simulator icon class
import simulatorIcon from '../simulatorIcon.js';

// Generates a random integer in [min, max] (edges inclusive)
function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Bounds for cities to be generated in (to not include islands)
const BOUNDS = [[-6, 50], [2, 58.5]];
// Speed of icons
const groundSpeed = 0.05;
const airSpeed = 0.5;
const seaSpeed = 0.05;

// Returns test data for cities (to avoid the JSON call when the server is not online)
function getCities() {
  return [[0.0, 0.0], [3.0, 4.0], [0.0, 0.0], [-1.0, -3.0], [100.0, 50.0]];
}

// Returns test data for airports (to avoid the JSON call when the server is not online)
function getAirports() {
  return [[0.0, 0.0], [5.0, 0.0], [5.0, 5.0], [-5.0, -5.0], [-5.0, 0.0]];
}

// Returns test data for seaports (to avoid the JSON call when the server is not online)
function getSeaports() {
  return [[1.0, 1.0], [2.0, 2.0], [3.0, 3.0], [4.0, 4.0], [5.0, 5.0]];
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

// For testing simplicity, the points are not converted into lat/lon coordinates
function generatePath(points, speed, h) {
  // Initialise path
  const path = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    // Add next given point to path
    let lastPoint = points[i];
    path.push([lastPoint[0], lastPoint[1], h]);

    // Get direction to next given point
    let direction = [points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]];

    // Adjust direction to speed and get number of iterations until we reach next point
    const magnitude = Math.sqrt(direction[0] ** 2 + direction[1] ** 2);
    direction = [(direction[0] / magnitude) * speed, (direction[1] / magnitude) * speed];
    const noIterations = Math.floor(magnitude / speed);

    // Take small steps until we reach next point
    for (let j = 0; j < noIterations; j += 1) {
      lastPoint = [lastPoint[0] + direction[0], lastPoint[1] + direction[1]];
      path.push([lastPoint[0], lastPoint[1], h]);
    }
  }

  // Add last point to list
  const l = points.length;
  path.push([points[l - 1][0], points[l - 1][1], h]);

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
    // Symbol and label data removed for mock purposes

    // Generate icons
    for (let i = 0; i < noItems; i += 1) {
      // Parameters
      let path;

      // The first icon is a ground symbol, then air, then sea, and this pattern continues
      if (i % 3 === 0) {
        // Choose a number of cities and generate a path between them
        const points = pickRandomPoints(this.cities, minPoints, maxPoints);
        path = generatePath(points, groundSpeed, 0);

        // Air symbols
      } else if (i % 3 === 1) {
        // Choose a number of airports and generate a path between them
        const points = pickRandomPoints(this.airports, minPoints, maxPoints);
        path = generatePath(points, airSpeed, randomIntBetween(minH, maxH));

        // Sea symbols
      } else {
        // Choose a number of seaports and generate a path between them
        const points = this.seaports[randomIntBetween(0, this.seaports.length - 1)];
        path = generatePath(points, seaSpeed, 0);
      }

      // Create icon with generated path
      const icon = new simulatorIcon(path);
      this.icons.push(icon);

      // The section where icons are added to billboards and labels
      // is removed for the purposes of testing
    }
  }

  // Resets billboards and icons
  reset() {
    // The resetting of billboards and labels is removed for the mock
    this.icons = [];
  }

  update() {
    for (let i = 0; i < this.icons.length; i += 1) {
      // Removed updating of billboards and labels for the mock
      const nextPoint = this.icons[i].nextPoint();
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
