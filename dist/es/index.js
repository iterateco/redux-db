import Database from "./Database";
export var createDatabase = function (schema, options) { return new Database(schema, options); };
export * from "./constants";
export * from "./models";
export { default as DefaultModelFactory } from "./DefaultModelFactory";
