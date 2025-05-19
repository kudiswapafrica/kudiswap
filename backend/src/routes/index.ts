import authentication from "./authentication";
import ussdRoute from "./ussdRouter";
import express from "express";

const router = express.Router();

router.use("/auth", authentication);
router.use("/ussd", ussdRoute);


export default router;