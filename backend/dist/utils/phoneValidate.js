"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneValidation = PhoneValidation;
function PhoneValidation(phoneNumber) {
    phoneNumber = phoneNumber.trim();
    const patterns = [
        /^\+234[0-9]{10}$/,
        /^0[0-9]{10}$/
    ];
    return patterns.some(regex => regex.test(phoneNumber));
}
