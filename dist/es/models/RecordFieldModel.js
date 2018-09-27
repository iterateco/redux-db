import { ensureParam, ensureParamString } from "../utils";
var RecordFieldModel = /** @class */ (function () {
    function RecordFieldModel(schema, record) {
        this.schema = ensureParam("schema", schema);
        this.record = ensureParam("record", record);
        this.name = ensureParamString("schema.name", schema.name);
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
export default RecordFieldModel;
