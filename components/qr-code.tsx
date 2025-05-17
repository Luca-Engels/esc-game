"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface QRCodeProps {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  level?: "L" | "M" | "Q" | "H"
  includeMargin?: boolean
  className?: string
}

export default function QRCodeCanvas({
  value,
  size = 200,
  bgColor = "#ffffff",
  fgColor = "#000000",
  level = "M",
  includeMargin = true,
  className = "",
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: includeMargin ? 4 : 0,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          errorCorrectionLevel: level,
        },
        (error) => {
          if (error) console.error("Error generating QR code:", error)
        },
      )
    }
  }, [value, size, bgColor, fgColor, level, includeMargin])

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  )
}
