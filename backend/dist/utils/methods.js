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
exports.GenerateWalletAddress = GenerateWalletAddress;
exports.StrongPin = StrongPin;
exports.hashPin = hashPin;
const crypto_1 = require("crypto");
const bcrypt_1 = __importDefault(require("bcrypt"));
function GenerateWalletAddress() {
    return '0x' + (0, crypto_1.randomBytes)(20).toString('hex');
}
function StrongPin(pin) {
    if (!/^\d{6}$/.test(pin))
        return false;
    if (/^(\d)\1{5}$/.test(pin))
        return false;
    const sequentialPins = ['0123', '1234', '2345', '3456', '4567', '5678', '6789',
        '9876', '8765', '7654', '6543', '5432', '4321', '3210'];
    if (sequentialPins.includes(pin))
        return false;
    return true;
}
function hashPin(pin) {
    return __awaiter(this, void 0, void 0, function* () {
        const saltRounds = 10;
        return yield bcrypt_1.default.hash(pin, saltRounds);
    });
}
