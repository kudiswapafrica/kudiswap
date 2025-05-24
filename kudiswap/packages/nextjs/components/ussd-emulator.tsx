"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Battery, Signal, Wifi } from "lucide-react"
import KudiCoin from "./kudi-coin"

interface USSDEmulatorProps {
  active: boolean
  theme: "dark" | "light"
  onWalletCreated: (address: string) => void
}

type USSDScreen = {
  title: string
  content: string
  options: string[]
  input?: string
  inputType?: "text" | "number" | "tel" | "password"
  inputPlaceholder?: string
  footer?: string
}

export default function USSDEmulator({ active, theme, onWalletCreated }: USSDEmulatorProps) {
  const [currentScreen, setCurrentScreen] = useState<USSDScreen>({
    title: "Welcome to KudiSwap",
    content: "*384*17500#",
    options: ["1. Send", "2. Check balance", "3. Withdraw", "4. Swap", "5. Change Pin", "6. View Rates"],
  })

  const [inputValue, setInputValue] = useState("")
  const [animatingText, setAnimatingText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [history, setHistory] = useState<USSDScreen[]>([])
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<string>("")
  const [currentDate, setCurrentDate] = useState<string>("")
  const [sendData, setSendData] = useState({
    token: "",
    phoneNumber: "",
    amount: "",
    pin: "",
  })

  const screens: Record<string, USSDScreen> = {
    initial: {
      title: "",
      content: "*384*17500#",
      options: [],
      footer: "Options                    Cancel",
    },
    main: {
      title: "KudiSwap",
      content: "",
      options: ["1. Send", "2. Check Balance", "3. Withdraw", "4. Swap", "5. Change Pin", "6. View Rates"],
      footer: "Options                    Cancel",
    },
    send: {
      title: "Send",
      content: "",
      options: ["1. Send STRK", "2. Send USDT"],
      footer: "Options                    Cancel",
    },
    sendPhoneNumber: {
      title: "Enter Phone Number",
      content: "",
      input: "",
      inputType: "tel",
      inputPlaceholder: "Enter recipient phone number",
      footer: "Options                    Cancel",
      options: []
    },
    sendAmount: {
      title: "Enter STRK Amount",
      content: "",
      input: "",
      inputType: "number",
      inputPlaceholder: "Enter amount to send",
      footer: "Options                    Cancel",
      options: []
    },
    sendConfirmation: {
      title: "Send to +23481693...",
      content: "26.6 STRK (37,700 NGN)\n\nEnter pin to send",
      input: "",
      inputType: "password",
      inputPlaceholder: "Enter your PIN",
      footer: "Options                    Cancel",
      options: []
    },
    sendSuccess: {
      title: "Process Successful",
      content: "\n\n\n0 returns to Menu",
      options: [],
      footer: "Options                    Cancel",
    },
    balance: {
      title: "Balance",
      content: "STRK: 12.45\nUSDT: 250.00",
      options: ["0. Back", "00. Main Menu"],
      footer: "Options                    Cancel",
    },
    swap: {
      title: "Swap Tokens",
      content: "Select pair:",
      options: ["1. STRK → USDT", "2. USDT → STRK", "0. Back", "00. Main Menu"],
      footer: "Options                    Cancel",
    },
    connectWallet: {
      title: "Connect Wallet",
      content: "Enter your phone number:",
      options: ["0. Back", "00. Main Menu"],
      footer: "Options                    Cancel",
    },
    rates: {
      title: "Current Rates",
      content: "STRK/USDT: 1.24\nUpdated: Just now",
      options: ["0. Back", "00. Main Menu"],
      footer: "Options                    Cancel",
    },
  }

  // Update current time and date
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
      setCurrentDate(
        now.toLocaleDateString([], {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      )
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (active && currentScreen.content && !isTyping) {
      setIsTyping(true)
      setAnimatingText("")

      const typeText = async () => {
        for (let i = 0; i <= currentScreen.content.length; i++) {
          setAnimatingText(currentScreen.content.slice(0, i))
          await new Promise((resolve) => setTimeout(resolve, 30))
        }
        setIsTyping(false)
      }

      typeText()
    }
  }, [currentScreen, active])

  const handleInput = useCallback((input: string) => {
    // Visual feedback for pressed key
    setPressedKey(input)
    setTimeout(() => setPressedKey(null), 150)

    setInputValue((prev) => {
      const newValue = prev + input
      return newValue
    })
  }, [])

  const handleDelete = useCallback(() => {
    setPressedKey("delete")
    setTimeout(() => setPressedKey(null), 150)

    setInputValue((prev) => prev.slice(0, -1))
  }, [])

  const handleSubmit = useCallback(() => {
    setPressedKey("send")
    setTimeout(() => setPressedKey(null), 150)

    const input = inputValue.trim()
    setInputValue("")

    // Save current screen to history
    setHistory((prev) => [...prev, currentScreen])

    // Handle navigation based on current screen
    if (currentScreen.title === "" || currentScreen.title === "Welcome to KudiSwap") {
      // Initial screen with *384*17500#
      setCurrentScreen(screens.main)
    } else if (currentScreen.title === "KudiSwap") {
      // Main menu
      switch (input) {
        case "1":
          setCurrentScreen(screens.send)
          break
        case "2":
          setCurrentScreen(screens.balance)
          break
        case "4":
          setCurrentScreen(screens.swap)
          break
        case "6":
          setCurrentScreen(screens.rates)
          break
        default:
          // Invalid input
          break
      }
    } else if (currentScreen.title === "Send") {
      // Send token selection
      switch (input) {
        case "1":
          setSendData({ ...sendData, token: "STRK" })
          setCurrentScreen(screens.sendPhoneNumber)
          break
        case "2":
          setSendData({ ...sendData, token: "USDT" })
          setCurrentScreen(screens.sendPhoneNumber)
          break
        case "0":
          goBack()
          break
        default:
          // Invalid input
          break
      }
    } else if (currentScreen.title === "Enter Phone Number") {
      // Phone number entry
      if (input === "0") {
        goBack()
      } else if (input.length >= 10) {
        setSendData({ ...sendData, phoneNumber: input })
        setCurrentScreen({
          ...screens.sendAmount,
          title: `Enter ${sendData.token} Amount`,
        })
      }
    } else if (currentScreen.title.startsWith("Enter") && currentScreen.title.includes("Amount")) {
      // Amount entry
      if (input === "0") {
        goBack()
      } else if (input !== "") {
        setSendData({ ...sendData, amount: input })
        const formattedAmount = Number.parseFloat(input).toFixed(1)
        const nairaValue = (Number.parseFloat(input) * 1450).toFixed(0) // Example conversion rate
        setCurrentScreen({
          ...screens.sendConfirmation,
          title: `Send to ${sendData.phoneNumber.substring(0, 10)}...`,
          content: `${formattedAmount} ${sendData.token} (${Number.parseInt(nairaValue).toLocaleString()} NGN)\n\nEnter pin to send`,
        })
      }
    } else if (currentScreen.title.startsWith("Send to")) {
      // PIN entry
      if (input === "0") {
        goBack()
      } else if (input.length === 4) {
        setSendData({ ...sendData, pin: input })
        setCurrentScreen(screens.sendSuccess)
      }
    } else if (currentScreen.title === "Process Successful") {
      // Success screen
      if (input === "0") {
        setCurrentScreen(screens.main)
        setHistory([])
      }
    } else {
      if (input === "0") {
        goBack()
      } else if (input === "00") {
        setCurrentScreen(screens.main)
        setHistory([])
      }
    }
  }, [currentScreen, inputValue, screens, history, sendData])

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const prevScreen = history[history.length - 1]
      setCurrentScreen(prevScreen)
      setHistory((prev) => prev.slice(0, -1))
    } else {
      setCurrentScreen(screens.main)
    }
  }, [history, screens])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!active) return

      if (e.key >= "0" && e.key <= "9") {
        handleInput(e.key)
      } else if (e.key === "*") {
        handleInput("*")
      } else if (e.key === "#") {
        handleInput("#")
      } else if (e.key === "+") {
        handleInput("+")
      } else if (e.key === "Backspace") {
        handleDelete()
      } else if (e.key === "Enter") {
        handleSubmit()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [active, handleInput, handleDelete, handleSubmit])

  const keypadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ]

  // Determine if we should show input field
  const showInputField = currentScreen.inputType !== undefined

  // Mask password input
  const displayInputValue = currentScreen.inputType === "password" ? "•".repeat(inputValue.length) : inputValue

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Responsive Phone frame */}
      <div
        className={`relative w-full max-w-4xl rounded-[20px] sm:rounded-[30px] overflow-hidden shadow-2xl border-4 sm:border-8 ${
          theme === "dark" ? "border-gray-800 bg-gray-900" : "border-gray-300 bg-gray-100"
        }`}
      >
        {/* Phone status bar */}
        <div
          className={`flex justify-between items-center px-2 sm:px-4 py-1 text-xs ${
            theme === "dark" ? "bg-black text-white" : "bg-gray-200 text-black"
          }`}
        >
          <div className="flex items-center">
            <Signal className="h-3 w-3 mr-1" />
            <Signal className="h-3 w-3" />
          </div>
          <div className="flex items-center space-x-2">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <Battery className="h-4 w-4" />
          </div>
        </div>

        {/* Date/Time bar */}
        <div
          className={`text-center text-xs py-1 font-bold ${
            theme === "dark" ? "bg-black text-white" : "bg-gray-200 text-black"
          }`}
        >
          {currentDate}
          <br />
          {currentTime}
        </div>

        {/* Main content - responsive layout */}
        <div
          className={`flex flex-col sm:flex-row ${
            theme === "dark" ? "bg-gradient-to-r from-gray-900 to-black" : "bg-gradient-to-r from-gray-100 to-gray-200"
          }`}
        >
          {/* LCD Screen */}
          <div className="flex-1 p-2 sm:p-3">
            <div
              className={`h-[200px] sm:h-[200px] lg:h-[220px] p-2 sm:p-3 overflow-auto rounded-md font-space-mono text-xs sm:text-sm ${
                theme === "dark"
                  ? "bg-[#1a3c2d] text-[#5dff9b] border border-gray-700 shadow-inner"
                  : "bg-[#c8e0d0] text-[#0a3c1d] border border-gray-400 shadow-inner"
              }`}
              style={{
                fontFamily: "'VT323', monospace",
                lineHeight: "1.3",
                textShadow: theme === "dark" ? "0 0 5px rgba(93, 255, 155, 0.5)" : "none",
              }}
            >
              {/* Screen content remains the same */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col"
                >
                  {currentScreen.title && (
                    <div className="mb-2 font-bold flex items-center">
                      {currentScreen.title === "KudiSwap" && (
                        <KudiCoin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline-block" />
                      )}
                      {currentScreen.title}
                    </div>
                  )}

                  {currentScreen.content && <div className="whitespace-pre-line mb-2">{animatingText}</div>}

                  {showInputField && (
                    <div className="my-2">
                      {displayInputValue}
                      <span className="animate-pulse ml-0.5">_</span>
                    </div>
                  )}

                  {currentScreen.options && currentScreen.options.length > 0 && (
                    <div className="mt-auto">
                      {currentScreen.options.map((option, index) => (
                        <div key={index} className="my-1">
                          {option}
                        </div>
                      ))}
                    </div>
                  )}

                  {!showInputField && inputValue && (
                    <div className="mt-2">
                      <span className="animate-pulse">▶ </span>
                      {inputValue}
                      <span className="animate-pulse ml-0.5">_</span>
                    </div>
                  )}

                  {currentScreen.footer && (
                    <div className="mt-auto text-xs pt-2 border-t border-dashed">{currentScreen.footer}</div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Keypad */}
          <div className="flex-1 p-2 sm:p-3">
            {/* Input field */}
            <div
              className={`p-1 mb-2 rounded-md text-center font-space-mono text-xs sm:text-sm ${
                theme === "dark"
                  ? "bg-[#1a3c2d] text-[#5dff9b] border border-gray-700"
                  : "bg-[#c8e0d0] text-[#0a3c1d] border border-gray-400"
              }`}
              style={{
                fontFamily: "'VT323', monospace",
                textShadow: theme === "dark" ? "0 0 5px rgba(93, 255, 155, 0.5)" : "none",
                height: "24px",
              }}
            >
              {showInputField
                ? displayInputValue || currentScreen.inputPlaceholder || "Enter value..."
                : inputValue || "Enter command..."}
              <span className="animate-pulse ml-0.5">_</span>
            </div>

            {/* Keypad - responsive button sizes */}
            <div className="grid grid-cols-3 gap-1 mb-2">
              {keypadButtons.map((row, rowIndex) =>
                row.map((button, colIndex) => (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleInput(button)}
                    className={`h-8 sm:h-10 text-xs sm:text-sm font-bold rounded-lg ${
                      pressedKey === button
                        ? theme === "dark"
                          ? "bg-gray-600 text-white"
                          : "bg-gray-400 text-black"
                        : theme === "dark"
                          ? "bg-gray-800 text-white hover:bg-gray-700"
                          : "bg-gray-300 text-black hover:bg-gray-400"
                    } transition-colors duration-150 shadow-md`}
                  >
                    {button}
                  </motion.button>
                )),
              )}
            </div>

            {/* Control buttons */}
            <div className="grid grid-cols-2 gap-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                className={`h-8 sm:h-10 text-xs sm:text-sm font-bold rounded-lg ${
                  pressedKey === "delete"
                    ? "bg-red-700 text-white"
                    : theme === "dark"
                      ? "bg-red-900 text-white hover:bg-red-800"
                      : "bg-red-500 text-white hover:bg-red-600"
                } transition-colors duration-150 shadow-md`}
              >
                Delete
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className={`h-8 sm:h-10 text-xs sm:text-sm font-bold rounded-lg ${
                  pressedKey === "send"
                    ? "bg-teal-700 text-white"
                    : theme === "dark"
                      ? "bg-teal-800 text-white hover:bg-teal-700"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                } transition-colors duration-150 shadow-md`}
              >
                Send
              </motion.button>
            </div>
          </div>
        </div>

        {/* Phone bottom bar */}
        <div className={`flex justify-center py-1 sm:py-2 ${theme === "dark" ? "bg-black" : "bg-gray-200"}`}>
          <div className={`w-12 sm:w-16 h-1 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-400"}`}></div>
        </div>
      </div>
    </div>
  )
}
