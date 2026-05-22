const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes");

const errorMiddleware = require("./middleware/error");
const notFoundMiddleware = require("./middleware/notFound");
const responseLogger = require("./middleware/responseLogger");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(helmet());

app.use(morgan("dev"));
app.use(responseLogger);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy"
  });
});

app.use("/", routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

module.exports = app;