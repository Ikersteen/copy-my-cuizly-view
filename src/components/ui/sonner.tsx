import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toast]:bg-destructive/10 group-[.toast]:text-destructive group-[.toast]:border-destructive/20",
          success: "group-[.toast]:bg-success/10 group-[.toast]:text-success group-[.toast]:border-success/20",
          warning: "group-[.toast]:bg-warning/10 group-[.toast]:text-warning group-[.toast]:border-warning/20",
          info: "group-[.toast]:bg-info/10 group-[.toast]:text-info group-[.toast]:border-info/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
