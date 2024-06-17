import { layerInteractions } from './layerInteractions.js';

// Make global layer interaction class
let layers = new layerInteractions(viewer);
window.layers = layers;

// Add layers
layers.addLayer('Night Lights', 'CS16_Web_App:BlackMarble_2016_01deg_gray_geo', 30);
layers.addLayer('Country Borders', 'CS16_Web_App:ne_50m_admin_0_countries', 100);
layers.addLayer('Province Borders', 'CS16_Web_App:ne_10m_admin_1_states_provinces_lines', 100);
layers.addLayer('Roads', 'CS16_Web_App:ne_10m_roads', 100);
layers.addLayer('Rails', 'CS16_Web_App:ne_10m_railroads', 100);
