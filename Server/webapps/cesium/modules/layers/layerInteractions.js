/* Puts layer onto map and creates a control button in the shape and layer tab
    name: this is just the name that will appear in the button
    title: the name that maps to installed a layer in geoserver
*/
import {
  WebMapServiceImageryProvider,
} from '../../libs/Cesium-1.87.1/Source/Cesium.js';
import { rgb2hex } from '../shapes/shapeDrawing.js';
import $ from '../../libs/jquery/src/jquery.js';

const url = 'http://localhost:8080/geoserver/wms';

class layerInteractions {
  constructor(viewer) {
    this.viewer = viewer;
    this.layerDict = {};
    this.layerCount = 0;
  }

  addLayer(name, title, initialAlpha) {
    this.layerDict[this.layerCount] = {};
    this.layerDict[this.layerCount].name = name;
    this.layerDict[this.layerCount].layer = this.viewer.scene.imageryLayers.addImageryProvider(
      new WebMapServiceImageryProvider({
        url,
        layers: title,
        parameters: {
          transparent: 'true',
          format: 'image/png',
        },
      }),
    );
    this.layerDict[this.layerCount].layer.alpha = 0;
    this.layerDict[this.layerCount].opacity = (initialAlpha * 1.0) / 100;
    this.layerDict[this.layerCount].visible = false;
    const $input = $(`<div id="${this.layerCount}_div" class="layer-div"> <button id="${this.layerCount}_select" class="layer-button horizontal-centre" type="button" onclick="layers.constructor.selectLayer(${this.layerCount})">${name}</button> <button id="${this.layerCount}_vis" class="visibility-button" type="button" onclick="layers.toggleLayerVisibility(${this.layerCount})"></button> </div> <div id="${this.layerCount}-layer-opacity-div" class="drop-down-div layer-drop-down-div"></div>`);
    $input.appendTo($('#shape-button-div'));
    $(`#${this.layerCount}_vis`).css('background-color', '#095018');
    console.log(`Initialized Layer ${title} Given ID:${this.layerCount}`);
    const $input2 = $(`<label for="${this.layerCount}-opacity" style="position: absolute; top: 15%; left: 4%;">Opacity:</label><input type="range" style="position: absolute; top: 0px; left: 25%;" id="${this.layerCount}-opacity" name="volume"min="0" max="100" value="${initialAlpha}" oninput="layers.updateOpacity(${this.layerCount}, this.value)"><output id="${this.layerCount}-slider" style="position: absolute; top: 15%; right: 4%;">${initialAlpha}%</output>`);
    $input2.appendTo($(`#${this.layerCount}-layer-opacity-div`));
    this.layerCount += 1;
  }

  // toggles between the opacities of 0 and the opacity stored with the given layer
  toggleLayerVisibility(layerId) {
    let color = rgb2hex($(`#${layerId}_vis`).css('background-color'));
    if (color === '#095018') {
      console.log(`Made layer ${layerId} Visible`);
      this.layerDict[layerId].visible = true;
      $(`#${layerId}_vis`).css('background-color', '#00ad26');
      this.layerDict[layerId].layer.alpha = this.layerDict[layerId].opacity;
    } else {
      console.log(`Made layer ${layerId} Invisible`);
      this.layerDict[layerId].visible = false;
      $(`#${layerId}_vis`).css('background-color', '#095018');
      this.layerDict[layerId].layer.alpha = 0;
    }
  }

  // toggles the dropdown opacity slider
  static selectLayer(layerID) {
    $(`#${layerID}-layer-opacity-div`).toggle();
  }

  // will change the given layers stored opacity value to the new opacity,
  // If the given layer is currently visible it's opacity will also be updated
  updateOpacity(layerID, newOpacity) {
    $(`#${layerID}-slider`).text(`${newOpacity}%`);
    if (this.layerDict[layerID].visible) {
      this.layerDict[layerID].layer.alpha = (newOpacity * 1.0) / 100;
    }
    this.layerDict[layerID].opacity = (newOpacity * 1.0) / 100;
  }
}

export { url, layerInteractions };
