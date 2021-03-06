import * as ReduxDB from "../../../src/index"; // "redux-db"

// the schema
export const schema: ReduxDB.Schema = {
    "Task": {
        "id": { type: "PK" },
        "owner": { references: "User", relationName: "tasks" }
    },
    "User": {
        "id": { type: "PK" }
    },
    "Comment": {
        "id": { type: "PK" },
        "taskId": { propName: "task", references: "Task", relationName: "comments" },
        "author": { references: "User", relationName: "comments" }
    },
    "TaskLabel": {
        "labelId": { propName: "label", references: "Label", relationName: "tasks" },
        "taskId": { propName: "task", references: "Task", relationName: "labels" }
    },
    "Label": {
        "id": { type: "PK" },
        "mod": { type: "PK", value: r => r.id + r.type }
    }
};

// create db instance
export const dbInstance = ReduxDB.createDatabase(schema, {
    onNormalize: {
        "TaskLabel": (record, ctx) => {
            const { id, name, taskId } = record;

            ctx.emit("Label", { id, name });

            return { labelId: id, taskId };
        }
    }
});


// Schema models
export interface UserRecord extends ReduxDB.TableRecord<TodoApp.User> {
    tasks: ReduxDB.TableRecordSet<TaskRecord>;
    comments: ReduxDB.TableRecordSet<CommentRecord>;
}

export interface TaskRecord extends ReduxDB.TableRecord<TodoApp.Task> {
    comments: ReduxDB.TableRecordSet<CommentRecord>;
    owner: UserRecord;
}

export interface CommentRecord extends ReduxDB.TableRecord<TodoApp.Comment> {
    task: TaskRecord;
    author: UserRecord;
}

export type TaskTable = ReduxDB.Table<TodoApp.Task, TaskRecord>;
export type UserTable = ReduxDB.Table<TodoApp.User, UserRecord>;
export type CommentTable = ReduxDB.Table<TodoApp.Comment, CommentRecord>;

export interface Session extends ReduxDB.TableMap {
    Task: TaskTable;
    Comment: CommentTable;
    User: UserTable;
}