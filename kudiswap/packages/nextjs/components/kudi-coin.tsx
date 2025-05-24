import type React from "react"

interface KudiCoinProps {
  className?: string
}

const KudiCoin: React.FC<KudiCoinProps> = ({ className }) => {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform="translate(0, 0) scale(1.2)">
        <ellipse cx="100" cy="100" rx="70" ry="50" fill="#0BC5B7" className="coin-base" />
        <ellipse cx="100" cy="100" rx="60" ry="40" fill="#2DD8CA" className="coin-inner" />
        <path
          d="M60 80 C 80 90, 120 110, 140 120"
          stroke="#0BC5B7"
          strokeWidth="8"
          strokeLinecap="round"
          className="coin-line"
        />
        <path
          d="M70 85 C 75 87, 80 90, 85 92"
          stroke="#0BC5B7"
          strokeWidth="4"
          strokeLinecap="round"
          className="coin-detail"
        />
        <path
          d="M115 108 C 120 110, 125 112, 130 115"
          stroke="#0BC5B7"
          strokeWidth="4"
          strokeLinecap="round"
          className="coin-detail"
        />
      </g>
    </svg>
  )
}

export default KudiCoin
