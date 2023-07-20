const { Client } = require('pg');
module.exports = {
  // Accepts a SQL statement and an array of any query parameters that should be used
  // withing the SQL statement
  async dbQuery(statement, ...parameters) {
    const client = new Client({ database: 'todo-lists' });
    await client.connect();

    let result = await client.query(statement, parameters);

    await client.end();

    return result;
  }
}