"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

interface RateDisplayProps {
  theme: "dark" | "light"
}

export default function RateDisplay({ theme }: RateDisplayProps) {
  const [rate, setRate] = useState<number>(1.24)
  const [history, setHistory] = useState<number[]>([1.22, 1.23, 1.24, 1.25, 1.23, 1.24])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [lastUpdated, setLastUpdated] = useState<string>("Just now")

  const refreshRate = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const newRate = rate + (Math.random() * 0.1 - 0.05)
      const roundedRate = Number.parseFloat(newRate.toFixed(4))
      setRate(roundedRate)
      setHistory((prev) => [...prev.slice(-11), roundedRate])
      setLastUpdated("Just now")
      setIsLoading(false)
    }, 1000)
  }

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRate()
    }, 30000)

    return () => clearInterval(interval)
  }, [rate])

  // Calculate min and max for chart scaling
  const minRate = Math.min(...history) * 0.99
  const maxRate = Math.max(...history) * 1.01
  const range = maxRate - minRate

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex justify-between items-center">
        <div className={`font-space-mono ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
          <div className="text-sm">STRK/USDT</div>
          <div className="text-2xl font-bold">{rate}</div>
          <div className="text-xs opacity-70">Updated: {lastUpdated}</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshRate}
          disabled={isLoading}
          className={theme === "dark" ? "border-teal-500/30 text-teal-400" : "border-teal-300 text-teal-600"}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Chart */}
      <Card className={`p-4 ${theme === "dark" ? "bg-black/40 border-teal-500/30" : "bg-white/80 border-teal-200"}`}>
        <CardContent className="p-0">
          <div className="h-40 flex items-end space-x-1">
            {history.map((value, index) => {
              const height = ((value - minRate) / range) * 100
              const isLast = index === history.length - 1

              return (
                <motion.div
                  key={index}
                  className="flex-1"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <div
                    className={`w-full h-full rounded-t ${
                      isLast
                        ? theme === "dark"
                          ? "bg-gradient-to-t from-teal-600 to-cyan-500"
                          : "bg-gradient-to-t from-teal-500 to-cyan-400"
                        : theme === "dark"
                          ? "bg-teal-800/50"
                          : "bg-teal-300/50"
                    }`}
                  />
                </motion.div>
              )
            })}
          </div>
          <div className={`text-xs mt-2 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Last 12 updates
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
