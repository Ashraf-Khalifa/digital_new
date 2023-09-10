const bcrypt = require("bcrypt");
const crypto = require("crypto");
const EmailModel = require("../Models/EmailModel");
const UserModel = require("../Models/UserModel");

// Store temporary tokens (temporary emails) in memory
const temporaryTokens = new Map();

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

    // Generate a temporary token (temporary email) for OTP purposes
    const temporaryToken = generateToken(20);

    // Store the temporary token in memory
    temporaryTokens.set(temporaryToken, email);

    // Generate a fixed OTP for demonstration purposes
    const otp = "123456";

    // Send the OTP to the temporary token (temporary email)
    // For demonstration purposes, I'll just log the OTP
    console.log(`OTP for email ${temporaryToken}: ${otp}`);

    // Return the temporary token in the response
    return res.json({ message: "OTP Sent Successfully", temporaryToken });
  }

  static async verifyOTP(req, res) {
    const { otp, temporaryToken } = req.body;

    // Check if the OTP and temporary token match for the same email
    if (temporaryTokens.has(temporaryToken) && otp === "123456") {
      // Remove the used temporary token from memory
      const email = temporaryTokens.get(temporaryToken);
      temporaryTokens.delete(temporaryToken);

      return res.status(200).json({ message: "OTP verification successful", email });
    }

    return res.status(401).json({ message: "OTP verification failed" });
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
        return res.status(400).json({
          data: null,
          success: false,
          errors: {
            password: "Email or password are empty",
          },
        });
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const token = generateToken(20);

      // Set the 'verify' field to 1
      const verify = 1;

      const userInfoQuery = `
        INSERT INTO users (photoUrl, fullName, number, gender, birthdate, nationality, city, password, email, token, verify)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        token,
        verify, // Set 'verify' to 1
      ];

      UserModel.insertUserInfo(values, (err, infoResults) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({
            data: null,
            success: false,
            errors: {
              database: "Please verify your password and email",
            },
          });
        }

        // Construct the user data to return
        const Data = {
          photoUrl,
          fullName,
          number,
          gender,
          birthdate,
          nationality,
          city,
          email,
          token,
        };

        // Return a success message along with the user data and token
        return res.status(200).json({
          data: Data,
          success: true,
          errors: {},
        });
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
      return res.status(400).json({
        data: null,
        success: false,
        errors: {
          authentication: "Email or password are empty",
        },
      });
    }
  
    const getUserQuery = `
      SELECT email, password, fullName, photoUrl, number, gender, birthdate, nationality, city
      FROM users
      WHERE email = ? 
    `;
  
    UserModel.getUserByEmail(email, async (err, results) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({
          data: null,
          success: false,
          errors: {
            database: "app.database_error",
          },
        });
      }
  
      if (results.length === 0) {
        return res.status(401).json({
          data: null,
          success: false,
          errors: {
            authentication: "app.invalid_email_password",
          },
        });
      }
  
      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({
          data: null,
          success: false,
          errors: {
            authentication: "app.invalid_email_password",
          },
        });
      }
  
      const token = generateToken(20);
  
      // Update the 'email' table with the token and set verify to 1
      EmailModel.updateEmailToken(email, token, (err, infoResults) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({
            data: null,
            success: false,
            errors: {
              database: "Please verify your password and email",
            },
          });
        }
  
        // Update the user object with the new token
        user.token = token;
  
        // Exclude the 'id' field from the user object
        delete user.id;
  
        return res.status(200).json({
          data: user, // You can send the user object as data
          success: true,
          errors: {},
        });
      });
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
