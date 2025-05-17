/**
 * Generates a shareable text based on the user's Eurovision rankings
 * @param rankings Array of country indices in ranked order
 * @param countries Array of country data
 * @returns Formatted text for sharing
 */
export function generateShareText(rankings: number[], countries: any[]): string {
  const rankedCountries = rankings
    .map((idx, rank) => `${rank + 1}. ${countries[idx].name} - ${countries[idx].song}`)
    .join("\n")

  return `My Eurovision 2024 Ranking:\n\n${rankedCountries}\n\nCreate your own ranking at eurovision-ranking.vercel.app`
}

/**
 * Generates a shareable URL for direct result sharing
 * @param rankings Array of country indices in ranked order
 * @returns URL string with encoded rankings
 */
export function generateShareableUrl(rankings: number[]): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://eurovision-ranking.vercel.app"
  const encodedRankings = encodeURIComponent(JSON.stringify(rankings))
  return `${baseUrl}/shared?r=${encodedRankings}`
}

/**
 * Share content to Twitter/X
 */
export function shareToTwitter(text: string): void {
  const encodedText = encodeURIComponent(text)
  const url = `https://twitter.com/intent/tweet?text=${encodedText}`
  window.open(url, "_blank", "noopener,noreferrer,width=600,height=400")
}

/**
 * Share content to Facebook
 */
export function shareToFacebook(url: string): void {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400")
}

/**
 * Share content to WhatsApp
 */
export function shareToWhatsApp(text: string, url: string): void {
  const shareText = `${text}\n\n${url}`
  const encodedText = encodeURIComponent(shareText)
  const whatsappUrl = `https://wa.me/?text=${encodedText}`
  window.open(whatsappUrl, "_blank", "noopener,noreferrer")
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error("Failed to copy text: ", err)
    return false
  }
}
