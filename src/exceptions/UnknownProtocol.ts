export = class UnknownProtocol extends Error {
  constructor(protocol) {
    super();
    this.message = "Unknown Protocol: " + String(protocol);
    this.name = 'UnknownProtocol';
  }
};