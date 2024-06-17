// Cesium imports
import {
  Color,
  HeightReference,
  ColorMaterialProperty,
}
  from '../../libs/Cesium-1.87.1/Source/Cesium.js';

// Import jQuery
import $ from '../../libs/jquery/src/jquery.js';

// taken from https://stackoverflow.com/questions/1740700/how-to-get-hex-color-value-rather-than-rgb-value
const rgb2hex = (rgb) => `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map((n) => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`;

class shapeDrawing {
  constructor(viewer) {
    // Get instance of viewer
    this.viewer = viewer;

    // Drawing defaults
    // drawingColor stores the color that newly drawn shapes will be assigned (in css form)
    this.drawingColor = '#ffffff';
    // drawingColorCesium Stores the same value as drawingColor but in Cesium color form
    this.drawingColorCesium = Color.fromCssColorString(this.drawingColor);
    // drawingOpacity stores the opacity newly drawn shapes willl be assigned
    this.drawingOpacity = 100;
    // should be one of "Point", "Line" or "Polygon" to indicate the current mode to the system
    this.drawingMode = 'Point';
    // activeShapePoints is used to visualise the currently placed points as a shape is being drawn
    this.activeShapePoints = [];
    // activeShapePointsEntities reflects the activeShapePoints array but in entitiy form
    // which alows us to erase them after drawing
    this.activeShapePointsEntities = [];
    // active shape is used visualise the shape as its being drawn
    this.activeShape = undefined;
    // floating point places a point at the curser to indicate that
    // the system is currently in drawing mode
    this.floatingPoint = undefined;
    // Used to give id to each shape drawn
    this.shapeCount = 0;
    // used to pair id to [shape.entitiy, points, drawingMode, color, opacity]
    this.shapesDict = {};
    // stores the colour that a shape will be changed to once selected (in css form)
    this.highlightColor = '#fbff00';
    // highlightColorCesium Stores the same value as highlightColor but in Cesium color form
    this.highlightColorCesium = Color.fromCssColorString(this.highlightColor);
    // list of the id's of all selected shapes
    this.selectedShapes = [];
    // used for redrawing shapes after the highlight color is updated
    this.selectShapeGate = false;
    // map group id to a list of shape id's
    this.groupDict = {};
    // Stores the id of the selected group
    this.selectedGroup = undefined;
    // Used to stop shapes from being deleted when entering name
    this.deleteShapeGate = true;
    this.deleteShapeGate2 = true;
    // The button for the type of shape selected
    let selectedShapeButton = 'Point';
  }

