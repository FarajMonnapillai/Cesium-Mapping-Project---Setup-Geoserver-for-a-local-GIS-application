// Dummy viewer entity which does nothing useful, to allow for tests to be run
class mockViewerEntity {
  constructor() {
    this.mockConst = 5;
  }

  add(x) {
    this.mockConst += 1;
    return x;
  }

  remove(x) {
    this.mockConst -= 1;
    return x;
  }
}

export default mockViewerEntity;
