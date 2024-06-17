import { shapeDrawing, rgb2hex } from './shapeDrawing.js';
import mockViewer from '../mockViewer/mockViewer.js';
import {
  Clock,
  Color,
  Cartesian3,
  HeightReference,
  ColorMaterialProperty,
}
  from '../../libs/Cesium-1.87.1/Source/Cesium.js';

const viewer = new mockViewer();
const draw = new shapeDrawing(viewer);

test('Check RGB to Hex function works for black and white', () => {
  expect(rgb2hex('rgb(0,0,0)')).toBe('#000000');
  expect(rgb2hex('rgb(255,255,255)')).toBe('#ffffff');
});

test('Check RGB to Hex function works for red, green and blue', () => {
  expect(rgb2hex('rgb(255,0,0)')).toBe('#ff0000');
  expect(rgb2hex('rgb(0,255,0)')).toBe('#00ff00');
  expect(rgb2hex('rgb(0,0,255)')).toBe('#0000ff');
});

describe('Check RGB to Hex function works for mixed colours', () => {
  test.each`
  rgb  | hex
  ${'rgb(204, 61, 212)'} | ${'#cc3dd4'}
  ${'rgb(97, 125, 14)'} | ${'#617d0e'}
  ${'rgb(15, 213, 217)'} | ${'#0fd5d9'}
  ${'rgb(56, 44, 43)'} | ${'#382c2b'}
  ${'rgb(212, 255, 230)'} | ${'#d4ffe6'}
`('$rgb is converted to $hex', ({ rgb, hex }) => {
    expect(rgb2hex(rgb)).toBe(hex);
  });
});

test('Test shape count increments when point is drawn', () => {
  expect(draw.shapeCount).toBe(0);
  draw.drawPoint([], rgb2hex('rgb(0,0,0)'));
  expect(draw.shapeCount).toBe(1);
});

/*
test('Test create point places a point in the correct position', () => {
  const position = new Cartesian3(0, 0, 0);
  const color = Color.fromCssColorString('#ffffff');
  const point = draw.createPoint(position, color);
  expect(point.position.getValue(viewer.clock.currentTime).toBe(position));
});
*/

test('Test shape dictionary updates when point is drawn', () => {
  draw.activeShapePoints.push(new Cartesian3(0, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 10));
  draw.terminateShape();
  expect(Object.keys(draw.shapesDict).length).toBe(1);
  expect(draw.shapesDict[0].opacity).toBe(draw.drawingOpacity);
  expect(draw.shapesDict[0].type).toBe(draw.drawingMode);
});

test('Test Terminate shape clears all active points', () => {
  draw.activeShapePoints.push(new Cartesian3(0, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 10));
  expect(draw.activeShapePoints.length).toBe(4);
  draw.terminateShape();
  expect(draw.activeShapePoints.length).toBe(0);
});

test('Test create group', () => {
  draw.createGroup();
  expect(Object.keys(draw.groupDict).length).toBe(1);
});

/*
test('Test add shape to group', () => {
  console.log(draw.shapeCount);
  draw.createGroup();
  console.log(draw.shapeCount);
  expect(draw.groupDict[draw.shapeCount - 1].length).toBe(0);
  draw.activeShapePoints.push(new Cartesian3(0, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 10));
  draw.drawingMode = 'Polygon';
  draw.terminateShape();
  console.log(draw.shapeCount);
  draw.addShapeToGroup(draw.shapeCount - 2, draw.shapeCount - 1);
  expect(draw.groupDict[draw.shapeCount - 2].length).toBe(1);
});
*/

test('Test Delete shape', () => {
  const s = Object.keys(draw.shapesDict).length;
  draw.drawingMode = 'Polygon';
  draw.activeShapePoints.push(new Cartesian3(0, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 10));
  draw.terminateShape();
  draw.activeShapePoints.push(new Cartesian3(0, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 10));
  draw.terminateShape();

  draw.deleteShape(draw.shapeCount - 1);
  expect(Object.keys(draw.shapesDict).length).toBe(s + 1);
  draw.deleteShape(draw.shapeCount - 2);
  expect(Object.keys(draw.shapesDict).length).toBe(s);
});

test('Test Cancel Shape', () => {
  draw.activeShapePoints.push(new Cartesian3(0, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 10));
  draw.cancelShape();
  expect(draw.activeShapePoints.length).toBe(0);
});

test('Test Cancel Point', () => {
  draw.activeShapePoints.push(new Cartesian3(0, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 0, 0));
  const p = new Cartesian3(10, 10, 0);
  draw.activeShapePoints.push(p);
  draw.activeShapePoints.push(new Cartesian3(10, 10, 10));
  draw.cancelPoint();
  expect(draw.activeShapePoints.length).toBe(3);
  expect(draw.activeShapePoints.pop()).toBe(p);
});

test('Test Toggle Shape Visibility', () => {
  draw.drawingMode = 'Polygon';
  draw.activeShapePoints.push(new Cartesian3(0, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 10));
  draw.terminateShape();
  draw.toggleShapeVisibility(draw.shapeCount - 1);
  expect(draw.shapesDict[draw.shapeCount - 1].shapeVisibility).toBe(false);
});

test('Test Redraw Shape', () => {
  draw.drawingMode = 'Polygon';
  draw.activeShapePoints.push(new Cartesian3(0, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 0, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 0));
  draw.activeShapePoints.push(new Cartesian3(10, 10, 10));
  draw.terminateShape();
  draw.redrawShape(draw.shapeCount - 1, '#252525', 75, 'foo');
  expect(draw.shapesDict[draw.shapeCount - 1].color).toBe('#252525');
  expect(draw.shapesDict[draw.shapeCount - 1].opacity).toBe(75);
});
