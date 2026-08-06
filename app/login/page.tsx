"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction } from "./action";

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await loginAction(formData);

    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      window.location.href = "/";
    } else {
      setErrorMessage(result.error || "Failed to sign in.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div
        className={`w-full max-w-md space-y-6 transition-all duration-300 ${isSuccess ? "scale-[0.99] opacity-90" : "scale-100 opacity-100"
          }`}
      >
        <Card className="rounded-xl border-slate-200 bg-white shadow-lg">
          <div className="flex flex-col items-center space-y-3 pt-6 text-center">
            <Image
              src="/sms2.png"
              alt="SMS 2"
              width={200}
              height={50}
              priority
              className="h-12 w-auto object-contain"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              {errorMessage && (
                <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="grid gap-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-slate-700"
                >
                  Email Address
                </Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading || isSuccess}
                  className="h-10 border-slate-200 bg-white text-slate-900 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-700"
                >
                  Password
                </Label>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading || isSuccess}
                    className="h-10 border-slate-200 bg-white text-slate-900 pr-10 focus:border-slate-400 focus:ring-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading || isSuccess}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pb-6 pt-3">
              <Button
                type="submit"
                disabled={isLoading || isSuccess}
                className="h-10 w-full text-sm font-medium text-white"
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />
                    Success
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Apply Now Section */}
              <div className="text-center text-xs text-slate-600">
                Don't have an account yet?{" "}
                <Link
                  href="/enrollment"
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Apply Now
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}