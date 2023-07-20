// Wrapper for async middleware. Eliminates the need to 
// catch errors. 

// Accepts a handler/async middleware as an argument. 
// Returns a new middleware. Within the new middleware,
// Promise.resolve is invoked with the handler. 
// If the handler fails, then `.catch` is called 
// and the error is dispatched with `next(error)`. 
const catchError = handler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

module.exports = catchError;