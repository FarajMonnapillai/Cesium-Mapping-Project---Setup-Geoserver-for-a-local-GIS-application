// Import simulator instance on canvas
import { simulator } from '../../loadCesium.js';
// Import jQuery
import $ from '../../libs/jquery/src/jquery.js';

// Simulator toggle
let simulating = false;

// Simulator defaults
const DEFAULT_POINTS = 1000;
const DEFAULT_MIN_H = 20000.0;
const DEFAULT_MAX_H = 100000.0;
const DEFAULT_MIN_PATH = 6;
const DEFAULT_MAX_PATH = 20;
const DEFAULT_RATE = 1;

// From https://masteringjs.io/tutorials/fundamentals/wait-1-second-then
function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Start the simulator
async function simulate(rate) {
  // Update board positions
  simulator.update();
  // Wait a time based on refresh rate
  await delay(1000 * rate);
  // Call simulator again if it is still running
  if (simulating) {
    simulate(rate);
  }
}

function onPageLoad() {
  // Remove map picker and bottom from page
  $('.cesium-toolbar-button').remove();
  $('.cesium-viewer-bottom').remove();

  // Geoserver layers
  $('#ne_50m_admin_0_countries_vis').css('background-color', '#095018');
  $('#ne_10m_admin_1_states_provinces_lines_vis').css('background-color', '#095018');
  $('#ne_10m_roads_vis').css('background-color', '#095018');

  // Set simulator defaults
  $('#no-icons').val(DEFAULT_POINTS);
  $('#min-h').val(DEFAULT_MIN_H);
  $('#max-h').val(DEFAULT_MAX_H);
  $('#min-pts').val(DEFAULT_MIN_PATH);
  $('#max-pts').val(DEFAULT_MAX_PATH);
  $('#refresh-rate').val(DEFAULT_RATE);

  // Clicking start simulator button toggles drop down visibility
  $('#sim-prompt').click(() => {
    $('#sim-params').toggle();
  });

  $('#start-sim').click(() => {
    // Get parameters
    const noPoints = parseInt($('#no-icons').val(), 10);
    const minH = parseFloat($('#min-h').val());
    const maxH = parseFloat($('#max-h').val());
    const minPts = parseInt($('#min-pts').val(), 10);
    const maxPts = parseInt($('#max-pts').val(), 10);
    const refreshRate = parseFloat($('#refresh-rate').val());

    // Show error message if parameters are not numbers
    if (Number.isNaN(noPoints + minH + maxH + minPts + maxPts + refreshRate)) {
      $('#sim-params').append('<br /> Error parsing parameters');
    } else {
      // Hide start button and show stop button
      $('#sim-params').hide();
      $('#sim-prompt').hide();
      $('#stop-sim').show();
      // Log parameters
      console.log(`Params: ${noPoints}, ${minH}, ${maxH}, ${minPts}, ${maxPts}, ${refreshRate}`);
      // Start simulator
      simulator.generate(noPoints, 5, 20, minH, maxH);
      simulating = true;
      simulate(refreshRate);
      console.log('Started simulator');
    }
  });

  // Stop simulator if button is clicked
  $('#stop-sim').click(() => {
    simulating = false;
    simulator.reset();
    // Hide stop button and show start button
    $('#sim-params').hide();
    $('#stop-sim').hide();
    $('#sim-prompt').show();
    console.log('Stopped simulator');
  });
}
// Set up jQuery on page load
$(document).ready(onPageLoad);
