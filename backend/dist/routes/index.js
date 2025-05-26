"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = __importDefault(require("./authentication"));
const ussdRouter_1 = __importDefault(require("./ussdRouter"));
const register_1 = __importDefault(require("./register"));
const ussd_1 = __importDefault(require("./ussd"));
const router = express_1.default.Router();
router.use("/auth", authentication_1.default);
router.use("/auth", register_1.default);
router.use("/ussd", ussdRouter_1.default);
router.use("/", ussd_1.default);
exports.default = router;
