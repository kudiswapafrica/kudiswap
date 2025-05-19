import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "defaultSecret";

export const generateToken = (phoneNumber: string): string => {
    const token = jwt.sign({ phone: phoneNumber }, SECRET_KEY, { expiresIn: "5m" });

    console.log("Generated Token:", token);

    return token;
};


export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
};
