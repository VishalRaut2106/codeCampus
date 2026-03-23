"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning" | "info"
  onConfirm?: () => void | Promise<void>
  children?: React.ReactNode
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  children,
}: AlertDialogProps) {
  const [loading, setLoading] = React.useState(false)

  // If children are provided, render as a wrapper (shadcn/ui pattern)
  if (children) {
    if (!open) return null
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }

  // Original custom dialog implementation
  const handleConfirm = async () => {
    if (!onConfirm) return
    
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Confirmation error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <XCircle className="h-6 w-6 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case "info":
        return <Info className="h-6 w-6 text-blue-500" />
      default:
        return <CheckCircle className="h-6 w-6 text-green-500" />
    }
  }

  const getButtonVariant = () => {
    switch (variant) {
      case "destructive":
        return "destructive"
      case "warning":
        return "default"
      default:
        return "default"
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onOpenChange(false)}
      />

      {/* Dialog */}
      <Card className="relative z-10 w-full max-w-md glass-card border-white/20 shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            onClick={handleConfirm}
            disabled={loading}
            className={
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700"
                : variant === "warning"
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            }
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Compatibility exports for shadcn/ui pattern
export const AlertDialogContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Card className="w-full max-w-md glass-card border-white/20 shadow-2xl" {...props}>
    {children}
  </Card>
)

export const AlertDialogHeader = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <CardHeader {...props}>{children}</CardHeader>
)

export const AlertDialogTitle = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <CardTitle className="text-xl" {...props}>{children}</CardTitle>
)

export const AlertDialogDescription = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <CardDescription className="text-base mt-2" {...props}>{children}</CardDescription>
)

export const AlertDialogFooter = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <CardFooter className="flex gap-3 justify-end" {...props}>{children}</CardFooter>
)

export const AlertDialogAction = ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button onClick={onClick} {...props}>{children}</Button>
)

export const AlertDialogCancel = ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button variant="outline" onClick={onClick} className="border-white/20 text-white hover:bg-white/10" {...props}>
    {children}
  </Button>
)

// Hook for easier usage
export function useAlertDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive" | "warning" | "info"
    onConfirm: () => void | Promise<void>
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })

  const showDialog = (config: Omit<typeof dialogState, "open">) => {
    setDialogState({ ...config, open: true })
  }

  const hideDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false }))
  }

  return {
    dialogState,
    showDialog,
    hideDialog,
    AlertDialogComponent: () => (
      <AlertDialog
        {...dialogState}
        onOpenChange={hideDialog}
      />
    ),
  }
}
