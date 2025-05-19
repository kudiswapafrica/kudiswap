import { Request, Response, NextFunction } from "express";


class AppError extends Error {
    status: number;
    
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}


const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || 500;
    const responseMessage = err.message || "Internal Server Error";

    console.error(`[Error ${statusCode}]: ${responseMessage}`);
    res.status(statusCode).json({ message: responseMessage });
};

export { AppError, errorHandler };