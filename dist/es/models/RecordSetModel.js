import { ensureParam } from "../utils";
var RecordSetModel = /** @class */ (function () {
    function RecordSetModel(table, schema, owner) {
        this.table = ensureParam("table", table);
        this.schema = ensureParam("schema", schema);
        this.owner = ensureParam("owner", owner);
    }
    Object.defineProperty(RecordSetModel.prototype, "ids", {
        get: function () {
            return this.table.getIndex(this.schema.name, this.owner.id);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecordSetModel.prototype, "length", {
        get: function () {
            return this.ids.length;
        },
        enumerable: true,
        configurable: true
    });
    RecordSetModel.prototype.all = function () {
        var _this = this;
        return this.ids.map(function (id) { return _this.table.schema.db.factory.newRecordModel(id, _this.table); });
    };
    RecordSetModel.prototype.getValue = function () {
        return this.all().map(function (r) { return r.value; });
    };
    RecordSetModel.prototype.add = function (data) {
        this.table.insert(this._normalize(data));
    };
    RecordSetModel.prototype.remove = function (data) {
        var _this = this;
        this._normalize(data).forEach(function (obj) {
            var pk = _this.table.schema.getPrimaryKey(obj);
            _this.table.delete(pk);
        });
    };
    RecordSetModel.prototype.update = function (data) {
        this.table.update(this._normalize(data));
        return this;
    };
    RecordSetModel.prototype.delete = function () {
        var _this = this;
        this.ids.forEach(function (id) { return _this.table.delete(id); });
    };
    RecordSetModel.prototype._normalize = function (data) {
        return this.table.schema.inferRelations(data, this.schema, this.owner.id);
    };
    return RecordSetModel;
}());
export default RecordSetModel;
