const mysql = require("mysql");

// Create a connection to the database
const dbConnection = mysql.createConnection({
  host: "db-mysql-nyc1-44248-do-user-14618823-0.b.db.ondigitalocean.com",
  port : "25060",
  user: "doadmin",
  password: "123.123.",
  database: "defaultdb",
  ssl: true
});


dbConnection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to the database");
  }
});

class UserModel {
  static getUserById(userId, callback) {
    const getUserQuery = `
      SELECT * FROM users
      WHERE id = ?
    `;

    dbConnection.query(getUserQuery, [userId], callback);
  }

  static updateUserToken(email, token, callback) {
    const updateTokenQuery = `
      UPDATE users
      SET token = ?
      WHERE email = ?
    `;
  
    dbConnection.query(updateTokenQuery, [token, email], callback);
  }
  

  static deleteUserById(userId, callback) {
    const deleteUserQuery = `
      DELETE FROM users
      WHERE id = ?
    `;

    dbConnection.query(deleteUserQuery, [userId], callback);
  }

  static getUserByEmail(email, callback) {
    const getUserByEmailQuery = `
      SELECT * FROM users
      WHERE email = ?
    `;

    dbConnection.query(getUserByEmailQuery, [email], callback);
  }

  static insertUserInfo(values, callback) {
    const userInfoQuery = `
      INSERT INTO users (photoUrl, fullName, number, gender, birthdate, nationality, city, password, email, token, verify)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    dbConnection.query(userInfoQuery, values, callback);
  }


  }


module.exports = UserModel;
