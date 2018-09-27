"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../utils");
var RecordFieldModel = /** @class */ (function () {
    function RecordFieldModel(schema, record) {
        this.schema = utils_1.ensureParam("schema", schema);
        this.record = utils_1.ensureParam("record", record);
        this.name = utils_1.ensureParamString("schema.name", schema.name);
    }
    Object.defineProperty(RecordFieldModel.prototype, "value", {
        get: function () {
            return this.schema.getRecordValue(this.record);
        },
        enumerable: true,
        configurable: true
    });
    return RecordFieldModel;
}());
exports.default = RecordFieldModel;
