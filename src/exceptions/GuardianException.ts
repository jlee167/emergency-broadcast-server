export = class GuardianException extends Error {
  constructor() {
    super();
    this.message = "You are not on guardian list.";
    this.name = 'GuardianException';
  }
};