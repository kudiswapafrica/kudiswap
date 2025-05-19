import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/generateToken";


interface CustomRequest extends Request {
    user?: any;
}

const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.body.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
        return res.status(403).json({ message: "Forbidden - Invalid or Expired Token" });
    }

    req.user = decodedToken; 
    next();
};

export default authMiddleware;