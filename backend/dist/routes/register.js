"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const phoneValidate_1 = require("../utils/phoneValidate");
const client_1 = require("@prisma/client");
const methods_1 = require("../utils/methods");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, pin } = req.body;
    // const pinVerified = StrongPin(pin);
    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
    }
    ;
    const validate = (0, phoneValidate_1.PhoneValidation)(phoneNumber);
    if (validate) {
        const existingUser = yield prisma.user.findUnique({
            where: { phoneNumber },
        });
        if (existingUser) {
            return res.status(401).json({ success: false, message: 'You already have a wallet linked to this number.' });
        }
        const hashedPin = yield (0, methods_1.hashPin)(pin);
        const newUser = yield prisma.user.create({
            data: {
                phoneNumber,
                pin: hashedPin,
            },
        });
        const newWallet = yield prisma.wallet.create({
            data: {
                userId: newUser.id,
                address: (0, methods_1.GenerateWalletAddress)(),
            },
        });
        return res.json({ success: true, message: 'Registration successful!' });
    }
    return res.status(400).json({ success: false, message: "Invalid phone number. Use 0xxxxxxxxxx or +234xxxxxxxxxx" });
}));
exports.default = router;
