require("dotenv").config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const express = require("express");
const routes = require("./routes");

const app = express();

app.use(express.json());

app.use("/", routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Solstice server running on http://localhost:${PORT}`);
});