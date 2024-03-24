export = class InvalidStream extends Error {
  constructor() {
    super();
    this.message = "Stream Not Found!";
    this.name = 'InvalidStream';
  }
};