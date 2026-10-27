import * as React from "react";
import { FieldError, FieldHint, Label } from "@/components/ui/label";

type Props = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

/** Label + control + hint + error with consistent spacing. The control should set
 *  id={htmlFor}, aria-invalid and aria-describedby={`${htmlFor}-error`} when invalid. */
export function FormField({ label, htmlFor, error, hint, children, className }: Props) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? <FieldHint>{hint}</FieldHint> : null}
      <FieldError id={`${htmlFor}-error`}>{error}</FieldError>
    </div>
  );
}
