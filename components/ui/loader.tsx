import { cn } from "@/lib/utils"

interface LoaderProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function Loader({ size = "md", className, text }: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size]
      )} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

export function ChatLoader() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted text-muted-foreground rounded-lg p-4 max-w-[80%]">
        <div className="flex items-center gap-3">
          <div className="animate-pulse flex space-x-1">
            <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-current rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm">Thinking...</span>
        </div>
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export function ButtonLoader() {
  return (
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      <span>Loading...</span>
    </div>
  )
}
