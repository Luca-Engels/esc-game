"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Copy, Twitter, Facebook, Share2, Send } from "lucide-react"
import { shareToTwitter, shareToFacebook, shareToWhatsApp, copyToClipboard } from "@/lib/share-utils"
import { useToast } from "@/hooks/use-toast"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareText: string
  shareUrl: string
}

export function ShareDialog({ open, onOpenChange, shareText, shareUrl }: ShareDialogProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"text" | "link">("text")

  const handleCopy = async () => {
    const textToCopy = activeTab === "text" ? shareText : shareUrl
    const success = await copyToClipboard(textToCopy)

    if (success) {
      setCopied(true)
      toast({
        title: "Copied to clipboard",
        description: activeTab === "text" ? "Ranking text copied to clipboard" : "Link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Share your Eurovision ranking</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your personal Eurovision 2024 ranking with friends
          </DialogDescription>
        </DialogHeader>

        <div className="flex border-b border-gray-800 mb-4">
          <button
            className={`px-4 py-2 ${
              activeTab === "text" ? "border-b-2 border-pink-500 text-pink-400" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("text")}
          >
            Share as Text
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "link" ? "border-b-2 border-pink-500 text-pink-400" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("link")}
          >
            Share as Link
          </button>
        </div>

        {activeTab === "text" ? (
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <div className="bg-black/50 p-3 rounded-md text-sm border border-gray-800 max-h-40 overflow-y-auto">
                {shareText}
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-gray-700" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <div className="bg-black/50 p-3 rounded-md text-sm border border-gray-800 truncate">{shareUrl}</div>
            </div>
            <Button size="sm" variant="outline" className="border-gray-700" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 border-gray-700 hover:bg-gray-800 py-3"
            onClick={() => shareToTwitter(activeTab === "text" ? shareText : shareUrl)}
          >
            <Twitter className="h-5 w-5 text-[#1DA1F2]" />
            <span className="text-xs">Twitter</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 border-gray-700 hover:bg-gray-800 py-3"
            onClick={() => shareToFacebook(shareUrl)}
          >
            <Facebook className="h-5 w-5 text-[#4267B2]" />
            <span className="text-xs">Facebook</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 border-gray-700 hover:bg-gray-800 py-3"
            onClick={() => shareToWhatsApp(shareText, shareUrl)}
          >
            <Send className="h-5 w-5 text-[#25D366]" />
            <span className="text-xs">WhatsApp</span>
          </Button>
        </div>

        {typeof navigator !== "undefined" && navigator.share && (
          <Button
            className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              navigator
                .share({
                  title: "Eurovision 2024 Ranking",
                  text: shareText,
                  url: shareUrl,
                })
                .catch((err) => console.error("Error sharing:", err))
            }}
          >
            <Share2 className="mr-2 h-4 w-4" /> Use Native Share
          </Button>
        )}

        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
