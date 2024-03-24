export = class UnassignedPort extends Error {
  constructor(port: number) {
    super();
    this.message = `tried to release unassigned port ${port}`;
    this.name = 'Unassigned Port';
  }
};