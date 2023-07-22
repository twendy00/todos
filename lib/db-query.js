const config = require("./config");
const { Client } = require('pg');

const isProduction = (config.NODE_ENV === "production");

const CONNECTION = {
  connectionString: config.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,

  // ssl: { rejectUnauthorized: false },
  // we've put rejectUnauthorized is `false` here, because we don't have 
  // any certificates. If this were `true`, the server certificate is
  // verified against the list of supplied CAs. 
  // Our app doesn't have a certificate, so we must supply `false`
  // to the database. Otherwise, we'll get an error. 
  // ssl is the old version to TLS
};

module.exports = {
  // Accepts a SQL statement and an array of any query parameters that should be used
  // withing the SQL statement
  async dbQuery(statement, ...parameters) {
    const client = new Client(CONNECTION);
    await client.connect();

    let result = await client.query(statement, parameters);

    await client.end();

    return result;
  }
}