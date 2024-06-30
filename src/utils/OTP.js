const generatedOTPs = new Set();
const otpExpiryTime = 5 * 60 * 1000; // OTP valid for 5 minutes

function generateUnique4DigitOTP() {
    let otp;
    do {
        otp = Math.floor(1000 + Math.random() * 9000); // Ensures a 4-digit number between 1000 and 9999
    } while (generatedOTPs.has(otp));
    generatedOTPs.add(otp);
    
    // Set a timeout to remove the OTP after expiry time
    setTimeout(() => {
        generatedOTPs.delete(otp);
    }, otpExpiryTime);
    
    return otp;
}

export default generateUnique4DigitOTP;