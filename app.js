const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Include and use your routes here
const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRoutes");

app.use("/auth", authRoutes);
app.use("/user", userRoutes);

app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
