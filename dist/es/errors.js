// tslint:disable:max-line-length
export default {
    fkInvalidReference: function (key) { return "The foreign key: \"" + key + "\" does not define a valid referenced table."; },
    fkReferenceNotInSession: function (key, references) { return "The foreign key: \"" + key + "\" references an unregistered table: \"" + references + "\" in the current session."; },
    fkUndefined: function (table, key) { return "No foreign key named: " + key + " in the schema: \"" + table + "\"."; },
    fkViolation: function (table, key) { return "The insert/update operation violates the unique foreign key \"" + table + "." + key + "\"."; },
    recordNotFound: function (table, id) { return "No \"" + table + "\" record with id: " + id + " exists."; },
    recordUpdateNotFound: function (table, id) { return "Failed to apply update. No \"" + table + "\" record with id: " + id + " exists."; },
    reservedProperty: function (name, prop) { return "The property \"" + name + "." + prop + "\" is a reserved name. Please specify another name using the \"propName\" definition."; },
    sessionReadonly: function () { return "Invalid attempt to alter a readonly session."; },
    stateTableUndefined: function () { return "Failed to select table. Could not identify table schema."; },
    tableInvalidState: function (table) { return "The table \"" + table + "\" has an invalid state."; },
    tableNotInSession: function (table) { return "The table: \"" + table + "\" does not exist in the current session."; }
};
