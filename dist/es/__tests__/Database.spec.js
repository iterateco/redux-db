// tslint:disable:object-literal-sort-keys
import { TYPE_PK } from "../constants";
import Database from "../Database";
describe("constructor", function () {
    test("throws if no schema given", function () {
        var db = Database;
        expect(function () { return new db(); }).toThrow();
    });
    test("throws if invalid schema given", function () {
        var db = Database;
        expect(function () { return new db([]); }).toThrow();
    });
    test("creates table schemas", function () {
        return expect(new Database({
            table1: {},
            table2: {}
        }).tables).toHaveLength(2);
    });
    describe("with custom model factory", function () {
        var mockSchema = {
            connect: jest.fn()
        };
        var factory = {
            newTableSchema: jest.fn().mockReturnValue(mockSchema),
            newTableModel: jest.fn(),
            newRecordModel: jest.fn(),
            newRecordSetModel: jest.fn()
        };
        var db = new Database({ table1: {} }, { factory: factory });
        test("calls factory.newTableSchema", function () {
            return expect(factory.newTableSchema).toHaveBeenCalled();
        });
        test("calls connect on new table schema", function () {
            return expect(mockSchema.connect).toHaveBeenCalled();
        });
    });
});
describe("getNormalizer", function () {
    var _a, _b;
    var normalizer = jest.fn(function (val) { return val; });
    var tableName = "test";
    var db = new Database((_a = {},
        _a[tableName] = { id: { type: TYPE_PK } },
        _a), { onNormalize: (_b = {}, _b[tableName] = normalizer, _b) });
    var state = db.reduce();
    var _c = tableName, table = db.createSession(state).tables[_c];
    table.insert({ id: 1 });
    test("custom normalizer called", function () {
        return expect(normalizer).toHaveBeenCalled();
    });
});
