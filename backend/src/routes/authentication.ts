import express from "express";
import { generateToken } from "../utils/generateToken";

const router = express.Router();

router.post("/token", (req, res) => {
    const {phone} = req.body;

    if(!phone) {
        return res.status(400).json({success: false, message: "Phone number is required"});
    };

    const token = generateToken(phone);
    res.json({success: true, token: token});
});

export default router