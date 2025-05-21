import jwt from "jsonwebtoken";
import { Config } from "../config/config";

const SECRET_KEY = Config.jwtSecret

export const generateToken = (phoneNumber: string): string => {
    const token = jwt.sign({ phone: phoneNumber }, SECRET_KEY!, { expiresIn: "5m" });
    return token;
};


export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, SECRET_KEY!);
    } catch (error) {
        return null;
    }
};
