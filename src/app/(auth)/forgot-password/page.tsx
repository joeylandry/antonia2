import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const { expired } = await searchParams;
  return (
    <>
      <h1 className="text-3xl">Reset your password</h1>
      <p className="mb-8 mt-2 text-muted-foreground">We&apos;ll email you a link to choose a new one.</p>
      <ForgotForm expired={expired === "1"} />
    </>
  );
}
