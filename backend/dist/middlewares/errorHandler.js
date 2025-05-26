"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const responseMessage = err.message || "Internal Server Error";
    console.error(`[Error ${statusCode}]: ${responseMessage}`);
    res.status(statusCode).json({ message: responseMessage });
};
exports.errorHandler = errorHandler;
