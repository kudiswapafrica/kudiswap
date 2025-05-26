"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const generateToken_1 = require("../utils/generateToken");
const phoneValidate_1 = require("../utils/phoneValidate");
const router = express_1.default.Router();
router.post("/validate", (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
    }
    ;
    const validate = (0, phoneValidate_1.PhoneValidation)(phone);
    if (validate) {
        const token = (0, generateToken_1.generateToken)(phone);
        return res.json({ success: true, token: token });
    }
    return res.status(400).json({ success: false, message: "Invalid phone number. Use 0xxxxxxxxxx or +234xxxxxxxxxx" });
});
exports.default = router;
