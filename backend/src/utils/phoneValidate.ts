export function PhoneValidation(phoneNumber:string): boolean{

    phoneNumber = phoneNumber.trim();
    const patterns = [
        /^\+234[0-9]{10}$/,
        /^0[0-9]{10}$/ 
    ]

    return patterns.some(regex => regex.test(phoneNumber))
}

