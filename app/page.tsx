import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Refer Friends. Earn Rewards.",
};

const STEPS = [
  {
    title: "Share your link",
    body: "Every account gets a unique referral code and a link you can send to anyone.",
  },
  {
    title: "They sign up",
    body: `We remember who referred them for ${env.REFERRAL_ATTRIBUTION_DAYS} days, even if they come back later.`,
  },
  {
    title: "You get paid",
    body: `Once your referral completes their profile, a ₹${env.REFERRAL_REWARD_AMOUNT} reward is queued for approval.`,
  },
] as const;

export default function HomePage() {
  return (
    <>
      <header className="border-border bg-surface border-b">
        <nav
          className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
          aria-label="Main"
        >
          <span className="text-lg font-semibold tracking-tight">
            Refer<span className="text-brand">Flow</span>
          </span>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="secondary">
              Log in
            </ButtonLink>
            <ButtonLink href="/register">Get started</ButtonLink>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="py-16 sm:py-24">
          <p className="text-brand text-sm font-semibold">
            Refer Friends. Earn Rewards.
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Turn your network into ₹{env.REFERRAL_REWARD_AMOUNT} at a time
          </h1>
          <p className="text-muted mt-4 max-w-xl text-lg text-pretty">
            ReferFlow gives every member a trackable referral link, credits the
            right person automatically, and pays out through a reviewed reward
            queue.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">
              Create your link
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              I already have an account
            </ButtonLink>
          </div>
        </section>

        <section aria-labelledby="how-it-works" className="pb-20">
          <h2 id="how-it-works" className="text-xl font-semibold">
            How it works
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="border-border bg-surface rounded-xl border p-5"
              >
                <span className="bg-brand-soft text-brand flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-medium">{step.title}</h3>
                <p className="text-muted mt-1 text-sm text-pretty">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-border bg-surface border-t">
        <div className="text-muted mx-auto max-w-5xl px-4 py-6 text-sm">
          ReferFlow — a learning project. Rewards are paid in{" "}
          {env.REFERRAL_REWARD_CURRENCY}.
        </div>
      </footer>
    </>
  );
}
