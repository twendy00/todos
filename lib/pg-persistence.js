const { dbQuery } = require('./db-query');
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  // Returns a Promise that resolves to `true` if 
  // `username` and `password` combine to identify a 
  // legitimate application user, `false` if either 
  // the `username` or `password` is invalid. 
  async authenticateUser(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users " +
                                 "WHERE username = $1"; 
                            
    let result = await dbQuery(FIND_HASHED_PASSWORD, username);

    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  // Create a new todo list with the specified title and 
  // add it to the list of todo lists. 
  // Returns a Promise that resolves to `true` on success, 
  // `false` on failure
  // Not known failure conditions at this time
  async createTodoList(title) {
    const ADD_TODO_LIST = "INSERT INTO todolists (title, username) " +
                          "VALUES ($1, $2)";
    let result = await dbQuery(ADD_TODO_LIST, title, this.username);
    return result.rowCount > 0;
  }

  // Are all of the todos in the todo list done? If the todo list has at least
  // one todo and all of its todos are marked done, then the todo list is 
  // done. Otherwise, it is undone. 
  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  // Does the todo list have any undone todos? Returns true if yes, false if no
  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  _partitionTodoLists(todoLists) {
    let undone = [];
    let done = [];

    todoLists.forEach(todoList => {
      if (this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    });

    return undone.concat(done);
  }

  // Returns a promise that resolves to a sorted list 
  // of all the todo lists and their todos. The list is 
  // sorted by completion status and title (case-insensitive).
  // The todos in the list are unsorted. 
  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists WHERE username = $1 ORDER BY lower(title) ASC";
    const FIND_TODOS = "SELECT * FROM todos WHERE username = $1";

    let resultTodoLists = dbQuery(ALL_TODOLISTS, this.username);
    let resultTodos = dbQuery(FIND_TODOS, this.username);
    let resultBoth = await Promise.all([resultTodoLists, resultTodos]);

    let allTodoLists = resultBoth[0].rows;
    let allTodos = resultBoth[1].rows;
    if (!allTodoLists || !allTodos) return undefined;

    allTodoLists.forEach(todoList => {
      todoList.todos = allTodos.filter(todo => {
        return todoList.id === todo.todolist_id;
      });
    });

    return this._partitionTodoLists(allTodoLists);

    // let todoLists = deepCopy(this._todoLists);
    // let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
    // let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
    // return sortTodoLists(undone, done);
  }

  // Returns a promise that resolves to a sorted list of all 
  // the todos in the specified todo list. The list is sorted 
  // by completion status and title (case-insensitive).
  async sortedTodos(todoList) {
    let todoListId = todoList.id;
    const SORTED_TODOS = `SELECT * FROM todos 
                        WHERE todolist_id = $1 
                        AND username = $2
                        ORDER BY done ASC, lower(title) ASC`;


    let results = await dbQuery(SORTED_TODOS, todoListId, this.username);
    return results.rows;
  }

  // Returns a promise that resolves to the todo list with the specified ID. 
  // The todo list contains the todos for that list. The todos are not sorted. 
  // The Promise resolves to `undefined` if the todo list is not found. 
  async loadTodoList(todoListId) {
    const FIND_TODO_LIST = `SELECT * FROM todolists WHERE id = $1 AND username = $2`;
    const FIND_TODOS = `SELECT * FROM todos WHERE todolist_id = $1 AND username = $2`;

    let resultTodoList = dbQuery(FIND_TODO_LIST, todoListId, this.username);
    let resultTodos = dbQuery(FIND_TODOS, todoListId, this.username);
    let resultBoth = await Promise.all([resultTodoList, resultTodos]);

    let todoList = resultBoth[0].rows[0];
    if (!todoList) return undefined;

    todoList.todos = resultBoth[1].rows;
    return todoList;

    // let todoListResult = await dbQuery(FIND_TODO_LIST, todoListId);
    // let todoList = todoListResult.rows;

    // let todosResult = await dbQuery(FIND_TODOS, todoListId);
    // todoList.todos = todosResult.rows;

    // return todoList;
  }

  // Returns a copy of the indicated todo in the indicated todo list.
  // Returns `undefined` if either the todo list or the todo is not found. 
  // Note that both IDs must be numeric.
  async loadTodo(todoListId, todoId) {
    const FIND_TODO = `SELECT * FROM todos WHERE todolist_id = $1 AND id = $2 AND username = $3`;
    let result = await dbQuery(FIND_TODO, todoListId, todoId, this.username);

    return result.rows[0];
  }

  // Toggle a todo between the done and not done state. 
  // Returns a promise that resolves to `true` on success, 
  // `false` if the todo or todo list doesn't exist. 
  // The id arguments must both be numeric.
  async toggleDoneTodo(todoListId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = NOT done " + 
                        "WHERE todolist_id = $1 AND id = $2 " +
                        "AND username = $3";
    let result = await dbQuery(TOGGLE_DONE, todoListId, todoId, this.username);

    return result.rowCount > 0;
    
    // My attempt: 
    // let query = `SELECT done FROM todos WHERE todolist_id = $1 AND id = $2`;
    // let queryResult = await dbQuery(query, todoListId, todoId);
    // let queryValue = queryResult.rows[0].done;

    // let newValue = queryValue ? 'f' : 't';

    // let updateStatement = `UPDATE todos 
    //                  SET done = $1
    //                  WHERE todolist_id = $2 AND id = $3`;
    
    // await dbQuery(updateStatement, newValue, todoListId, todoId);

    // return true;
  }

  // Delete the specified todo from the specified todo list.
  // Returns a promise that resolves to `true` on success, 
  // `false` if the todo or todo list doesn't exist. 
  // The id arguments must be numeric. 
  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE todolist_id = $1 AND id = $2 AND username = $3";
    let result = await dbQuery(DELETE_TODO, todoListId, todoId, this.username);
    return result.rowCount > 0;
  }

  // Marks all todos on the todo list as done. 
  // Returns a promise that resolves to `true` on success, 
  // `false` if the todo list doesn't exist
  // The todo list ID must be numeric. 
  async completeAllTodos(todoListId) {
    const COMPLETE_ALL_TODOS = "UPDATE todos SET done = true WHERE todolist_id = $1 AND username = $2";
    let result = await dbQuery(COMPLETE_ALL_TODOS, todoListId, this.username);

    return result.rowCount > 0;
  }

  // Creates a new todo with the specified title and add it to the specified todo list
  // Returns a promise that resolves to `true` if success, 
  // `false` if the todo list doesn't exist
  // The todo list id must be numeric
  async createNewTodo(todoListId, title) {
    const CREATE_TODO = "INSERT INTO todos (todolist_id, title, username) " + 
                        "VALUES($1, $2, $3)";
    
    try {
      let result = await dbQuery(CREATE_TODO, todoListId, title, this.username);
      return result.rowCount > 0;
    } catch(error) {
      if (this.isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  // Deletes the specified todo list from the list of todo lists. 
  // Returns a Promise that resolves to `true` if success, 
  // `false` if the specified todo list doesn't exist
  // The todo list id argument must be numeric. 
  async deleteTodoList(todoListId) {
    const DELETE_TODO_LIST = "DELETE FROM todolists WHERE id = $1 AND username = $2";
    let result = await dbQuery(DELETE_TODO_LIST, todoListId, this.username);
    
    return result.rowCount > 0;
  }

  // Returns `true` if `error` seems to indicate a `UNIQUE` 
  // constraint violation, `false` otherwise. 
  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  // Updates the title of the specified todo list. 
  // Returns a Promise that resolves to `true` if success, 
  // `false` if the todo list doesn't exist
  // The todo list id argument must be numeric
  async setTodoListTitle(todoListId, title) {
    const UPDATE_TITLE = "UPDATE todolists SET title = $1 WHERE id = $2 AND username = $3";
    let result = await dbQuery(UPDATE_TITLE, title, todoListId, this.username);
    return result.rowCount > 0;
  }

  // Returns a Promise that resolves to `true` if a todo list 
  // with the specified title exists in the list of todo lists,0
  // `false` otherwise.
  async existsTodoListTitle(title) {
    const FIND_TODO_LIST = "SELECT null FROM todolists WHERE title = $1 AND username = $2";
    let result = await dbQuery(FIND_TODO_LIST, title, this.username);
    return result.rowCount > 0;
  }
};