"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowDown, RefreshCw } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useToast } from "../hooks/use-toast"

interface SwapCardProps {
  theme: "dark" | "light"
}

export default function SwapCard({ theme }: SwapCardProps) {
  const [fromAmount, setFromAmount] = useState<string>("")
  const [toAmount, setToAmount] = useState<string>("")
  const [fromToken, setFromToken] = useState<string>("STRK")
  const [toToken, setToToken] = useState<string>("USDT")
  const [rate, setRate] = useState<number>(1.24)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    // Calculate to amount based on from amount and rate
    if (fromAmount) {
      const amount = Number.parseFloat(fromAmount)
      if (!isNaN(amount)) {
        if (fromToken === "STRK" && toToken === "USDT") {
          setToAmount((amount * rate).toFixed(2))
        } else {
          setToAmount((amount / rate).toFixed(6))
        }
      }
    } else {
      setToAmount("")
    }
  }, [fromAmount, fromToken, toToken, rate])

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
  }

  const handleSwap = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Swap Successful",
        description: `Swapped ${fromAmount} ${fromToken} to ${toAmount} ${toToken}`,
        className: `font-space-mono ${theme === "dark" ? "bg-black/80 border-teal-500 text-teal-400" : "bg-white border-teal-500 text-teal-600"}`,
      })
      setFromAmount("")
      setToAmount("")
    }, 1500)
  }

  const refreshRate = () => {
    // Simulate rate refresh
    setRate((prevRate) => {
      const newRate = prevRate + (Math.random() * 0.1 - 0.05)
      return Number.parseFloat(newRate.toFixed(4))
    })
  }

  return (
    <div className="flex flex-col flex-1 justify-between">
      <div className="space-y-4 sm:space-y-6">
        {/* From Token */}
        <div className="space-y-2">
          <div className="flex justify-between items-start sm:items-center">
            <Label
              htmlFor="from-amount"
              className={`font-space-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
            >
              From
            </Label>
            <button
              onClick={refreshRate}
              className={`text-xs flex items-center ${theme === "dark" ? "text-teal-400" : "text-teal-600"} mt-1 sm:mt-0`}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Rate: </span>1 STRK = {rate} USDT
            </button>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex-1">
              <Input
                id="from-amount"
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className={`font-space-mono text-base sm:text-lg ${theme === "dark" ? "bg-black/40 border-teal-500/30" : "bg-white border-teal-200"}`}
              />
            </div>
            <Select value={fromToken} onValueChange={setFromToken}>
              <SelectTrigger
                className={`w-full sm:w-28 ${theme === "dark" ? "bg-black/40 border-teal-500/30" : "bg-white border-teal-200"}`}
              >
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRK">STRK</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center py-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSwapTokens}
            className={`p-2 sm:p-3 rounded-full ${theme === "dark" ? "bg-gray-800 text-teal-400 hover:bg-gray-700" : "bg-gray-200 text-teal-600 hover:bg-gray-300"}`}
          >
            <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <Label
            htmlFor="to-amount"
            className={`font-space-mono text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
          >
            To
          </Label>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex-1">
              <Input
                id="to-amount"
                type="number"
                placeholder="0.00"
                value={toAmount}
                readOnly
                className={`font-space-mono text-base sm:text-lg ${theme === "dark" ? "bg-black/40 border-teal-500/30" : "bg-white border-teal-200"}`}
              />
            </div>
            <Select value={toToken} onValueChange={setToToken}>
              <SelectTrigger
                className={`w-full sm:w-28 ${theme === "dark" ? "bg-black/40 border-teal-500/30" : "bg-white border-teal-200"}`}
              >
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRK">STRK</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <Button
        onClick={handleSwap}
        disabled={!fromAmount || isLoading || Number.parseFloat(fromAmount) <= 0}
        className={`w-full font-space-mono mt-4 sm:mt-6 text-sm sm:text-base ${
          theme === "dark"
            ? "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
            : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
        }`}
      >
        {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
        {isLoading ? "Swapping..." : "Swap"}
      </Button>
    </div>
  )
}
