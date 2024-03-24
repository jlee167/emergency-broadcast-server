export = class InvalidCredential extends Error {
  constructor() {
    super();
    this.message = "Failed to authenticate with provided token.";
    this.name = 'Invalid Credential';
  }
};