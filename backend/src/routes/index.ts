import express from "express";
import authentication from "./authentication";
import ussdRoute from "./ussdRouter";
import register from "./register"
import ussd from "./ussd";


const router = express.Router();

router.use("/auth", authentication);
router.use("/auth", register);
router.use("/ussd", ussdRoute);
router.use("/", ussd);


export default router;