import express from "express";
import { generateToken } from "../utils/generateToken";
import { PhoneValidation } from "../utils/phoneValidate";

const router = express.Router();

router.post("/validate", (req, res) => {
    const {phone} = req.body;

    if(!phone) {
        return res.status(400).json({success: false, message: "Phone number is required"});
    };

    const validate = PhoneValidation(phone)
    if(validate) {
        const token = generateToken(phone);
        return res.json({success: true, token: token});
    }
    
    return res.status(400).json({success: false, message: "Invalid phone number. Use 0xxxxxxxxxx or +234xxxxxxxxxx"})

});

export default router