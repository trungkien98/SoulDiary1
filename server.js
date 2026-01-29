require("dotenv").config();

const app = require("./app");
const database = require("./config/db");

database.connect();

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
