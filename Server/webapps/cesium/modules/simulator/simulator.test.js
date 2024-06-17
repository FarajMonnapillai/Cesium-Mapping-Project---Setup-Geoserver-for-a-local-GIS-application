import * as s from './simulator.js';

jest.mock('./simulator');

// Tester locations
const landLocations = [[0.0, 0.0], [3.0, 4.0], [0.0, 0.0], [-1.0, -3.0], [100.0, 50.0]];
const airLocations = [[0.0, 0.0], [5.0, 0.0], [5.0, 5.0], [-5.0, -5.0], [-5.0, 0.0]];
const seaLocations = [[1.0, 1.0], [2.0, 2.0], [3.0, 3.0], [4.0, 4.0], [5.0, 5.0]];

describe('Random numbers are in correct range', () => {
  test.each`
  min  | max
  ${1} | ${9}
  ${0} | ${0}
  ${1} | ${1}
  ${-20} | ${-10}
  ${-5} | ${5}
`('Number is between $min and $max (inclusive)', ({ min, max }) => {
    const randomNum = s.randomIntBetween(min, max);
    expect(randomNum).toBeGreaterThan(min - 1);
    expect(randomNum).toBeLessThan(max + 1);
  });
});

describe('Path numbers are generated properly', () => {
  test.each`
  min  | max
  ${0} | ${0}
  ${1} | ${1}
  ${1} | ${3}
  ${5} | ${10}
  ${0} | ${100}
`('Length is between $min and $max (inclusive)', ({ min, max }) => {
    const path = s.pickRandomPoints(seaLocations, min, max);
    expect(path.length).toBeGreaterThan(min - 1);
    expect(path.length).toBeLessThan(max + 1);
  });
});

test('Negative length paths return an empty list', () => {
  const path = s.pickRandomPoints(airLocations, -10, -5);
  expect(path.length).toEqual(0);
});

const sim = new s.Simulator([], []);

test('Locations are loaded properly', () => {
  expect(sim.cities).toEqual(landLocations);
  expect(sim.airports).toEqual(airLocations);
  expect(sim.seaports).toEqual(seaLocations);
});

test('Sea path is generated properly', () => {
  const path1 = s.generatePath(seaLocations, 1, 0);
  expect(path1.length).toEqual(9);
  // Check height
  expect(path1[0][2]).toEqual(0);
  expect(path1[path1.length - 1][2]).toEqual(0);

  // Check original path points are included in final path
  expect(path1[0][0]).toEqual(seaLocations[0][0]);
  expect(path1[0][1]).toEqual(seaLocations[0][1]);
  expect(path1[2][0]).toEqual(seaLocations[1][0]);
  expect(path1[2][1]).toEqual(seaLocations[1][1]);

  // Check generated point is in between two fixed path points
  expect(path1[1][0]).toBeLessThan(seaLocations[1][0]);
  expect(path1[1][1]).toBeLessThan(seaLocations[1][1]);

  expect(path1[1][0]).toBeGreaterThan(seaLocations[0][0]);
  expect(path1[1][1]).toBeGreaterThan(seaLocations[0][1]);

  // Check last point is added
  expect(path1[path1.length - 1][0]).toEqual(seaLocations[seaLocations.length - 1][0]);
  expect(path1[path1.length - 1][1]).toEqual(seaLocations[seaLocations.length - 1][1]);
});

test('Sea ports arent skipped at high speeds', () => {
  const path2 = s.generatePath(seaLocations, 3, 0);
  expect(path2.length).toEqual(5);
});

