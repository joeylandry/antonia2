import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "block w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn(fieldClass, "h-9", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClass, "min-h-20 py-2", className)} {...props} />;
}

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={cn(fieldClass, "h-9 appearance-none bg-no-repeat pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export { Input, Textarea, Select };
