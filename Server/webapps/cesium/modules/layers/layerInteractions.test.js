import { layerInteractions } from './layerInteractions';
import mockViewer from '../mockViewer/mockViewer.js';

const viewer = new mockViewer();
const layers = new layerInteractions(viewer);

test('Test layer count increments when layers are added', () => {
  expect(layers.layerCount).toBe(0);
  layers.addLayer('Night Lights', 'CS16_Web_App:BlackMarble_2016_01deg_gray_geo', 30);
  expect(layers.layerCount).toBe(1);
});

test('Test layer Dict is updated when layers are added', () => {
  expect(layers.layerDict[layers.layerCount - 1].name).toBe('Night Lights');
  expect(layers.layerDict[layers.layerCount - 1].opacity).toBe(0.3);
});

test('Test layer visibility is initialised correctly', () => {
  expect(layers.layerDict[layers.layerCount - 1].visible).toBe(false);
});

/*
test('Test toggle layer visibility', () => {
  layers.toggleLayerVisibility(0);
  expect(layers.layerDict[layers.layerCount - 1].visible).toBe(true);
  layers.toggleLayerVisibility(0);
  expect(layers.layerDict[layers.layerCount - 1].visible).toBe(false);
});
*/

test('Test layer visibility is initialised correctly', () => {
  layers.updateOpacity(0, 50);
  expect(layers.layerDict[layers.layerCount - 1].opacity).toBe(0.5);
  layers.updateOpacity(0, 25);
  expect(layers.layerDict[layers.layerCount - 1].opacity).toBe(0.25);
});
