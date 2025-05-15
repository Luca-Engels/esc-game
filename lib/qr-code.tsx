"use client"

import { useEffect, useRef } from "react"
import QRCodeStyling from "qr-code-styling"

interface QRCodeProps {
  data: string
  size?: number
  color?: string
  bgColor?: string
  logoUrl?: string
  logoSize?: number
  cornerRadius?: number
}

export default function QRCode({
  data,
  size = 200,
  color = "#ffffff",
  bgColor = "transparent",
  logoUrl,
  logoSize = 50,
  cornerRadius = 5,
}: QRCodeProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg",
      data: data,
      dotsOptions: {
        color: color,
        type: "rounded",
      },
      backgroundOptions: {
        color: bgColor,
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: color,
      },
      cornersDotOptions: {
        type: "dot",
        color: color,
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 10,
      },
    })

    if (logoUrl) {
      qrCode.update({
        image: logoUrl,
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
          imageSize: logoSize,
        },
      })
    }

    ref.current.innerHTML = ""
    qrCode.append(ref.current)
  }, [data, size, color, bgColor, logoUrl, logoSize, cornerRadius])

  return <div ref={ref} className="flex items-center justify-center" />
}
