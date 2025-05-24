"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import KudiCoin from "./kudi-coin"

// Rename the component to WalletConnectionModal
// Update the interface name and props
interface WalletConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  theme: "dark" | "light"
  onWalletConnected: (address: string) => void
}

export default function WalletConnectionModal({
  isOpen,
  onClose,
  theme,
  onWalletConnected,
}: WalletConnectionModalProps) {
  const [step, setStep] = useState<number>(1)
  const [phone, setPhone] = useState<string>("")
  const [pin, setPin] = useState<string>("")
  const [otp, setOtp] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [otpSent, setOtpSent] = useState<boolean>(false)

  const resetForm = () => {
    setStep(1)
    setPhone("")
    setPin("")
    setOtp("")
    setIsLoading(false)
    setOtpSent(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)

      // Simulate OTP being sent when moving to the OTP step
      if (step === 2) {
        setOtpSent(true)
      }
    } else {
      handleConnectWallet()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleConnectWallet = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Generate a random wallet address
      const address = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

      onWalletConnected(address)
      handleClose()
    }, 2000)
  }

  const isNextDisabled = () => {
    if (step === 1) {
      return !phone || phone.length < 10
    } else if (step === 2) {
      return !pin || pin.length !== 4
    } else if (step === 3) {
      return !otp || otp.length !== 6
    }
    return false
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative w-full max-w-sm sm:max-w-md p-4 sm:p-6 rounded-xl shadow-2xl ${
              theme === "dark" ? "bg-gray-900 border border-teal-500/30" : "bg-white border border-teal-200"
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 sm:right-4 top-2 sm:top-4"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="mb-4 sm:mb-6 flex items-center">
              <KudiCoin className="h-6 w-6 sm:h-8 sm:w-8 mr-2" />
              <h2
                className={`text-xl sm:text-2xl font-bold font-orbitron ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                Connect Wallet
              </h2>
            </div>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Step {step} of 3</p>

            <div className="space-y-4 sm:space-y-6 mt-4">
              {/* Form content remains the same but with responsive input classes */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className={`font-space-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`font-space-mono text-sm sm:text-base ${theme === "dark" ? "bg-black/40 border-teal-500/30" : "bg-white border-teal-200"}`}
                    />
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Enter the phone number associated with your wallet
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="pin"
                      className={`font-space-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Enter PIN
                    </Label>
                    <Input
                      id="pin"
                      type="password"
                      placeholder="4-digit PIN"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                      className={`font-space-mono text-sm sm:text-base ${theme === "dark" ? "bg-black/40 border-teal-500/30" : "bg-white border-teal-200"}`}
                    />
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Enter your 4-digit wallet PIN
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="otp"
                      className={`font-space-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Enter OTP
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                      className={`font-space-mono text-sm sm:text-base ${theme === "dark" ? "bg-black/40 border-teal-500/30" : "bg-white border-teal-200"}`}
                    />
                    {otpSent && (
                      <p className={`text-xs ${theme === "dark" ? "text-teal-400" : "text-teal-600"}`}>
                        OTP sent to {phone}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-2">
                      <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        Enter the 6-digit code sent to your phone
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className={`p-0 h-auto font-space-mono text-xs ${theme === "dark" ? "text-teal-400" : "text-teal-600"}`}
                        onClick={() => setOtpSent(true)}
                      >
                        Resend OTP
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={step === 1 ? handleClose : handleBack}
                  className={`${theme === "dark" ? "border-teal-500/30" : "border-teal-200"} w-full sm:w-auto order-2 sm:order-1`}
                >
                  {step === 1 ? "Cancel" : "Back"}
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={isNextDisabled() || isLoading}
                  className={`${
                    theme === "dark"
                      ? "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                      : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                  } text-white w-full sm:w-auto order-1 sm:order-2 text-sm sm:text-base`}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-pulse">Connecting...</span>
                    </>
                  ) : step === 3 ? (
                    "Connect Wallet"
                  ) : (
                    "Next"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
