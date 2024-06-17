// Import Cesium functions
import {
  defined,
  CallbackProperty,
  PolygonHierarchy,
  ScreenSpaceEventType,
  Color,
} from '../../libs/Cesium-1.87.1/Source/Cesium.js';
// Import shape functions
import { shapeDrawing } from './shapeDrawing.js';
// Import event handler instance
import { handler } from '../../loadCesium.js';
// Import jQuery
import $ from '../../libs/jquery/src/jquery.js';

// Make global shape drawing class
let draw = new shapeDrawing(viewer);
window.draw = draw;

// Shape drawing system was partially inspired by https://sandcastle.cesium.com/?src=Drawing%20on%20Terrain.html
// When there is a left click on the earth while in drawing mode
handler.setInputAction((event) => {
  draw.deSelectShapes();
  // We use `viewer.scene.pickPosition` here instead of `viewer.camera.pickEllipsoid` so that
  // we get the correct point when mousing over terrain.

  // Use when map does not have terrain
  const earthPosition = viewer.camera.pickEllipsoid(event.position);

  // Use when map has terrain
  // const earthPosition = viewer.scene.pickPosition(event.position);

  // `earthPosition` will be undefined if our mouse is not over the globe.
  if (defined(earthPosition) && draw.currentlyDrawing === true) {
    if (draw.drawingMode === 'Point') {
      draw.drawPoint(earthPosition, draw.drawingColor);
    } else {
      // if a shape is not currently being drawn
      if (draw.activeShapePoints.length === 0) {
        draw.floatingPoint = draw.createPoint(earthPosition, draw.drawingColorCesium);
        draw.activeShapePoints.push(earthPosition);
        const dynamicPositions = new CallbackProperty((() => {
          if (draw.drawingMode === 'Polygon') {
            return new PolygonHierarchy(draw.activeShapePoints);
          }
          return draw.activeShapePoints;
        }), false);
        draw.activeShape = draw.drawShape(
          dynamicPositions,
          draw.drawingColorCesium,
          draw.drawingMode,
          draw.drawingOpacity,
        );
      }
      draw.activeShapePoints.push(earthPosition);
    }
  }
}, ScreenSpaceEventType.LEFT_CLICK);

// When the cursor is moved on the earth, the floating point will move with it
handler.setInputAction((event) => {
  if (defined(draw.floatingPoint)) {
    // Use when map does not have terrain
    const newPosition = viewer.camera.pickEllipsoid(event.endPosition);

    // Use when map has terrain
    // const newPosition = viewer.scene.pickPosition(event.endPosition);

    if (defined(newPosition)) {
      draw.floatingPoint.position.setValue(newPosition);
      draw.activeShapePoints.pop();
      draw.activeShapePoints.push(newPosition);
    }
  }
}, ScreenSpaceEventType.MOUSE_MOVE);

// Right Click will finish the shape that is currently being drawn
handler.setInputAction((event) => {
  draw.terminateShape();
}, ScreenSpaceEventType.RIGHT_CLICK);

// Set the select highlight color prompt to the current highlight color
$('#highlight-color').css('background-color', draw.highlightColor);
// Sets the point buton to a lighter color to indicate that it is initially selected
$('#point-button').css('background-color', '#2c2e79');
// Sets the polygon and line buton to darker color to indicate that they are initially not selected
$('#polygon-button').css('background-color', '#000230');
$('#line-button').css('background-color', '#000230');
// Initializes the Drawing opacity prompt with the current Drawing Opacity value
$('#shape-opacity').val(draw.drawingOpacity);
// Initializes the Drawing Color prompt with the current Drawing Color value
$('#shape-color-button').val(draw.drawingColor);

// Listen for a "backspace" Key press
function KeyCheck(event) {
  const KeyID = event.keyCode;
  // If the pressed Key == "backspace" terminate last point placed
  if (KeyID === 8 && draw.deleteShapeGate === true && draw.deleteShapeGate2 === true) {
    if (draw.activeShapePoints.length !== 0) {
      if (draw.activeShapePoints.length === 2) {
        draw.cancelShape();
      } else {
        draw.cancelPoint();
      }
    }
    if (draw.selectedShapes.length > 0) {
      draw.deleteSelectedShapes();
    }
    if (draw.selectedGroup != null) {
      draw.disbandGroup(draw.selectedGroup);
    }
  }
}
document.addEventListener('keydown', KeyCheck);

