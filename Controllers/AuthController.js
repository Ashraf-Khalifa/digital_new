const bcrypt = require("bcrypt");
const crypto = require("crypto");
const EmailModel = require("../Models/EmailModel");
const UserModel = require("../Models/UserModel");

function generateToken(length) {
  const bytes = crypto.randomBytes(Math.ceil(length / 2));
  return bytes.toString("hex").slice(0, length);
}
function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}
class AuthController {
  static async sendOTP(req, res) {
    const { email } = req.body;

    // Check if the email is provided and is a valid email format
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    // Generate a fixed OTP for demonstration purposes
    const otp = "123456";

    // Insert the email and OTP into the 'email' table
    EmailModel.insertEmail(email, otp, (err, emailResult) => {
      if (err) {
        console.error("Database Error:", err);
        return res
          .status(500)
          .json({ message: "Error inserting email and OTP" });
      }

      return res.json({ message: "OTP Sent Successfully" });
    });
  }

  static async verifyOTP(req, res) {
    const { otp } = req.body;

    // Query the 'email' table to verify OTP
    EmailModel.getEmailByOTP(otp, (err, emailResults) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "An error occurred" });
      }

      if (emailResults.length === 0) {
        return res.status(401).json({ message: "Email verification failed" });
      }

      return res.status(200).json({ message: emailResults[0] });
    });
  }

  static async signup(req, res) {
    console.log("Request received for /signup");
    try {
      const {
        photoUrl,
        fullName,
        number,
        gender,
        birthdate,
        nationality,
        city,
        password,
        email,
      } = req.body;

      if (!fullName || !password) {
        throw new Error("All fields must be filled");
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const token = generateToken(20);

      // Update the 'email' table with the token and set verify to 1
      EmailModel.updateEmailToken(email, token, (err, infoResults) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({ message: "Error inserting user info" });
        }

        return res
          .status(200)
          .json({ message: "Generated token is inserted successfully" });
      });

      const userInfoQuery = `
        INSERT INTO users (photoUrl, fullName, number, gender, birthdate, nationality, city, password, email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        photoUrl,
        fullName,
        number,
        gender,
        birthdate,
        nationality,
        city,
        hash,
        email,
      ];

      UserModel.insertUserInfo(values, (err, infoResults) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({ message: "Error inserting user info" });
        }
      });
    } catch (error) {
      console.error("Error:", error);
      return res
        .status(500)
        .json({ message: "An error occurred", error: error.message });
    }
  }

  static async login(req, res) {
    console.log("Request received for /login");
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const getUserQuery = `
      SELECT id, email, password, fullName, photoUrl, number, gender, birthdate, nationality, city
      FROM users
      WHERE email = ? 
    `;

    UserModel.getUserByEmail(email, async (err, results) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "An error occurred" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = generateToken(20);

      // Update the 'email' table with the token and set verify to 1
      EmailModel.updateEmailToken(email, token, (err, infoResults) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({ message: "Error inserting user info" });
        }
      });

      return res.status(200).json({ message: "Login successful", token, user });
    });
  }

  static async logout(req, res) {
    const { token } = req.body;

    // Update the 'email' table to clear the token and set verify to 0
    EmailModel.clearEmailToken(token, (err, infoResults) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "Error logout failed" });
      }
      if (infoResults.changedRows === 0) {
        return res.status(400).json({ message: "Wrong token" });
      }
      return res.status(200).json({ message: "Logout successful" });
    });
  }

  static async token(req, res) {
    const { token } = req.body;

    // Query the 'email' table to find the associated email
    EmailModel.getEmailByToken(token, (err, infoResults) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "Error retrieving user email" });
      }
      if (infoResults.length === 0) {
        return res.status(200).json({ message: "New user, no token found" });
      }

      const email = infoResults[0].email;

      // Query the 'users' table to retrieve user details by email
      UserModel.getUserByEmail(email, (err, results) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({ message: "An error occurred" });
        }

        const user = results[0];

        const newToken = generateToken(20);

        // Update the 'email' table with the new token and set verify to 1
        EmailModel.updateEmailToken(email, newToken, (err, infoResults) => {
          if (err) {
            console.error("Database Error:", err);
            return res
              .status(500)
              .json({ message: "Error inserting user info" });
          }

          console.log("Generated token is inserted successfully");
        });

        return res
          .status(200)
          .json({ message: "Login successful", newToken, user });
      });
    });
  }
}

module.exports = AuthController;
