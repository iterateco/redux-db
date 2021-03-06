"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var DatabaseSession_1 = require("./DatabaseSession");
var DefaultModelFactory_1 = require("./DefaultModelFactory");
var utils_1 = require("./utils");
var defaultOptions = {
    cascadeAsDefault: false
};
var getMappedFunction = function (map, key, defaultFn) {
    if (!map)
        return defaultFn;
    if (typeof map === "function")
        return map;
    else if (map[key])
        return map[key];
    return defaultFn;
};
var Database = /** @class */ (function () {
    function Database(schema, options) {
        var _this = this;
        this.getNormalizer = function (schemaName) {
            return getMappedFunction(_this.options.onNormalize, schemaName, function (obj) { return obj; });
        };
        this.getPkGenerator = function (schemaName) {
            return getMappedFunction(_this.options.onGeneratePK, schemaName, function () { return undefined; });
        };
        this.getRecordComparer = function (schemaName) {
            return getMappedFunction(_this.options.onRecordCompare, schemaName, utils_1.isEqual);
        };
        utils_1.ensureParamObject("schema", schema);
        this.options = __assign({}, defaultOptions, options);
        this.factory = this.options.factory || new DefaultModelFactory_1.default();
        this.tables = Object.keys(schema).map(function (tableName) {
            return _this.factory.newTableSchema(_this, tableName, schema[tableName]);
        });
        this.tables.forEach(function (table) { return table.connect(_this.tables); });
        this._tableLookup = utils_1.toObject(this.tables, function (t) { return t.name; });
    }
    Database.prototype.combineReducers = function () {
        var _this = this;
        var reducers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            reducers[_i] = arguments[_i];
        }
        return function (state, action) {
            if (state === void 0) { state = {}; }
            return _this.reduce(state, action, reducers);
        };
    };
    Database.prototype.reduce = function (state, action, reducers, arg) {
        var session = this.createSession(state);
        utils_1.ensureArray(reducers).forEach(function (reducer) { return reducer(session.tables, action, arg); });
        return session.commit();
    };
    Database.prototype.createSession = function (state, options) {
        return new DatabaseSession_1.default(state, this, __assign({ readOnly: false }, options));
    };
    Database.prototype.selectTables = function (state) {
        var _this = this;
        var tableSchemas = Object.keys(state)
            .filter(function (tableName) { return _this._tableLookup[tableName]; })
            .map(function (tableName) { return _this._tableLookup[tableName]; });
        var session = this.createSession(state, {
            readOnly: true,
            tableSchemas: tableSchemas
        });
        return session.tables;
    };
    return Database;
}());
exports.default = Database;
