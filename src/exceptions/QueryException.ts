export = class QueryException extends Error {
  constructor() {
    super();
    this.message = "Query Exception!";
    this.name = 'QueryException';
  }
};