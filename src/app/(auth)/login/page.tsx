import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-3xl">Welcome back</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Sign in to see your clients.</p>
      <LoginForm next={safeNext(typeof next === "string" ? next : undefined)} />
    </>
  );
}
