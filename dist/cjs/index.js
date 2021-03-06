"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var Database_1 = require("./Database");
exports.createDatabase = function (schema, options) { return new Database_1.default(schema, options); };
__export(require("./constants"));
__export(require("./models").default);
exports.DefaultModelFactory = require("./DefaultModelFactory").default;
