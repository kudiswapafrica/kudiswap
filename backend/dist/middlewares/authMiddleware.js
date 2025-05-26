"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generateToken_1 = require("../utils/generateToken");
const authMiddleware = (req, res, next) => {
    const token = req.body.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }
    const decodedToken = (0, generateToken_1.verifyToken)(token);
    if (!decodedToken) {
        return res.status(403).json({ message: "Forbidden - Invalid or Expired Token" });
    }
    req.user = decodedToken;
    next();
};
exports.default = authMiddleware;
