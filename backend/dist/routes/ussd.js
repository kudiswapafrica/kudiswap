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
const methods_1 = require("../utils/methods");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
router.post("/ussd", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, text } = req.body;
    const userInputs = text.split("*");
    const step = userInputs.length;
    let response;
    if (text === "") {
        const existingUser = yield prisma.user.findUnique({
            where: { phoneNumber },
        });
        if (existingUser) {
            response = `CON KudiSwap \n 
            1.  Send \n
            2.  Check Balance \n
            3.  Withdraw \n
            4.  Swap \n
            5.  Change Pin \n
            6.  View Rates`;
        }
        else {
            response = `CON Welcome to Kudiswap! \nPlease create a 6-digit PIN`;
        }
    }
    else if (text === "1") {
        response = `CON 1.  Send STRK \n 2.  Send USDT`;
    }
    else if (text === "1*1") {
        response = `CON Enter Phone Number`;
    }
    else if (step === 3 && (userInputs[0] === "1" && userInputs[1] === "1")) {
        response = `CON Enter STRK Amount`;
    }
    else if (step === 4 && (userInputs[0] === "1" && userInputs[1] === "1")) {
        const recipientPhone = userInputs[2];
        const amount = parseFloat(userInputs[3]);
        const toNaira = amount * 1700;
        if (isNaN(amount) || amount <= 0) {
            response = `END Invalid amount. Please start over.`;
        }
        else {
            response = `CON Send to ${recipientPhone} \n ${amount} STRK (${toNaira.toLocaleString()} NGN) \n\n\n Enter pin to send `;
        }
    }
    else if (step === 1 && text !== "1") {
        const pin = userInputs[0];
        if (!(0, methods_1.StrongPin)(pin)) {
            response = `END Weak PIN! 
            Avoid 1234, sequential or repeated digits.
            Try a stronger 6-digit PIN`;
        }
        else {
            response = `CON Repeat pin`;
        }
    }
    else if (step === 2) {
        const pin = userInputs[0];
        const confirmPin = userInputs[1];
        if (pin !== confirmPin) {
            response = `END PINs do not match.
        Please start over.`;
        }
        else {
            const hashedPin = yield (0, methods_1.hashPin)(pin);
            yield prisma.user.create({
                data: {
                    phoneNumber: phoneNumber,
                    pin: hashedPin,
                }
            });
            response = `END Success! \n
      Your Starknet Address has been created, you will get an SMS shortly`;
        }
    }
    res.set("Content-Type", "text/plain");
    return res.send(response);
}));
exports.default = router;
