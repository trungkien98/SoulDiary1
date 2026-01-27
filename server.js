require("dotenv").config();

const app = require("./app");
const database = require("./config/db");

database.connect();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api-docs`);
});
