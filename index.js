require("dotenv").config();
const express = require("express");
const { indexRouter } = require("./routes");
const passport = require("passport");
const jwtStratety = require("./auth/jwt-strategy");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

passport.use(jwtStratety);

app.use("/api", indexRouter);

app.use((err, req, res, next) => {
  console.error(err);
  console.error(err.stack);
  res.status(500).send("500 Server error");
});

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }

  console.log("Server listening on port", PORT);
});
