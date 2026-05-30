// Handles validate.
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = [];
      const seen = new Set();

      for (const detail of error.details) {
        const key = `${detail.path.join(".") || "root"}::${detail.message}`;
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        errors.push(detail.message);
      }

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

module.exports = validate;