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
import { TYPE_MODIFIED } from "../constants";
import * as utils from "../utils";
import FieldSchemaModel from "./FieldSchemaModel";
var TableSchemaModel = /** @class */ (function () {
    function TableSchemaModel(db, name, schema) {
        var _this = this;
        this._relations = [];
        this.db = utils.ensureParam("db", db);
        this.name = utils.ensureParamString("name", name);
        this.fields = Object.keys(utils.ensureParam("schema", schema))
            .map(function (fieldName) {
            return new FieldSchemaModel(_this, fieldName, schema[fieldName], db.options.cascadeAsDefault === true);
        });
        this._primaryKeyFields = this.fields.filter(function (f) { return f.isPrimaryKey; });
        this._foreignKeyFields = this.fields.filter(function (f) { return f.isForeignKey; });
        this._stampFields = this.fields.filter(function (f) { return f.type === TYPE_MODIFIED; });
    }
    Object.defineProperty(TableSchemaModel.prototype, "relations", {
        /// Gets the FK's that references this table.
        get: function () { return this._relations; },
        enumerable: true,
        configurable: true
    });
    TableSchemaModel.prototype.connect = function (schemas) {
        var _this = this;
        schemas.forEach(function (schema) {
            return _this._relations = _this._relations.concat(schema.fields.filter(function (f) { return f.references === _this.name; }));
        });
        this._foreignKeyFields.forEach(function (fk) { return fk.connect(schemas); });
    };
    TableSchemaModel.prototype.normalize = function (data, context) {
        var _this = this;
        if (typeof (data) !== "object" && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");
        var ctx = utils.ensureParam("context", context);
        if (!ctx.output[this.name])
            ctx.output[this.name] = { ids: [], byId: {}, indexes: {} };
        return utils.ensureArray(data).map(function (obj) {
            if (!utils.isObject(obj))
                throw new Error("Failed to normalize data. Given record is not a plain object.");
            var subject = obj;
            var normalizer = _this.db.getNormalizer(_this.name);
            if (normalizer)
                subject = normalizer(subject, ctx);
            var pk = ctx.normalizePKs ? _this._normalizePrimaryKey(subject) : _this._getPrimaryKey(subject);
            if (!pk)
                throw new Error("Failed to normalize primary key for record of type \"" + _this.name + "\"."
                    + " Make sure record(s) have a primary key value before trying to insert or update a table.");
            var fks = _this.getForeignKeys(subject);
            var tbl = ctx.output[_this.name];
            if (!tbl.byId[pk])
                tbl.ids.push(pk);
            var record = tbl.byId[pk] = __assign({}, subject);
            fks.forEach(function (fk) {
                // if the FK is an object, then normalize it and replace object with it's PK.
                if (typeof fk.value === "object" && fk.refTable) {
                    var fkPks = fk.refTable.normalize(fk.value, ctx);
                    if (fkPks.length > 1)
                        throw new Error("Invalid schema definition. The field \"" + _this.name + "." + fk.name + "\""
                            + (" is referencing table \"" + fk.refTable.name + "\", but the given data is an array."));
                    record[fk.name] = fk.value = fkPks[0];
                }
                // all FK's are auto indexed
                if (utils.isValidID(fk.value)) {
                    var fkId = utils.asID(fk.value); // ensure string id
                    var idx = tbl.indexes[fk.name] || (tbl.indexes[fk.name] = { unique: fk.unique, values: {} });
                    if (!idx.values[fkId])
                        idx.values[fkId] = [];
                    if (idx.unique && idx.values.length)
                        throw new Error("The insert/update operation violates"
                            + (" the unique foreign key \"" + _this.name + "." + fk.name + "\"."));
                    idx.values[fkId].push(pk);
                }
            });
            // Normalize foreign relations, FKs from other tables referencing this table.
            // Then remove the nested relations from the record.
            _this.relations.forEach(function (rel) {
                if (rel.relationName && record[rel.relationName]) {
                    var normalizedRels = _this.inferRelations(record[rel.relationName], rel, pk);
                    rel.table.normalize(normalizedRels, ctx);
                    delete record[rel.relationName];
                }
            });
            return pk;
        });
    };
    TableSchemaModel.prototype.inferRelations = function (data, rel, ownerId) {
        if (!rel.relationName)
            return data;
        var otherFks = rel.table.fields.filter(function (f) { return f.isForeignKey && f !== rel; });
        return utils.ensureArray(data).map(function (obj) {
            var _a, _b;
            if (typeof obj === "number" || typeof obj === "string")
                if (otherFks.length === 1)
                    obj = (_a = {}, _a[otherFks[0].name] = obj, _a);
                else
                    obj = { id: obj }; // TODO: this might be quite wrong..
            return __assign({}, obj, (_b = {}, _b[rel.name] = ownerId, _b));
        });
    };
    TableSchemaModel.prototype.injectKeys = function (data, record) {
        if (!data || typeof data !== "object")
            return data;
        // inject primary or foreign keys
        var keys = this._primaryKeyFields;
        if (!keys.length)
            keys = this._foreignKeyFields;
        keys.forEach(function (key) {
            if (data[key.name] === undefined)
                data[key.name] = key.getRecordValue(record);
        });
    };
    TableSchemaModel.prototype.getPrimaryKey = function (record) {
        var pk = this._getPrimaryKey(record);
        if (!pk)
            throw new Error("Failed to get primary key for record of type \"" + this.name + "\".");
        return pk;
    };
    TableSchemaModel.prototype.getForeignKeys = function (record) {
        return this._foreignKeyFields.map(function (fk) { return ({
            name: fk.name,
            notNull: fk.notNull,
            refTable: fk.refTable,
            unique: fk.unique,
            value: record[fk.name]
        }); });
    };
    TableSchemaModel.prototype.isModified = function (x, y) {
        if (this._stampFields.length > 0)
            return this._stampFields.reduce(function (p, n) {
                return p + (n.getValue(x) === n.getValue(y) ? 1 : 0);
            }, 0) !== this._stampFields.length;
        else
            return !this.db.getRecordComparer(this.name)(x, y, this);
    };
    /// Gets the value of the PK for the given record. Does not throw if none found.
    TableSchemaModel.prototype._getPrimaryKey = function (record) {
        var lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        var combinedPk = lookup.reduce(function (p, n) {
            var k = n.getValue(record);
            return p && k ? (p + "_" + k) : k;
        }, null);
        return utils.isValidID(combinedPk) && utils.asID(combinedPk);
    };
    /// Normalizes the given record with a primary key field. Returns the key value.
    TableSchemaModel.prototype._normalizePrimaryKey = function (record) {
        var pk = this._getPrimaryKey(record);
        // Invoke the "onGeneratePK" hook if PK not found.
        if (!pk) {
            var generatedPk = this.db.getPkGenerator(this.name)(record, this);
            if (generatedPk) {
                // if the PK is generated and we have a single PK field definition, then inject it into the record.
                if (this._primaryKeyFields.length === 1)
                    record[this._primaryKeyFields[0].propName] = generatedPk;
                // TODO: Handle multiple PK field defs.
                // We may need the "onGeneratePK" hook to return an object defining each key value.
                // BUT this seems like a rare scenario..
                pk = generatedPk;
            }
        }
        return pk;
    };
    return TableSchemaModel;
}());
export default TableSchemaModel;
