// Import Cesium functions
import {
  Viewer,
  CesiumTerrainProvider,
  BillboardCollection,
  LabelCollection,
  Ion,
  WebMapServiceImageryProvider,
  Rectangle,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
} from './libs/Cesium-1.87.1/Source/Cesium.js';
// Import simulator class
import { Simulator } from './modules/simulator/simulator.js';
import { url } from './modules/layers/layerInteractions.js';

function makeViewer() {
  // Set up viewing window
  let viewer = new Viewer('cesiumContainer', {
    imageryProvider: new WebMapServiceImageryProvider({
      url,
      layers: 'CS16_Web_App:base-map-group',
    }),
    geocoder: false,
    baseLayerPicker: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    homeButton: false,
    bottomContainer: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    infoBox: false,
  });

  return viewer;
}

function makeSimulator(viewer) {
  // Create set of images for simulator
  const billboards = viewer.scene.primitives.add(new BillboardCollection());
  const labels = viewer.scene.primitives.add(new LabelCollection());
  // Create simulator class
  const simulator = new Simulator(billboards, labels);
  console.log('Initialised simulator');

  return simulator;
}

// Cesium token
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlY2I5N2FiZi1kZGIyLTQxZGItODc0Ny1hZTc4ZTA0ODVhNGYiLCJpZCI6NzQzNzksImlhdCI6MTYzNzcxMDY2N30.6ku-Y714XkfOfH_tOvyzIe_2sK8D0aMIDg6afj1mRwo';

// Create viewer and simulator
let viewer = makeViewer(true);
const simulator = makeSimulator(viewer);

// Make viewer a global variable (by adding to window)
window.viewer = viewer;

// Create canvas
let { canvas } = viewer;
canvas.setAttribute('tabindex', '0');

// Start off looking at Scotland.
viewer.camera.setView({
  destination: Rectangle.fromDegrees(
    -9.50,
    59.50,
    1.50,
    54.50,
  ),
});

if (!viewer.scene.pickPositionSupported) {
  window.alert('This browser does not support pickPosition.');
}
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
  ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
);

// Create event handler
const handler = new ScreenSpaceEventHandler(viewer.canvas);

// Set up terrain
let terrainProvider = new CesiumTerrainProvider({
  url: 'http://localhost:9000/tilesets/terrain',
});

viewer.scene.terrainProvider = terrainProvider;

// Exports to testing files and jQuery files
export {
  makeViewer, makeSimulator, simulator, handler, url,
};
