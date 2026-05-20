const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes");

const errorMiddleware = require("./middleware/error.middleware");
const notFoundMiddleware = require("./middleware/notFound.middleware");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(helmet());

app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy"
  });
});

app.use("/api/v1", routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

module.exports = app;