import { Link } from "wouter";
import { Mark } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] grid place-items-center px-5 text-center">
      <div>
        <Mark className="h-10 w-10 mx-auto" />
        <h1 className="display text-5xl mt-6">Lost in the post.</h1>
        <p className="text-muted-foreground mt-3">This page doesn't exist.</p>
        <Link href="/" data-testid="link-back-home" className="inline-block mt-6 rounded-full bg-secondary text-secondary-foreground px-5 py-2 text-sm">Back home</Link>
      </div>
    </div>
  );
}
