const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// POST route to handle gho-transfer
app.post("/gho-transfer", (req, res) => {
  const body = req.body;
  // Process the body or perform actions as required
  console.log(body); // For demonstration

  res.status(200).send("Transfer data received");
});

app.listen(4000, () => {
  console.log("Running on port 4000");
});
