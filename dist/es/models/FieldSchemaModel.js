import { TYPE_ATTR, TYPE_PK } from "../constants";
import { ensureParam } from "../utils";
var FieldSchemaModel = /** @class */ (function () {
    function FieldSchemaModel(table, name, schema, cascadeAsDefault) {
        this.table = ensureParam("table", table);
        this.type = schema.type || TYPE_ATTR;
        this.name = name;
        this.propName = schema.propName || name;
        this._valueFactory = schema.value ? schema.value.bind(this) : null;
        this.isPrimaryKey = schema.type === TYPE_PK;
        this.isForeignKey = schema.references !== null && schema.references !== undefined;
        if (this.isPrimaryKey || this.isForeignKey) {
            this.references = schema.references;
            this.relationName = schema.relationName;
            this.cascade = schema.cascade === undefined ? cascadeAsDefault : schema.cascade === true;
            this.unique = schema.unique === true;
            // not null is default true, for PK's and FK's
            this.notNull = schema.notNull === undefined ? true : schema.notNull === true;
        }
        else {
            this.cascade = false;
            this.unique = false;
            this.notNull = schema.notNull === true;
        }
    }
    Object.defineProperty(FieldSchemaModel.prototype, "refTable", {
        get: function () { return this._refTable; },
        enumerable: true,
        configurable: true
    });
    FieldSchemaModel.prototype.connect = function (schemas) {
        var _this = this;
        if (this.references) {
            this._refTable = schemas.filter(function (tbl) { return tbl.name === _this.references; })[0];
            if (!this._refTable)
                throw new Error("The field schema \"" + this.table.name + "." + this.name + "\" "
                    + ("has an invalid reference to unknown table \"" + this.references + "\"."));
        }
    };
    FieldSchemaModel.prototype.getValue = function (data, record) {
        return this._valueFactory ? this._valueFactory(data, {
            record: record,
            schema: this
        }) : data[this.name];
    };
    FieldSchemaModel.prototype.getRecordValue = function (record) {
        return this.getValue(record.value, record);
    };
    return FieldSchemaModel;
}());
export default FieldSchemaModel;
