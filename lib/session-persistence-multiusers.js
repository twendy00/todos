const SeedData = require("./seed-data");
const deepCopy = require("./deep_copy");
const { sortTodoLists, sortTodos } = require("./sort");
const nextId = require("./next-id");

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists;
  }

  // Create a new todo list with the specified title and 
  // add it to the list of todo lists. 
  // Returns `true` on success, `false` on failure
  // Not known failure conditions at this time
  createTodoList(title) {
    this._todoLists.push({
      id: nextId(),
      title,
      todos: []
    });
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

  // Return the list of todo lists sorted by completion status and title
  // (case-insensitive)
  sortedTodoLists() {
    let todoLists = deepCopy(this._todoLists);
    let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
    let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
    return sortTodoLists(undone, done);
  }

  // Returns a copy of the list of todos in the indicated todo list by sorted by
  // completion status and title (case-insensitive).
  sortedTodos(todoList) {
    let todos = todoList.todos;
    let undone = todos.filter(todo => !todo.isDone);
    let done = todos.filter(todo => todo.isDone);
    return deepCopy(sortTodos(undone, done));
  }

  // Find a todo list with the indicated ID. Returns `undefined` if not found.
  // Note that `todoListId` must be numeric.
  loadTodoList(todoListId) {
    let todoList = this._findTodoList(todoListId);
    return deepCopy(todoList);
  }

  // Returns a copy of the indicated todo in the indicated todo list.
  // Returns `undefined` if either the todo list or the todo is not found. 
  // Note that both IDs must be numeric.
  loadTodo(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    return deepCopy(todo);
  }

  // Toggle a todo between the done and not done state. 
  // Returns `true` on success, `false` if the todo or todo list doesn't exist. 
  // The id arguments must both be numeric.
  toggleDoneTodo(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    if (!todo) return false;

    todo.done = !todo.done;
    return true;
  }

  // Delete the specified todo from the specified todo list.
  // Returns `true` on success, `false` if the todo or todo list doesn't exist. 
  // The id arguments must be numeric. 
  deleteTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    let todoIndex = todoList.todos.findIndex(todo => todo.id === todoId);
    if (todoIndex === -1) return false;

    todoList.todos.splice(todoIndex, 1);
    return true;
  }

  // Marks all todos on the todo list as done. 
  // Returns `true` on success, `false` if the todo list doesn't exist
  // The todo list ID must be numeric. 
  completeAllTodos(todoListId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    todoList.todos.filter(todo => !todo.done)
                  .forEach(todo => (todo.done = true));

    return true;
  }

  // Creates a new todo with the specified title and add it to the specified todo list
  // Returns `true` if success, `false` if the todo list doesn't exist
  // The todo list id must be numeric
  createNewTodo(todoListId, title) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    todoList.todos.push({ id: nextId(), title, done: false });
    return true;
  }

  // Deletes the specified todo list from the list of todo lists. 
  // Returns `true` if success, `false` if the specified todo list doesn't exist
  // The todo list id argument must be numeric. 
  deleteTodoList(todoListId) {
    let todoListIndex = this._todoLists.findIndex(todoList => {
      return todoList.id === todoListId;
    });

    if (todoListIndex === -1) return false;

    this._todoLists.splice(todoListIndex, 1);
    return true;
  }

  // Updates the title of the specified todo list. 
  // Returns `true` if success, `false` if the todo list doesn't exist
  // The todo list id argument must be numeric
  setTodoListTitle(todoListId, title) {
    let todoList = this._findTodoList(todoListId);

    if (!todoList) return false;

    todoList.title = title;
    return true;
  }

  // Returns `true` if a todo list with the specified title exists in the list of todo lists, `false` otherwise.
  existsTodoListTitle(title) {
    return this._todoLists.some(todoList => todoList.title === title);
  }

  // Returns a reference to the todo list with the indicated ID. 
  // Returns `undefined` if not found. Note that `todoListId` must be numeric. 
  _findTodoList(todoListId) {
    return this._todoLists.find(todoList => todoList.id === todoListId);
  }

  // Returns a reference to the indicated todo in the indicated todo list. 
  // Returns `undefined` if either the todo list or the todo is not found.
  // Note that both IDs must be numeric. 
  _findTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return undefined;

    return todoList.todos.find(todo => todo.id === todoId);
  }

  // Returns `true` if `error` seems to indicate a `UNIQUE` constraint
  // violation, `false` otherwise. 
  isUniqueConstraintViolation(_error) {
    return false;
  }
};