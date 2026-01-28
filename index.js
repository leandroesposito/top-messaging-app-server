require("dotenv").config();
const express = require("express");
const { indexRouter } = require("./routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", indexRouter);

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }

  console.log("Server listening on port", PORT);
});
