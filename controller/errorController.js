const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use unique value.`;
  return new AppError(message, 400);
};

const handleValidatorErrorDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  const message = `Token không hợp lệ! Vui lòng đăng nhập lại`;
  return new AppError(message, 401);
};

const handleJWTExpiredError = () => {
  const message = `Token đã hết hạn! Vui lòng đăng nhập lại`;
  return new AppError(message, 401);
};

const handleAxiosError = () => {
  const message = `Lỗi kết nối tới cổng thanh toán! Vui lòng thử lại sau`;
  return new AppError(message, 500);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("Uncaught error", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong, please try again later",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = Object.create(Object.getPrototypeOf(err));
    Object.assign(error, err);
    error.name = err.name;
    error.message = err.message;
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (error.name === "ValidationError") error = handleValidatorErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    if (error.name === "AxiosError") error = handleAxiosError();

    sendErrorProd(error, res);
  }
};
