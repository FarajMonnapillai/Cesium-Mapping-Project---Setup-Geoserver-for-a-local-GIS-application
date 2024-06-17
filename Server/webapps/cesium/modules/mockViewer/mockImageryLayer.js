// Dummyimagery layer which does nothing useful, to allow for tests to be run
class mockImageryLayer {
  constructor() {
    this.mockConst = 5;
  }

  addImageryProvider(x) {
    this.mockConst += 1;
    return x;
  }
}

export default mockImageryLayer;