  // Creates a point on the map at position 'worldPosition'
  createPoint(worldPosition, color) {
    const point = this.viewer.entities.add({
      position: worldPosition,
      point: {
        color,
        pixelSize: 7,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    });
    return point;
  }

  // Creates new button in the shape-button-div
  createButton(location, id, name) {
    let $input;
    if (name == null) {
      $input = $(`<div id="${id}div" class="shape-div"> <button id="${id}" class="shape-button horizontal-centre" type="button" onclick="draw.selectShape(${id})">${this.drawingMode} (ID:${id})</button> <button id="${id}vis" class="visibility-button" type="button" onclick="draw.toggleShapeVisibility(${id})"></button> </div>`);
    } else {
      $input = $(`<div id="${id}div" class="shape-div"> <button id="${id}" class="shape-button horizontal-centre" type="button" onclick="draw.selectShape(${id})">${name}</button> <button id="${id}vis" class="visibility-button" type="button" onclick="draw.toggleShapeVisibility(${id})"></button> </div>`);
    }
    $input.appendTo($(location));
  }

  // Draws either a line or a polygon depending on the current 'shapeForm'
  // Uses the variables shapeColour and shapeOpacity to represent the desired shape
  drawShape(positionData, shapeColour, shapeForm, shapeOpacity) {
    let shape;
    if (shapeForm === 'Line') {
      shape = this.viewer.entities.add({
        polyline: {
          positions: positionData,
          clampToGround: true,
          width: 3,
          material: new ColorMaterialProperty(
            shapeColour.withAlpha(shapeOpacity / 100.0),
          ),
        },
      });
    } else if (shapeForm === 'Polygon') {
      shape = this.viewer.entities.add({
        polygon: {
          hierarchy: positionData,
          material: new ColorMaterialProperty(
            shapeColour.withAlpha(shapeOpacity / 100.0),
          ),
        },
      });
    }
    // Returns entity of the drawn shape for potential deletion/editing later
    return shape;
  }

  // Return the shape to it's actual colour
  removeShapeHighlight(id) {
    this.viewer.entities.remove(this.shapesDict[id].shapeEntity);
    if (this.shapesDict[id].type === 'Point') {
      this.shapesDict[id].shapeEntity = this.createPoint(
        this.shapesDict[id].points,
        Color.fromCssColorString(this.shapesDict[id].color),
      );
    } else {
      this.shapesDict[id].shapeEntity = this.drawShape(
        this.shapesDict[id].points,
        Color.fromCssColorString(this.shapesDict[id].color),
        this.shapesDict[id].type,
        this.shapesDict[id].opacity,
      );
    }
    if (!this.shapesDict[id].shapeVisibility || !this.shapesDict[id].groupVisibility) {
      this.viewer.entities.remove(this.shapesDict[id].shapeEntity);
    }
  }

  // Returns the Selected Shape to a Unselected State
  deSelectShape(id, deleting) {
    if (!deleting) {
      $(`#${id}div`).css('background-color', '#000230');
      $(`#${id}`).css('background-color', '#000230');
      console.log(`Deselected Shape ${id}`);
      this.removeShapeHighlight(id);
    }
    // remove id from selectedShapes
    const index = this.selectedShapes.indexOf(id);
    if (index > -1) {
      this.selectedShapes.splice(index, 1);
    }
    if (this.selectedShapes.length === 0) {
      $('#edit-selected-shape-button').css('background-color', '#000230');
      $('#delete-selected-shape').css('background-color', '#000230');
      $('#group-selected-shapes-button').css('background-color', '#000230');
      $('#add-to-group-button').css('background-color', '#000230');
    }
  }

  // Clears the selected shapes list
  deSelectShapes() {
    while (this.selectedShapes.length > 0) {
      this.deSelectShape(this.selectedShapes.pop(), false);
    }
  }

  // adds a given shape to a given group
  addShapeToGroup(groupID, shapeID) {
    const temp = $(`#${shapeID}`).text();
    $(`#${shapeID}div`).remove();
    this.createButton(`#drop-down-${groupID}-div`, shapeID, temp);
    if (this.shapesDict[shapeID].shapeVisibility === false) {
      $(`#${shapeID}vis`).css('background-color', '#000230');
    }
    this.groupDict[groupID].push(shapeID);
    // If shape is already in a group
    if (this.shapesDict[shapeID].groupID != null) {
    // Remove shape from it's group's list of id's
      const index = this.groupDict[this.shapesDict[shapeID].groupID].indexOf(shapeID);
      if (index > -1) {
        this.groupDict[this.shapesDict[shapeID].groupID].splice(index, 1);
      }
    }
    this.shapesDict[shapeID].groupVisibility = true;
    this.shapesDict[shapeID].groupID = groupID;
    const color = rgb2hex($(`#${groupID}vis`).css('background-color'));
    if (color === '#b500fc') {
      if (this.shapesDict[shapeID].groupVisibility === false
        && this.shapesDict[id].shapeVisibility === true) {
        this.viewer.entities.add(this.shapesDict[id].shapeEntity);
      }
      this.shapesDict[shapeID].groupVisibility = true;
    } else {
      if (this.shapesDict[shapeID].groupVisibility === true
        && this.shapesDict[id].shapeVisibility === true) {
        this.viewer.entities.remove(this.shapesDict[id].shapeEntity);
      }
      this.shapesDict[shapeID].groupVisibility = false;
    }
    console.log(`added Shape ${shapeID} to Group ${groupID}`);
  }

  // adds all selected shapes to the given group
  addSelectedShapesToGroup(groupID) {
    if (groupID != null) {
      for (const shapeID of this.selectedShapes) {
        if (!(this.groupDict[groupID].includes(shapeID))) {
          this.addShapeToGroup(groupID, shapeID);
        }
      }
      this.deSelectShapes();
    }
  }

  // Deletes the shape with the passed id
  deleteShape(id) {
    this.deSelectShape(id, true);
    this.viewer.entities.remove(this.shapesDict[id].shapeEntity);
    $(`#${id}div`).remove();
    console.log(`Deleted Shape ${id}`);
    if (this.shapesDict[id].groupID != null) {
      const { groupID } = this.shapesDict[id];
      const index = this.groupDict[groupID].indexOf(id);
      if (index > -1) {
        this.groupDict[groupID].splice(index, 1);
      }
    }
    delete this.shapesDict[id];
  }

  // Display the given shape with the current Highlight colour
  highlightShape(id) {
    this.viewer.entities.remove(this.shapesDict[id].shapeEntity);
    if (this.shapesDict[id].type === 'Point') {
      this.shapesDict[id].shapeEntity = this.createPoint(
        this.shapesDict[id].points,
        Color.fromCssColorString(this.highlightColor),
      );
    } else {
      this.shapesDict[id].shapeEntity = this.drawShape(
        this.shapesDict[id].points,
        Color.fromCssColorString(this.highlightColor),
        this.shapesDict[id].type,
        this.shapesDict[id].opacity,
      );
    }
    if (!this.shapesDict[id].shapeVisibility || !this.shapesDict[id].groupVisibility) {
      this.viewer.entities.remove(this.shapesDict[id].shapeEntity);
    }
  }

  // Deletes the active shape without drawing it
  cancelShape() {
    this.viewer.entities.remove(this.activeShape);
    this.viewer.entities.remove(this.floatingPoint);
    this.floatingPoint = undefined;
    this.activeShape = undefined;
    this.activeShapePoints = [];
  }

  // Remove last point placed
  cancelPoint() {
    this.activeShapePoints.pop();
    const p = this.activeShapePointsEntities.pop();
    this.viewer.entities.remove(p);
  }

  // Redraw the shape so it's not dynamic and remove the dynamic shape.
  terminateShape() {
    if ((this.drawingMode === 'Polygon' && this.activeShapePoints.length > 3) || (this.drawingMode === 'Line' && this.activeShapePoints.length > 2)) {
      this.activeShapePoints.pop();
      this.shapesDict[this.shapeCount] = {
        shapeEntity: this.drawShape(
          this.activeShapePoints,
          this.drawingColorCesium,
          this.drawingMode,
          this.drawingOpacity,
        ),
        points: this.activeShapePoints,
        type: this.drawingMode,
        color: this.drawingColor,
        opacity: this.drawingOpacity,
        shapeVisibility: true,
        groupVisibility: true,
        groupID: null,
      };

      console.log(`Drew ${this.drawingMode} with ID ${this.shapeCount}`);
      this.createButton('#shape-button-div', this.shapeCount, null);
      if (this.selectedGroup != null) {
        this.deSelectShape(this.selectedGroup, this.shapeCount);
      }
      this.shapeCount += 1;
      this.viewer.entities.remove(this.floatingPoint);
      this.viewer.entities.remove(this.activeShape);
      this.floatingPoint = undefined;
      this.activeShape = undefined;
      this.activeShapePoints = [];
    } else {
      this.cancelShape();
    }
  }

  // links the id from the button to the corisponding entity,
  // also updates button colours to visualise the selected button
  // if ctrl is not held this function will deselect the currently selected shapes
  selectShape(id) {
    if (!(this.selectedShapes.includes(id))) {
      if (!window.event.ctrlKey && !this.selectShapeGate) {
        this.deSelectShapes();
      }
      $('#edit-selected-shape-tab').hide();
      this.selectedShapes.push(id);
      this.highlightShape(id);
      $('#delete-selected-shape').css('background-color', '#313268');
      $('#edit-selected-shape-button').css('background-color', '#313268');
      $('#group-selected-shapes-button').css('background-color', '#313268');
      if (this.selectedGroup != null) {
        $('#add-to-group-button').css('background-color', '#313268');
      }
      $(`#${id}div`).css('background-color', '#313268');
      $(`#${id}`).css('background-color', '#313268');
      console.log(`Selected Shape ${id}`);
    } else if (window.event.ctrlKey) {
      this.deSelectShape(id, false);
    } else {
      this.deSelectShapes();
      this.selectShape(id);
    }
  }

  // Toggles the visablility of the given shape
  toggleShapeVisibility(id) {
    if (this.shapesDict[id].shapeVisibility) {
      this.shapesDict[id].shapeVisibility = false;
      this.viewer.entities.remove(this.shapesDict[id].shapeEntity);
      $(`#${id}vis`).css('background-color', '#000230');
      console.log(`Made shape ${id} invisible`);
    } else {
      this.shapesDict[id].shapeVisibility = true;
      console.log(`Made shape ${id} visible`);
      $(`#${id}vis`).css('background-color', '#0065fc');
      if (this.shapesDict[id].groupVisibility === true) {
        this.viewer.entities.add(this.shapesDict[id].shapeEntity);
      }
    }
  }

  // deletes all of the selected shapes
  deleteSelectedShapes() {
    while (this.selectedShapes.length > 0) {
      this.deleteShape(this.selectedShapes.pop());
    }
    $('#delete-selected-shape').css('background-color', '#000230');
    $('#edit-selected-shape-button').css('background-color', '#000230');
  }

  // Redraw Shape With new parameters
  redrawShape(id, color_, opacity_, name) {
    this.viewer.entities.remove(this.shapesDict[id].shapeEntity);
    this.shapesDict[id].color = color_;
    $(`#${id}`).html(name);
    // if statment is needed as points dont have opacity values like lines and polygons
    if (this.shapesDict[id].type === 'Point') {
      this.shapesDict[id].shapeEntity = this.createPoint(
        this.shapesDict[id].points,
        Color.fromCssColorString(this.shapesDict[id].color),
      );
    } else {
      this.shapesDict[id].opacity = opacity_;
      this.shapesDict[id].shapeEntity = this.drawShape(
        this.shapesDict[id].points,
        Color.fromCssColorString(this.shapesDict[id].color),
        this.shapesDict[id].type,
        this.shapesDict[id].opacity,
      );
    }
  }

  // Draws a point on the map with the given parameters,
  // then creates the corresponding button in the shape tab
  drawPoint(positionData, color) {
    this.shapesDict[this.shapeCount] = {
      shapeEntity: this.createPoint(
        positionData,
        Color.fromCssColorString(color),
      ),
      points: positionData,
      type: this.drawingMode,
      color,
      opacity: this.drawingOpacity,
      shapeVisibility: true,
      groupVisibility: true,
      groupID: null,
    };
    console.log(`Drew Point with ID ${this.shapeCount}`);
    this.createButton('#shape-button-div', this.shapeCount, null);
    if (this.selectedGroup != null) {
      this.deSelectShape(this.selectedGroup, this.shapeCount);
    }
    this.shapeCount += 1;
  }

  // creates new group button and key in group dict with an assigned id
  createGroup() {
    const groupID = this.shapeCount;
    this.shapeCount += 1;
    this.groupDict[groupID] = [];
    const $input = $(`<div id="${groupID}div" class="group-div"> <button id="${groupID}drop" class="group-drop-down-button" type="button" onclick="draw.constructor.displayGroup(${groupID})">+</button> <button id="${groupID}" class="group-button horizontal-centre" type="button" onclick="draw.selectGroup(${groupID})">Group (ID:${groupID})</button> <button id="${groupID}vis" class="visibility-button" type="button" onclick="draw.toggleGroupVisibility(${groupID})"></button> </div> <div id="drop-down-${groupID}-div" class="drop-down-div"></div>`);
    $input.appendTo($('#shape-button-div'));
    $(`#${groupID}vis`).css('background-color', '#b500fc');
    return groupID;
  }

  // Places all selected shapes into a group
  groupSelectedShapes() {
    if (this.selectedShapes.length > 0) {
      const groupID = this.createGroup();
      $(`#${groupID}div`).css('background-color', '#2c0153');
      $(`#${groupID}`).css('background-color', '#2c0153');
      $(`#${groupID}drop`).css('background-color', '#2c0153');
      this.addSelectedShapesToGroup(groupID);
    }
  }

  // Shows/hides the shapes in the group and changes the +/- to correct form
  static displayGroup(groupID) {
    $(`#drop-down-${groupID}-div`).toggle();
    const x = $(`#${groupID}drop`).text();
    if (x === '+') {
      $(`#${groupID}drop`).text('-');
    } else {
      $(`#${groupID}drop`).text('+');
    }
  }

  // changes the visibility of the given group, and the associated visibility toggle button
  toggleGroupVisibility(groupID) {
    const color = rgb2hex($(`#${groupID}vis`).css('background-color'));
    if (color === '#b500fc') {
      $(`#${groupID}vis`).css('background-color', '#2c0153');
      for (const shapeID of this.groupDict[groupID]) {
        console.log(`Made Group ${groupID} invisible`);
        this.shapesDict[shapeID].groupVisibility = false;
        if (this.shapesDict[shapeID].shapeVisibility) {
          this.viewer.entities.remove(this.shapesDict[shapeID].shapeEntity);
        }
      }
      console.log(`Made Group ${groupID} invisible`);
    } else {
      $(`#${groupID}vis`).css('background-color', '#b500fc');
      for (const shapeID of this.groupDict[groupID]) {
        this.shapesDict[shapeID].groupVisibility = true;
        if (this.shapesDict[shapeID].shapeVisibility) {
          this.viewer.entities.add(this.shapesDict[shapeID].shapeEntity);
        }
      }
      console.log(`Made Group ${groupID} visible`);
    }
  }

  // deselects the selectedGroup group
  deselectGroup() {
    if (this.selectedGroup != null) {
      $('#disband-group-button').css('background-color', '#000230');
      $('#rename-group-button').css('background-color', '#000230');
      $('#add-to-group-button').css('background-color', '#000230');
      $(`#${this.selectedGroup}div`).css('background-color', '#2c0153');
      $(`#${this.selectedGroup}`).css('background-color', '#2c0153');
      $(`#${this.selectedGroup}drop`).css('background-color', '#2c0153');
      console.log(`Deselected group ${this.selectedGroup}`);
      this.selectedGroup = null;
    }
  }

  // disbands the selected group
  disbandGroup() {
    if (this.selectedGroup != null) {
      for (const shapeID of this.groupDict[this.selectedGroup]) {
        const temp = $(`#${shapeID}`).text();
        this.createButton('#shape-button-div', shapeID, temp);
        this.shapesDict[shapeID].groupVisibility = true;
        this.shapesDict[shapeID].groupID = null;
      }
      $(`#${this.selectedGroup}div`).remove();
      $(`#drop-down-${this.selectedGroup}-div`).remove();
      $('#disband-group-button').css('background-color', '#000230');
      $('#rename-group-button').css('background-color', '#000230');
      $('#add-to-group-button').css('background-color', '#000230');
      console.log(`Disbanded Group ${this.selectedGroup}`);
      this.groupDict[this.selectedGroup] = null;
      this.selectedGroup = null;
      this.deSelectShapes();
    }
  }

  // selects all shapes in the given group
  selectShapesInGroup(groupID) {
    this.selectShapeGate = true;
    for (const shapeID of this.groupDict[groupID]) {
      if (!(this.selectedShapes.includes(shapeID))) {
        this.selectShape(shapeID);
      }
    }
    this.selectShapeGate = false;
  }

  // selects group, if selected group was already selected and ctrl was held the group is deselected
  selectGroup(groupID) {
    if (this.selectedGroup !== groupID) {
      if (window.event.ctrlKey) {
        this.selectShapesInGroup(groupID);
      } else {
        this.deselectGroup();
        this.selectedGroup = groupID;
        $('#disband-group-button').css('background-color', '#313268');
        $('#rename-group-button').css('background-color', '#313268');
        if (this.selectedShapes.length > 0) {
          $('#add-to-group-button').css('background-color', '#313268');
        }
        $(`#${groupID}div`).css('background-color', '#6c399c');
        $(`#${groupID}`).css('background-color', '#6c399c');
        $(`#${groupID}drop`).css('background-color', '#6c399c');
        console.log(`Selected Group ${groupID}`);
      }
    } else if (window.event.ctrlKey) {
      this.selectShapesInGroup(groupID);
    } else {
      this.deselectGroup();
    }
  }

  // changes the group name (only ran when the accept button has been clicked)
  static renameGroup(groupID) {
    const name = $('#group-name').val();
    $(`#${groupID}`).text(name);
    $('#rename-group-div').hide();
  }

  // Function to run the cancel command of all tabs to ensure they are all closed correctly
  cancelTabs() {
    $('#edit-selected-shape-tab').hide();
    this.deleteShapeGate = true;
    $('#shape-color-button').val(this.drawingColor);
    $('#select-color-div').hide();
    $('#shape-opacity').val(this.drawingOpacity);
    $('#select-opacity-div').hide();
    this.selectedShapeButton = this.drawingMode;
    if (this.drawingMode === 'Line') {
      $('#point-button').css('background-color', '#000230');
      $('#line-button').css('background-color', '#2c2e79');
      $('#polygon-button').css('background-color', '#000230');
    } else if (this.drawingMode === 'Polygon') {
      $('#point-button').css('background-color', '#000230');
      $('#line-button').css('background-color', '#000230');
      $('#polygon-button').css('background-color', '#2c2e79');
    } else {
      $('#point-button').css('background-color', '#2c2e79');
      $('#line-button').css('background-color', '#000230');
      $('#polygon-button').css('background-color', '#000230');
    }
    $('#select-shape-div').hide();
    $('#rename-group-div').hide();
  }
}

export {
  shapeDrawing,
  rgb2hex,
};
