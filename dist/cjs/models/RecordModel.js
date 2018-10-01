"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../utils");
var RecordModel = /** @class */ (function () {
    function RecordModel(id, table) {
        this.id = utils_1.ensureParam("id", id);
        this.table = utils_1.ensureParam("table", table);
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
exports.default = RecordModel;
