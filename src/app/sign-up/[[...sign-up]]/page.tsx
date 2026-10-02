'use client';
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-deep)]">
      <SignUp />
    </div>
  );
}
