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
import errors from "./errors";
import { toObject } from "./utils";
var DatabaseSession = /** @class */ (function () {
    function DatabaseSession(state, db, options) {
        if (state === void 0) { state = {}; }
        var _this = this;
        this.state = state;
        this.db = db;
        this.options = options;
        var tableSchemas = options.tableSchemas || db.tables;
        this.tables = toObject(tableSchemas.map(function (tableSchema) {
            return _this.db.factory.newTableModel(_this, tableSchema, state[tableSchema.name]);
        }), function (t) { return t.schema.name; });
    }
    DatabaseSession.prototype.upsert = function (ctx) {
        var _this = this;
        if (this.options.readOnly)
            throw new Error(errors.sessionReadonly());
        Object.keys(ctx.output).forEach(function (name) {
            if (name !== ctx.schema.name)
                _this.tables[name].upsertNormalized(ctx.output[name]);
        });
        Object.keys(ctx.emits).forEach(function (name) {
            if (name !== ctx.schema.name)
                _this.tables[name].upsert(ctx.emits[name]);
        });
    };
    DatabaseSession.prototype.commit = function () {
        var _this = this;
        if (this.options.readOnly)
            throw new Error(errors.sessionReadonly());
        Object.keys(this.tables).forEach(function (table) {
            var _a;
            var oldState = _this.state[table];
            var newState = _this.tables[table].state;
            if (oldState !== newState)
                _this.state = __assign({}, _this.state, (_a = {}, _a[table] = newState, _a));
        });
        return this.state;
    };
    return DatabaseSession;
}());
export default DatabaseSession;
