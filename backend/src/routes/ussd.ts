import expresss from "express";
import { StrongPin, hashPin } from "../utils/methods";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = expresss.Router();

router.post("/ussd", async (req, res) => {
  const { phoneNumber, text } = req.body;
  const userInputs = text.split("*");
  const step = userInputs.length;

  let response;

  if (text === "") {
    const existingUser = await prisma.user.findUnique({
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
    } else {
      response = `CON Welcome to Kudiswap! \nPlease create a 6-digit PIN`;
    }
  } else if (text === "1") {
    response = `CON 1.  Send STRK \n 2.  Send USDT`;
  } else if (text === "1*1") {
    response = `CON Enter Phone Number`;
  } else if (step === 3 && userInputs[0] === "1" && userInputs[1] === "1") {
    response = `CON Enter STRK Amount`;
  } else if (step === 4 && userInputs[0] === "1" && userInputs[1] === "1") {
    const recipientPhone = userInputs[2];
    const amount = parseFloat(userInputs[3]);
    const toNaira = amount * 1700;
    if (isNaN(amount) || amount <= 0) {
      response = `END Invalid amount. Please start over.`;
    } else {
      response = `CON Send to ${recipientPhone} \n ${amount} STRK (${toNaira.toLocaleString()} NGN) \n\n\n Enter pin to send `;
    }
  } else if (step === 1 && text !== "1") {
    const pin = userInputs[0];

    if (!StrongPin(pin)) {
      response = `END Weak PIN! 
            Avoid 1234, sequential or repeated digits.
            Try a stronger 6-digit PIN`;
    } else {
      response = `CON Repeat pin`;
    }
  } else if (step === 2) {
    const pin = userInputs[0];
    const confirmPin = userInputs[1];

    if (pin !== confirmPin) {
      response = `END PINs do not match.
        Please start over.`;
    } else {
      const hashedPin = await hashPin(pin);
      await prisma.user.create({
        data: {
          phoneNumber: phoneNumber,
          pin: hashedPin,
        },
      });
      response = `END Success! \n
      Your Starknet Address has been created, you will get an SMS shortly`;
    }
  }

  res.set("Content-Type", "text/plain");
  return res.send(response);
});

export default router;
