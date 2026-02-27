"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  FileText,
  Image,
  Trash2,
  Download,
  Eye,
  Paperclip,
  X,
  File,
} from "lucide-react"

interface Receipt {
  id: string
  entryId: string | null
  entryType: string | null
  fileName: string
  fileType: string
  fileSize: number
  description: string
  hasData: boolean
  createdAt: string
}

interface ReceiptUploadProps {
  userId: string
  entryId?: string
  entryType?: "income" | "spending"
  compact?: boolean // Compact mode for inline use in entry forms
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function ReceiptUpload({
  userId,
  entryId,
  entryType,
  compact = false,
}: ReceiptUploadProps) {
  const { toast } = useToast()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<string>("")
  const [description, setDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadReceipts = useCallback(async () => {
    try {
      let url = `/api/receipts?userId=${userId}`
      if (entryId) url += `&entryId=${entryId}`
      if (entryType) url += `&entryType=${entryType}`
      const res = await fetch(url)
      const data = await res.json()
      setReceipts(data.receipts || [])
    } catch (err) {
      console.error("Failed to load receipts:", err)
    } finally {
      setLoading(false)
    }
  }, [userId, entryId, entryType])

  useEffect(() => {
    if (userId) loadReceipts()
  }, [userId, loadReceipts])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB.",
        variant: "destructive",
      })
      return
    }

    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "image/svg+xml",
    ]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload JPEG, PNG, GIF, WebP, PDF, or SVG files.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      // Read file as base64
      const base64 = await fileToBase64(file)

      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          entryId: entryId || null,
          entryType: entryType || null,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          data: base64,
          description,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      toast({ title: "Uploaded!", description: `${file.name} uploaded successfully.` })
      setDescription("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      loadReceipts()
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload file.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const viewReceipt = async (receipt: Receipt) => {
    try {
      const res = await fetch("/api/receipts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: receipt.id, userId, action: "get-data" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error("Failed to load")

      setPreviewType(data.fileType)
      setPreviewUrl(data.data)
    } catch {
      toast({ title: "Error", description: "Failed to load receipt.", variant: "destructive" })
    }
  }

  const downloadReceipt = async (receipt: Receipt) => {
    try {
      const res = await fetch("/api/receipts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: receipt.id, userId, action: "get-data" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error("Failed")

      // Create download link
      const link = document.createElement("a")
      link.href = data.data
      link.download = data.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      toast({ title: "Error", description: "Failed to download.", variant: "destructive" })
    }
  }

  const deleteReceipt = async (id: string) => {
    try {
      const res = await fetch("/api/receipts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: "Deleted", description: "Receipt removed." })
      loadReceipts()
    } catch {
      toast({ title: "Error", description: "Failed to delete receipt.", variant: "destructive" })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />
    if (fileType === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  // Compact mode for inline use
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="h-3 w-3 mr-1" />
            {uploading ? "Uploading..." : "Attach Receipt"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            title="Upload receipt file"
          />
          {receipts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {receipts.length} file{receipts.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {receipts.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs text-gray-500">
            {getFileIcon(r.fileType)}
            <span className="truncate flex-1">{r.fileName}</span>
            <Button variant="ghost" size="sm" onClick={() => viewReceipt(r)} className="h-6 w-6 p-0">
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteReceipt(r.id)} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {/* Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl max-h-[80vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {previewType.startsWith("image/") ? (
                <img src={previewUrl} alt="Receipt" className="max-w-full rounded" />
              ) : (
                <iframe src={previewUrl} className="w-full h-[70vh] rounded" title="Receipt preview" />
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full mode
  return (
    <Card className="glow-card backdrop-blur shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Upload className="h-5 w-5 text-teal-500" />
              Receipt & Document Upload
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Attach images or PDFs to your transactions (max 5MB per file)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-teal-300 dark:border-teal-600 rounded-lg p-6 text-center hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-teal-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            {uploading ? "Uploading..." : "Click to upload or drag & drop"}
          </p>
          <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP, PDF, SVG (max 5MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            title="Upload receipt file"
          />
        </div>

        {/* Optional description */}
        <div className="flex gap-2">
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Receipts List */}
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No receipts uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(receipt.fileType)}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {receipt.fileName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>{formatFileSize(receipt.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(receipt.createdAt).toLocaleDateString()}</span>
                      {receipt.description && (
                        <>
                          <span>•</span>
                          <span className="truncate">{receipt.description}</span>
                        </>
                      )}
                      {receipt.entryType && (
                        <Badge variant="secondary" className="text-[10px]">
                          {receipt.entryType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => viewReceipt(receipt)} title="View">
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadReceipt(receipt)} title="Download">
                    <Download className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteReceipt(receipt.id)} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[85vh] overflow-auto p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Receipt Preview</h3>
                <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {previewType.startsWith("image/") ? (
                <img src={previewUrl} alt="Receipt" className="max-w-full rounded" />
              ) : (
                <iframe src={previewUrl} className="w-full h-[75vh] rounded border" title="Receipt preview" />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper: Convert File to base64 data URI
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
