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
var errors_1 = require("../errors");
var utils = require("../utils");
var NormalizeContext_1 = require("./NormalizeContext");
var TableModel = /** @class */ (function () {
    function TableModel(session, schema, state) {
        if (state === void 0) { state = { ids: [], byId: {}, indexes: {} }; }
        this.dirty = false;
        this.session = utils.ensureParam("session", session);
        this.schema = utils.ensureParam("schema", schema);
        this.state = utils.ensureParam("state", state);
        var _a = this.state, ids = _a.ids, byId = _a.byId, indexes = _a.indexes;
        if (!ids || !byId || !indexes)
            throw new Error(errors_1.default.tableInvalidState(schema.name));
        if (!this.state.name)
            this.state.name = schema.name;
    }
    Object.defineProperty(TableModel.prototype, "length", {
        get: function () {
            return this.state.ids.length;
        },
        enumerable: true,
        configurable: true
    });
    TableModel.prototype.all = function () {
        var _this = this;
        return this.state.ids.map(function (id) { return _this.schema.db.factory.newRecordModel(id, _this); });
    };
    TableModel.prototype.getValues = function () {
        var _this = this;
        return this.state.ids.map(function (id) { return _this.state.byId[id]; });
    };
    TableModel.prototype.get = function (id) {
        if (!this.exists(id))
            throw new Error(errors_1.default.recordNotFound(this.schema.name, id));
        return this.schema.db.factory.newRecordModel(utils.asID(id), this);
    };
    TableModel.prototype.getOrDefault = function (id) {
        return this.exists(id) ? this.get(id) : null;
    };
    TableModel.prototype.getByFk = function (fieldName, id) {
        utils.ensureParam("fieldName", fieldName);
        id = utils.ensureID(id);
        var field = this.schema.fields.filter(function (f) { return f.isForeignKey && f.name === fieldName; })[0];
        if (!field)
            throw new Error(errors_1.default.fkUndefined(this.schema.name, fieldName));
        return this.schema.db.factory.newRecordSetModel(this, field, { id: id });
    };
    TableModel.prototype.getFieldValue = function (id, field) {
        var record = this.getOrDefault(id);
        if (record)
            return record.value[field];
        else
            return undefined;
    };
    TableModel.prototype.getValue = function (id) {
        if (utils.isValidID(id))
            return this.state.byId[id];
        else
            return undefined;
    };
    TableModel.prototype.getIndex = function (name, fk) {
        utils.ensureParamString("value", name);
        utils.ensureParamString("fk", fk);
        if (this.state.indexes[name] && this.state.indexes[name].values[fk])
            return this.state.indexes[name].values[fk];
        else
            return [];
    };
    TableModel.prototype.exists = function (id) {
        if (!utils.isValidID(id))
            return false;
        return this.state.byId[utils.asID(id)] !== undefined;
    };
    TableModel.prototype.insert = function (data) {
        return this._normalizedAction(data, this.insertNormalized, true);
    };
    TableModel.prototype.update = function (data) {
        return this._normalizedAction(data, this.updateNormalized, false);
    };
    TableModel.prototype.upsert = function (data) {
        return this._normalizedAction(data, this.upsertNormalized, true);
    };
    TableModel.prototype.delete = function (id) {
        if (typeof id !== "string" && typeof id !== "number")
            id = this.schema.getPrimaryKey(id);
        if (!this.exists(id))
            return false;
        id = utils.asID(id);
        this._deleteCascade(id);
        var byId = __assign({}, this.state.byId);
        var ids = this.state.ids.slice();
        var indexes = __assign({}, this.state.indexes);
        var record = byId[id];
        delete byId[id];
        var idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);
        if (record)
            this._cleanIndexes(id, record, indexes);
        this.dirty = true;
        this.state = __assign({}, this.state, { byId: byId, ids: ids, indexes: indexes });
        return true;
    };
    TableModel.prototype.deleteAll = function () {
        if (this.length)
            this.all().forEach(function (d) { return d.delete(); });
    };
    TableModel.prototype.insertNormalized = function (table) {
        var _this = this;
        utils.ensureParam("table", table);
        this.dirty = true;
        this.state = __assign({}, this.state, { byId: __assign({}, this.state.byId, table.byId), ids: utils.mergeIds(this.state.ids, table.ids, true) });
        this._updateIndexes(table);
        return table.ids.map(function (id) { return _this.schema.db.factory.newRecordModel(id, _this); });
    };
    TableModel.prototype.updateNormalized = function (table) {
        var _this = this;
        utils.ensureParam("table", table);
        var state = __assign({}, this.state);
        var dirty = false;
        var records = Object.keys(table.byId).map(function (id) {
            if (!_this.state.byId[id])
                throw new Error(errors_1.default.recordUpdateNotFound(_this.schema.name, id));
            var oldRecord = state.byId[id];
            var newRecord = __assign({}, oldRecord, table.byId[id]);
            var isModified = _this.schema.isModified(oldRecord, newRecord);
            if (isModified) {
                state.byId[id] = newRecord;
                dirty = true;
            }
            return _this.schema.db.factory.newRecordModel(id, _this);
        });
        if (dirty) {
            this.dirty = true;
            this.state = state;
            this._updateIndexes(table);
        }
        return records;
    };
    TableModel.prototype.upsertNormalized = function (norm) {
        var _this = this;
        utils.ensureParam("table", norm);
        var toUpdate = { ids: [], byId: {}, indexes: {} };
        var toInsert = { ids: [], byId: {}, indexes: {} };
        norm.ids.forEach(function (id) {
            if (_this.exists(id)) {
                toUpdate.ids.push(id);
                toUpdate.byId[id] = norm.byId[id];
            }
            else {
                toInsert.ids.push(id);
                toInsert.byId[id] = norm.byId[id];
            }
        });
        var refs = (toUpdate.ids.length ? this.updateNormalized(toUpdate) : []).concat((toInsert.ids.length ? this.insertNormalized(toInsert) : []));
        this._updateIndexes(norm);
        return refs;
    };
    TableModel.prototype._normalizedAction = function (data, action, normalizePKs) {
        utils.ensureParam("data", data);
        utils.ensureParam("action", action);
        var ctx = new NormalizeContext_1.default(this.schema, normalizePKs);
        this.schema.normalize(data, ctx);
        var table = ctx.output[this.schema.name];
        var records = table ? action.call(this, table) : [];
        this.session.upsert(ctx);
        return records;
    };
    TableModel.prototype._updateIndexes = function (table) {
        var _this = this;
        Object.keys(table.indexes).forEach(function (key) {
            var idx = _this.state.indexes[key]
                || (_this.state.indexes[key] = { unique: table.indexes[key].unique, values: {} });
            Object.keys(table.indexes[key].values).forEach(function (fk) {
                var idxBucket = idx.values[fk] || (idx.values[fk] = []);
                var modifiedBucket = utils.mergeIds(idxBucket, table.indexes[key].values[fk], false);
                if (idx.unique && modifiedBucket.length > 1)
                    throw new Error(errors_1.default.fkViolation(_this.schema.name, key));
                idx.values[fk] = modifiedBucket;
            });
        });
    };
    TableModel.prototype._cleanIndexes = function (id, record, indexes) {
        var fks = this.schema.getForeignKeys(record);
        fks.forEach(function (fk) {
            var fkIdx = -1;
            if (fk.value && indexes[fk.name] && indexes[fk.name].values[fk.value])
                fkIdx = indexes[fk.name].values[fk.value].indexOf(id);
            if (fkIdx >= 0) {
                var idxBucket = indexes[fk.name].values[fk.value].slice();
                idxBucket.splice(fkIdx, 1);
                indexes[fk.name].values[fk.value] = idxBucket;
            }
            else if (indexes[fk.name]) {
                delete indexes[fk.name].values[id];
                if (Object.keys(indexes[fk.name].values).length === 0)
                    delete indexes[fk.name];
            }
        });
    };
    TableModel.prototype._deleteCascade = function (id) {
        var cascade = this.schema.relations.filter(function (rel) { return rel.relationName && rel.cascade; });
        if (cascade.length) {
            var model_1 = this.get(id);
            if (model_1)
                cascade.forEach(function (schema) {
                    var relation = model_1[schema.relationName];
                    if (relation)
                        relation.delete();
                });
        }
    };
    return TableModel;
}());
exports.default = TableModel;
