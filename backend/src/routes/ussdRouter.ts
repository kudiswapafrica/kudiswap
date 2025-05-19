import express from "express";
import authMiddleware from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/protected", authMiddleware, (req, res) =>{
     res.json({ success: true, message: "Access granted" });
});

export default router;
