"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./constants");
var errors_1 = require("./errors");
var RecordFieldModel_1 = require("./models/RecordFieldModel");
var RecordModel_1 = require("./models/RecordModel");
var RecordSetModel_1 = require("./models/RecordSetModel");
var TableModel_1 = require("./models/TableModel");
var TableSchemaModel_1 = require("./models/TableSchemaModel");
var createRecordModelClass = function (Base) {
    return /** @class */ (function (_super) {
        __extends(ExtendedRecordModel, _super);
        function ExtendedRecordModel(id, table) {
            var _this = _super.call(this, id, table) || this;
            _this._fields = {};
            return _this;
        }
        return ExtendedRecordModel;
    }(Base));
};
var DefaultModelFactory = /** @class */ (function () {
    function DefaultModelFactory() {
        this._recordClass = {};
        this._defineProperty = function (model, name, field, factory, cache) {
            if (cache === void 0) { cache = true; }
            if (constants_1.RESERVED_PROPERTIES.indexOf(name) >= 0)
                throw new Error(errors_1.default.reservedProperty(field.table.name, name));
            Object.defineProperty(model.prototype, name, {
                get: function () {
                    // TODO: Improve the instance cache mechanism. Invalidate when the field value changes..
                    return cache
                        ? (this._fields[name] || (this._fields[name] = factory(field, this)))
                        : factory(field, this);
                }
            });
        };
    }
    DefaultModelFactory.prototype.newTableSchema = function (db, name, schema) {
        return new TableSchemaModel_1.default(db, name, schema);
    };
    DefaultModelFactory.prototype.newTableModel = function (session, schema, state) {
        return new TableModel_1.default(session, schema, state);
    };
    DefaultModelFactory.prototype.newRecordModel = function (id, table) {
        var model = this.createRecordModel(table.schema);
        return new model(id, table);
    };
    DefaultModelFactory.prototype.newRecordSetModel = function (table, schema, owner) {
        return new RecordSetModel_1.default(table, schema, owner);
    };
    DefaultModelFactory.prototype.getRecordBaseClass = function (schema) {
        return RecordModel_1.default;
    };
    DefaultModelFactory.prototype.createRecordModel = function (schema) {
        var _this = this;
        if (this._recordClass[schema.name])
            return this._recordClass[schema.name];
        else {
            var model_1 = createRecordModelClass(this.getRecordBaseClass(schema));
            schema.fields.forEach(function (f) {
                return (f.isForeignKey || !f.isPrimaryKey)
                    && _this._defineProperty(model_1, f.propName, f, _this._newRecordField.bind(_this), false);
            });
            schema.relations.forEach(function (f) {
                return f.relationName && _this._defineProperty(model_1, f.relationName, f, f.unique
                    ? _this._newRecordRelation.bind(_this)
                    : _this._newRecordSet.bind(_this), !f.unique);
            });
            return this._recordClass[schema.name] = model_1;
        }
    };
    DefaultModelFactory.prototype._newRecordField = function (schema, record) {
        if (!schema.isForeignKey)
            return new RecordFieldModel_1.default(schema, record);
        if (!schema.references)
            throw new Error(errors_1.default.fkInvalidReference(schema.name));
        var refTable = schema.references && record.table.session.tables[schema.references];
        if (!refTable)
            throw new Error(errors_1.default.fkReferenceNotInSession(schema.name, schema.references));
        var recordId = schema.getRecordValue(record);
        if (recordId === undefined)
            return null;
        return refTable.getOrDefault(recordId);
    };
    DefaultModelFactory.prototype._newRecordSet = function (schema, record) {
        var refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error(errors_1.default.tableNotInSession(schema.table.name));
        return this.newRecordSetModel(refTable, schema, record);
    };
    DefaultModelFactory.prototype._newRecordRelation = function (schema, record) {
        var refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error(errors_1.default.tableNotInSession(schema.table.name));
        var id = refTable.getIndex(schema.name, record.id)[0];
        if (id === undefined)
            return null;
        return this.newRecordModel(id, refTable);
    };
    return DefaultModelFactory;
}());
exports.default = DefaultModelFactory;
