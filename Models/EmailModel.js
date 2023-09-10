const mysql = require("mysql");

// Create a connection to the database
// const dbConnection = mysql.createConnection({
//   host: "db-mysql-nyc1-44248-do-user-14618823-0.b.db.ondigitalocean.com",
//   port: "25060",
//   user: "doadmin",
//   password: "123.123.",
//   database: "defaultdb",
//   ssl: true,
// });
const dbConnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sql_register",
});
// username = doadmin
// password = AVNS_rKIVRu72xr-tbkqt4zi

// host = db-mysql-nyc1-44248-do-user-14618823-0.b.db.ondigitalocean.com
// port = 25060
// database = defaultdb
// sslmode = REQUIRED

dbConnection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to the database");
  }
});

class EmailModel {
  static insertEmail(email, otp, callback) {
    const emailInsertQuery = `
      INSERT INTO email (email, otp)
      VALUES (?, ?)
    `;

    dbConnection.query(emailInsertQuery, [email, otp], callback);
  }

  static getEmailByOTP(otp, callback) {
    const checkEmailQuery = `
      SELECT email FROM email WHERE otp = ?
    `;

    dbConnection.query(checkEmailQuery, [otp], callback);
  }

  static updateEmailToken(email, token, callback) {
    const updateTokenQuery = `
      UPDATE users
      SET token = ?, verify = 1
      WHERE email = ?
    `;

    dbConnection.query(updateTokenQuery, [token, email], callback);
  }

  static clearEmailToken(token, callback) {
    const clearTokenQuery = `
      UPDATE users
      SET token = NULL, verify = 0
      WHERE token = ?
    `;

    dbConnection.query(clearTokenQuery, [token], callback);
  }

  static getEmailByToken(token, callback) {
    const searchEmailQuery = `
      SELECT email FROM users
      WHERE token = ?
    `;

    dbConnection.query(searchEmailQuery, [token], callback);
  }
}

module.exports = EmailModel;
