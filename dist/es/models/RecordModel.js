import { ensureParam } from "../utils";
var RecordModel = /** @class */ (function () {
    function RecordModel(id, table) {
        this.id = ensureParam("id", id);
        this.table = ensureParam("table", table);
    }
    Object.defineProperty(RecordModel.prototype, "value", {
        get: function () {
            return this.table.getValue(this.id) || {};
        },
        set: function (data) {
            this.update(data);
        },
        enumerable: true,
        configurable: true
    });
    RecordModel.prototype.delete = function () {
        this.table.delete(this.id);
    };
    RecordModel.prototype.update = function (data) {
        this.table.schema.injectKeys(data, this);
        this.table.update(data);
        return this;
    };
    return RecordModel;
}());
export default RecordModel;