test('Negative directions are correct', () => {
  const path3 = s.generatePath(landLocations, 1, 0);
  // Check original path points are included in final path (with 5 steps)
  expect(path3[6][0]).toEqual(landLocations[1][0]);
  expect(path3[6][1]).toEqual(landLocations[1][1]);
  expect(path3[12][0]).toEqual(landLocations[2][0]);
  expect(path3[12][1]).toEqual(landLocations[2][1]);

  // Check generated points are smaller than previous fixed city (negative direction)
  expect(path3[7][0]).toBeLessThan(landLocations[1][0]);
  expect(path3[7][1]).toBeLessThan(landLocations[1][1]);

  expect(path3[10][0]).toBeLessThan(landLocations[1][0]);
  expect(path3[10][1]).toBeLessThan(landLocations[1][1]);
  // Check generated points are larger than next fixed city (negative direction)
  expect(path3[7][0]).toBeGreaterThan(landLocations[2][0]);
  expect(path3[7][1]).toBeGreaterThan(landLocations[2][1]);

  expect(path3[10][0]).toBeGreaterThan(landLocations[2][0]);
  expect(path3[10][1]).toBeGreaterThan(landLocations[2][1]);
});

// Generate a simulator
const noPoints = 500;
const minP = 3;
const maxP = 7;
const minH = 500;
const maxH = 1000;
sim.generate(noPoints, minP, maxP, minH, maxH);

test('Check all icons correctly generate', () => {
  expect(sim.icons.length).toEqual(noPoints);
});

describe('Check plane heights are correct', () => {
  test.each`
  ic  | pt
  ${1} | ${0}
  ${1} | ${1}
  ${4} | ${1}
  ${4} | ${2}
  ${100} | ${2}
`('Icon $ic point $pt has correct height', ({ ic, pt }) => {
    // Get height
    const icon = sim.icons[ic].path;
    const point = icon[pt];
    const height = point[2];
    // Check height is in range
    expect(height).toBeGreaterThan(minH - 1);
    expect(height).toBeLessThan(maxH + 1);
  });
});

test('Check updating the simulator works', () => {
  sim.update();

  expect(sim.icons[0].i).toEqual(0);
  expect(sim.icons[sim.icons.length - 1].i).toEqual(0);

  sim.update();

  expect(sim.icons[0].i).toEqual(1);
  expect(sim.icons[sim.icons.length - 1].i).toEqual(1);
});

test('Check updating the simulator works in reverse', () => {
  sim.icons[0].i = 1;
  sim.icons[0].reversing = true;

  sim.icons[sim.icons.length - 1].i = 3;
  sim.icons[sim.icons.length - 1].reversing = true;

  console.log(sim.icons[0].i);

  sim.update();

  expect(sim.icons[0].i).toEqual(0);
  expect(sim.icons[sim.icons.length - 1].i).toEqual(2);
});

test('Check the paths reverse properly', () => {
  const icon1 = sim.icons[0];
  const icon2 = sim.icons[sim.icons.length - 1];

  icon1.i = icon1.path.length - 1;
  icon1.reversing = false;
  icon2.i = icon2.path.length - 1;
  icon2.reversing = false;

  expect(icon1.nextPoint()).toEqual(icon1.path[icon1.path.length - 2]);
  expect(icon2.nextPoint()).toEqual(icon2.path[icon2.path.length - 2]);

  expect(icon1.i).toEqual(icon1.path.length - 2);
  expect(icon1.i).toEqual(icon1.path.length - 2);

  expect(icon1.reversing).toEqual(true);
  expect(icon2.reversing).toEqual(true);
});

test('Check the paths un-reverse properly', () => {
  const icon1 = sim.icons[0];
  const icon2 = sim.icons[sim.icons.length - 1];

  icon1.i = 0;
  icon1.reversing = true;
  icon2.i = 0;
  icon2.reversing = true;

  expect(icon1.nextPoint()).toEqual(icon1.path[1]);
  expect(icon2.nextPoint()).toEqual(icon2.path[1]);

  expect(icon1.i).toEqual(1);
  expect(icon1.i).toEqual(1);

  expect(icon2.reversing).toEqual(false);
  expect(icon2.reversing).toEqual(false);
});

test('Check resetting the simulator works', () => {
  sim.reset();
  expect(sim.icons.length).toEqual(0);
});

// Generate path
