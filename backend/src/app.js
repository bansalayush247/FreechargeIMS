const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const routes = require("./routes");
const { getAllowedOrigins } = require("./config/env");

const errorMiddleware = require("./middleware/error");
const notFoundMiddleware = require("./middleware/notFound");
const { contextLogger, requestInputLogger } = require("./middleware/contextLogger");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();
const allowedOrigins = getAllowedOrigins();

app.use(contextLogger);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestInputLogger);

app.set("trust proxy", 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
}));
app.use(helmet());
app.use(rateLimiter());

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
