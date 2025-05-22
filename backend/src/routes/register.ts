import express from "express";
import { generateToken } from "../utils/generateToken";
import { PhoneValidation } from "../utils/phoneValidate";
import { PrismaClient } from "@prisma/client";
import { GenerateWalletAddress, StrongPin, hashPin } from "../utils/methods";


const router = express.Router();
const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
    const {phoneNumber, pin} = req.body;

    // const pinVerified = StrongPin(pin);
    if(!phoneNumber) {
        return res.status(400).json({success: false, message: "Phone number is required"});
    };

    const validate = PhoneValidation(phoneNumber)
    if(validate) {
        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber },
        });

         if (existingUser) {
            return res.status(401).json({success:false, message: 'You already have a wallet linked to this number.'});
        }

        const hashedPin = await hashPin(pin);
        const newUser = await prisma.user.create({
            data: {
            phoneNumber,
            pin:hashedPin,
            },
        });

        const newWallet = await prisma.wallet.create({
            data: {
            userId: newUser.id,
            address: GenerateWalletAddress(), 
            },
        });

        return res.json({success: true, message: 'Registration successful!'});
    }
    
    return res.status(400).json({success: false, message: "Invalid phone number. Use 0xxxxxxxxxx or +234xxxxxxxxxx"})

});

export default router