const path = require("path");
const { newEnforcer } = require("casbin");

const MongoCasbinAdapter = require("./casbinAdapter");
const { ERRORS } = require("../constants/error");
const AppError = require("../utils/appError");

const MODEL_PATH = path.join(__dirname, "casbin", "model.conf");
let enforcerPromise = null;

const initializeEnforcer = async () => {
  if (!enforcerPromise) {
    enforcerPromise = (async () => {
      const adapter = new MongoCasbinAdapter();
      const enforcer = await newEnforcer(MODEL_PATH, adapter);
      enforcer.enableAutoSave(true);
      return enforcer;
    })();
  }
  return enforcerPromise;
};

const getEnforcer = async () => {
  const enforcer = await initializeEnforcer();

  if (!enforcer) {
    throw new AppError(
      ERRORS.CASBIN_NOT_INITIALIZED.message,
      ERRORS.CASBIN_NOT_INITIALIZED.statusCode,
      ERRORS.CASBIN_NOT_INITIALIZED.errorCode
    );
  }

  return enforcer;
};

module.exports = {
  initializeEnforcer,
  getEnforcer
};
