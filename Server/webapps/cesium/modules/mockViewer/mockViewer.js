import mockViewerEntity from './mockViewerEntity.js';
import mockImageryLayer from './mockImageryLayer.js';

// Dummy viewer which does nothing useful, to allow for tests to be run

class mockViewer {
  constructor() {
    this.entities = new mockViewerEntity();
    this.scene = {
      imageryLayers: new mockImageryLayer(),
    };
  }
}

export default mockViewer;
