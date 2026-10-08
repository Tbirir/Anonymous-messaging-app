import { useAuth } from "@workspace/replit-auth-web";
import { ArrowRight, EyeOff, Heart, PauseCircle } from "lucide-react";
import { Wordmark } from "@/components/brand";

const samples = [
  { t: "Your laugh in the group chat voice notes genuinely fixes my Mondays.", r: "-3deg", d: "2h ago" },
  { t: "Honest thought: you undersell your own work. The zine was the best thing at the fair.", r: "2deg", d: "yesterday" },
  { t: "Thank you for driving me to the airport at 5am and pretending it was no big deal.", r: "-1deg", d: "3 days ago" },
];

export default function Landing() {
  const { login } = useAuth();
  return (
    <div className="min-h-[100dvh] overflow-hidden">
      <header className="mx-auto max-w-6xl flex items-center justify-between px-5 h-20">
        <Wordmark />
        <button onClick={login} data-testid="button-login-header" className="text-sm font-medium hover:text-primary transition-colors">
          Log in
        </button>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-8 pb-24 grid md:grid-cols-[1.1fr_1fr] gap-14 items-center">
        <div>
          <p className="rise font-mono text-xs uppercase tracking-[0.2em] text-primary">A quiet inbox for honest notes</p>
          <h1 className="rise display text-5xl md:text-7xl leading-[0.95] mt-5" style={{ animationDelay: "80ms" }}>
            Let your friends say the <em className="text-primary">kind</em> thing out loud.
          </h1>
          <p className="rise mt-6 text-lg text-muted-foreground max-w-md" style={{ animationDelay: "160ms" }}>
            Share one link. Friends write to you without signing in, and their names never appear in your inbox.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "240ms" }}>
            <button
              onClick={login}
              data-testid="button-login"
              className="group flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 font-medium shadow-[0_10px_24px_-10px_hsl(var(--primary))] active:scale-[.97] transition-transform"
            >
              Open my inbox <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <span className="text-sm text-muted-foreground">Free. Takes a minute.</span>
          </div>
        </div>

        <div className="relative">
          <span className="absolute -top-8 right-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-dashed rounded-full px-3 py-1" data-testid="text-preview-label">
            Illustrative preview, not real messages
          </span>
          <div className="relative rounded-[2rem] bg-secondary p-6 pt-8 space-y-4">
            {samples.map((s, i) => (
              <div
                key={i}
                className="note-card drift rounded-2xl p-5"
                style={{ ["--r" as string]: s.r, animationDelay: `${i * 1.3}s` }}
              >
                <p className="display text-lg leading-snug">{s.t}</p>
                <div className="mt-3 flex justify-between font-mono text-[11px] text-muted-foreground">
                  <span>from someone</span><span>{s.d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-6xl px-5 py-20 grid md:grid-cols-[1fr_2fr] gap-12">
          <h2 className="display text-4xl">How it works, plainly.</h2>
          <ol className="space-y-8">
            {[
              ["Claim your page", "Log in and get a link like /u/yourname with a short bio of what you want to hear."],
              ["Share it with your people", "Post it, text it, pin it. Senders don't need an account."],
              ["Read, keep, let go", "Mark favorites to keep close. Delete anything you'd rather not hold onto."],
            ].map(([h, b], i) => (
              <li key={h} className="flex gap-6 border-t border-white/15 pt-6">
                <span className="font-mono text-primary">0{i + 1}</span>
                <div><h3 className="text-xl font-medium">{h}</h3><p className="mt-1 opacity-70">{b}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 grid sm:grid-cols-[1.4fr_1fr_1fr] gap-6">
        <div className="note-card rounded-2xl p-7">
          <EyeOff className="h-5 w-5 text-primary" />
          <h3 className="display text-2xl mt-4">Names stay out of it</h3>
          <p className="mt-2 text-muted-foreground text-sm">Your inbox shows the words and the time. Nothing about who sent them. Like anything online, it isn't a guarantee against every kind of identification, so write accordingly.</p>
        </div>
        <div className="rounded-2xl p-7 bg-accent">
          <Heart className="h-5 w-5 text-primary" />
          <h3 className="display text-2xl mt-4">Keep the good ones</h3>
          <p className="mt-2 text-sm opacity-75">Favorite notes for the days you need them.</p>
        </div>
        <div className="rounded-2xl p-7 border border-dashed">
          <PauseCircle className="h-5 w-5 text-primary" />
          <h3 className="display text-2xl mt-4">Pause anytime</h3>
          <p className="mt-2 text-sm text-muted-foreground">Close your inbox with one switch.</p>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 pb-12 flex justify-between text-sm text-muted-foreground">
        <span className="display italic">whisper</span>
        <button onClick={login} className="hover:text-primary" data-testid="button-login-footer">Start yours</button>
      </footer>
    </div>
  );
}
