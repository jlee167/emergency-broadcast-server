export = class DuplicateStream extends Error {
  constructor() {
    super();
    this.message = "An active stream already exists for this user!";
    this.name = 'DuplicateStreamException';
  }
};