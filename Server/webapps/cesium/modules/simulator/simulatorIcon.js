class simulatorIcon {
  constructor(path) {
    this.path = path;
    this.reversing = false;
    // Return the first point the first time nextPoint is called
    this.i = -1;
  }

  // Returns the next point, reversing order every time the next edge is reached
  // (start or end of array)
  nextPoint() {
    if (this.reversing) {
      if (this.i === 0) {
        this.i = 1;
        this.reversing = false;
      } else {
        this.i -= 1;
      }
    } else if (this.i === this.path.length - 1) {
      this.i -= 1;
      this.reversing = true;
    } else {
      this.i += 1;
    }
    return this.path[this.i];
  }
}

export default simulatorIcon;
