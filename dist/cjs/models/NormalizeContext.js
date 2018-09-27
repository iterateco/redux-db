"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DbNormalizeContext = /** @class */ (function () {
    function DbNormalizeContext(schema, normalizePKs) {
        this.output = {};
        this.emits = {};
        this.schema = schema;
        this.db = schema.db;
        this.normalizePKs = normalizePKs;
    }
    DbNormalizeContext.prototype.emit = function (tableName, record) {
        this.emits[tableName] = this.emits[tableName] || [];
        this.emits[tableName].push(record);
    };
    return DbNormalizeContext;
}());
exports.default = DbNormalizeContext;