$(document).ready(() => {
  // Set Drawing defaults
  $('#shape-select').val(draw.drawingMode);
  $('#shape-color-button').val(draw.drawingColor);
  $('#shape-transparencey').val(draw.drawingOpacity);

  // Enters Drawing Mode Upon clicking
  $('#start-drawing').click(() => {
    $('#start-drawing').hide();
    $('#stop-drawing').show();
    $('#sim-params').hide();
    $('#drawing-setting-tab').show();
    draw.currentlyDrawing = true;
    console.log('Entered Drawing Mode');
  });

  // Exits Drawing Mode Upon clicking
  $('#stop-drawing').click(() => {
    $('#start-drawing').show();
    $('#stop-drawing').hide();
    $('#drawing-setting-tab').hide();
    draw.currentlyDrawing = false;
    console.log('Exited Drawing Mode');
    draw.cancelShape();
  });

  // Displays the tab containing all active shapes
  $('#show-shape-list').click(() => {
    $('#hide-shape-list').show();
    $('#show-shape-list').hide();
    $('#shape-tab').show();
    $('#highlight-color-div').show();
  });

  // Hides the shape tab
  $('#hide-shape-list').click(() => {
    $('#show-shape-list').show();
    $('#hide-shape-list').hide();
    $('#shape-tab').hide();
    $('#highlight-color-div').hide();
    draw.deSelectShapes();
  });

  // Deletes The Currently selected Shape
  $('#delete-selected-shape').click(() => {
    $('#edit-selected-shape-tab').hide();
    draw.deleteSelectedShapes();
  });

  // Prompt to Change the Highlight Color
  $('#highlight-color').click(() => {
    $('#change-highlight-color-tab').show();
  });

  // Set Drawing defaults
  $('#highlight-color').css('background-color', draw.highlightColor);
  $('#highlight-color-select').val(draw.highlightColor);

  // Changes the highlight color to the input value
  $('#accept-change-highlight-color').click(() => {
    draw.highlightColor = $('#highlight-color-select').val();
    draw.highlightColorCesium = Color.fromCssColorString(draw.highlightColor);
    $('#highlight-color').css('background-color', draw.highlightColor);
    if (draw.selectedShapes.length !== 0) {
      console.log(draw.selectedShapes);
      draw.selectShapeGate = true;
      let count = 0;
      while (count < draw.selectedShapes.length) {
        let temp = draw.selectedShapes[0];
        console.log(temp);
        draw.deSelectShape(temp);
        draw.selectShape(temp);
        count += 1;
      }
      draw.selectShapeGate = false;
    }
    $('#change-highlight-color-tab').hide();
    console.log(`Set Highlight Colour to ${draw.highlightColor}`);
  });

  // Closes the change Highlight tab without updating the value
  $('#cancel-change-highlight-color').click(() => {
    $('#highlight-color-select').val(draw.highlightColor);
    $('#change-highlight-color-tab').hide();
  });

  $('#set-shape').html(draw.drawingMode);
  $('#set-opacity').html(`${draw.drawingOpacity}%`);
  $('#set-color').css('background-color', draw.drawingColor);

  // Upon clicking lets the user set the Shape Type (line/polygon)
  $('#set-shape').click(() => {
    draw.cancelTabs();
    $('#select-shape-div').show();
  });

  // Button that sets the drawing mode to Point
  $('#point-button').click(() => {
    draw.selectedShapeButton = 'Point';
    $('#point-button').css('background-color', '#2c2e79');
    $('#line-button').css('background-color', '#000230');
    $('#polygon-button').css('background-color', '#000230');
  });

  // Button that sets the drawing mode to line
  $('#line-button').click(() => {
    draw.selectedShapeButton = 'Line';
    $('#point-button').css('background-color', '#000230');
    $('#line-button').css('background-color', '#2c2e79');
    $('#polygon-button').css('background-color', '#000230');
  });

  // Button that sets the drawing mode to polygon
  $('#polygon-button').click(() => {
    draw.selectedShapeButton = 'Polygon';
    $('#point-button').css('background-color', '#000230');
    $('#line-button').css('background-color', '#000230');
    $('#polygon-button').css('background-color', '#2c2e79');
  });

  // Closes the shape selection tab without updating the value
  // (If statments are used to restore the button lighting
  // to represent the current selected drawing mode)
  $('#cancel-change-shape').click(() => {
    draw.selectedShapeButton = draw.drawingMode;
    if (draw.drawingMode === 'Line') {
      $('#point-button').css('background-color', '#000230');
      $('#line-button').css('background-color', '#2c2e79');
      $('#polygon-button').css('background-color', '#000230');
    } else if (draw.drawingMode === 'Polygon') {
      $('#point-button').css('background-color', '#000230');
      $('#line-button').css('background-color', '#000230');
      $('#polygon-button').css('background-color', '#2c2e79');
    } else {
      $('#point-button').css('background-color', '#2c2e79');
      $('#line-button').css('background-color', '#000230');
      $('#polygon-button').css('background-color', '#000230');
    }
    $('#select-shape-div').hide();
  });

  // Closes the shape selection tab and updates the value
  $('#accept-change-shape').click(() => {
    draw.cancelShape();
    draw.drawingMode = draw.selectedShapeButton;
    $('#set-shape').html(draw.drawingMode);
    $('#select-shape-div').hide();
    console.log(`Drawing Mode Set to ${draw.drawingMode}`);
  });

  // Upon clicking lets the user set the Drawing opacity
  $('#set-opacity').click(() => {
    draw.cancelTabs();
    $('#select-opacity-div').show();
  });

  // Closes the Drawing Opacity selection tab and updates the value
  $('#accept-change-opacity').click(() => {
    let x = $('#shape-opacity').val();
    // Ensure opacity is between 0 and 100
    x = Math.min(Math.max(0, x), 100);
    draw.drawingOpacity = x;
    $('#set-opacity').html(`${draw.drawingOpacity}%`);
    $('#select-opacity-div').hide();
    console.log(`Drawing Opacity Set to ${draw.drawingOpacity}%`);
  });

  // Closes the Drawing Opacity tab without updating the value
  $('#cancel-change-opacity').click(() => {
    $('#shape-opacity').val(draw.drawingOpacity);
    $('#select-opacity-div').hide();
  });

  // Upon clicking lets the user set the Drawing Color
  $('#set-color').click(() => {
    draw.cancelTabs();
    $('#select-color-div').show();
  });

  // Closes the Drawing Color selection tab and updates the value
  $('#accept-change-color').click(() => {
    draw.drawingColor = $('#shape-color-button').val();
    draw.drawingColorCesium = Color.fromCssColorString(draw.drawingColor);
    $('#set-color').css('background-color', draw.drawingColor);
    $('#select-color-div').hide();
    console.log(`drawing Colour Set to ${draw.drawingColor}`);
  });

  // Closes the Drawing Color tab without updating the value
  $('#cancel-change-color').click(() => {
    $('#shape-color-button').val(draw.drawingColor);
    $('#select-color-div').hide();
  });

  // Opens a tab with the selected shapes parametesrs that can be changed by the user
  $('#edit-selected-shape-button').click(() => {
    draw.cancelTabs();
    draw.deleteShapeGate = false;
    $('#edit-selected-shape-tab').show();
    $('#shape-edit-color-button').val(draw.shapesDict[draw.selectedShapes[0]].color);
    $('#edit-shape-opacity').val(draw.shapesDict[draw.selectedShapes[0]].opacity);
    if (draw.selectedShapes.length === 1) {
      $('#shape-name').val($(`#${draw.selectedShapes[0]}`).text());
    } else if (draw.selectedShapes.length > 1) {
      $('#edit-shape-name-div').hide();
    }
  });

  // Closes the Edit Shape tab without changing the parameters
  $('#cancel-edit-shape').click(() => {
    draw.deleteShapeGate = true;
    $('#edit-selected-shape-tab').hide();
  });

  // Closes Edit Shape tab and updates the parameters of all selected shapes with the users inputs
  $('#accept-edit-shape').click(() => {
    let x = $('#edit-shape-opacity').val();
    // Ensure opacity is between 0 and 100
    x = Math.min(Math.max(0, x), 100);

    $('#edit-selected-shape-tab').hide();
    for (const id of draw.selectedShapes) {
      if (draw.selectedShapes.length === 1) {
        draw.redrawShape(id, $('#shape-edit-color-button').val(), x, $('#shape-name').val());
        console.log(`Shape ${id} Edited, (name=${$('#shape-name').val()} Colour=${$('#shape-edit-color-button').val()} Opacity=${x})`);
      } else {
        draw.redrawShape(id, $('#shape-edit-color-button').val(), x, $(`#${id}`).text());
        console.log(`Shape ${id} Edited, (name=${$('#shape-name').val()} Colour=${$('#shape-edit-color-button').val()} Opacity=${x})`);
      }
    }
    draw.deSelectShapes();
    draw.deleteShapeGate = true;
  });

  $('#cancel-group-rename').click(() => {
    $('#rename-group-div').hide();
  });

  $('#rename-group-button').click(() => {
    $('#rename-group-div').show();
    $('#group-name').val($(`#${draw.selectedGroup}`).text());
  });

  // Clicking start simulator button toggles drop down visibility
  $('#sim-prompt').click(() => {
    // If currently drawing, close drawing mode
    if (draw.currentlyDrawing) {
      $('#start-drawing').show();
      $('#stop-drawing').hide();
      $('#drawing-setting-tab').hide();
      draw.currentlyDrawing = false;
      console.log('Exited Drawing Mode');
      draw.cancelShape();
    }

    // Toggle Gate that will stop shapes from being deleted while typing
    draw.deleteShapeGate2 = !draw.deleteShapeGate2;
  });

  $('#start-sim').click(() => {
    // Open Gate that stops shapes being deleted while typing
    draw.deleteShapeGate2 = true;
  });
});
