import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { AppNav } from "@/components/ui/app-nav";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata: Metadata = { title: "Profile" };

/** A single checklist row: label plus a done/pending marker. */
function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center justify-between py-1.5">
      <span>{label}</span>
      <span className={done ? "text-success" : "text-muted"}>
        {done ? "✓" : "—"}
      </span>
    </li>
  );
}

export default async function ProfilePage() {
  const user = await requireUser();

  const hasName = user.name.trim().length > 0;
  const hasEmail = user.email.trim().length > 0;
  const hasPhone = Boolean(user.phone && user.phone.trim().length > 0);
  const completedCount = [hasName, hasEmail, hasPhone].filter(Boolean).length;
  const completion = Math.round((completedCount / 3) * 100);

  return (
    <>
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Complete your profile
        </h1>
        <p className="text-muted mt-1">
          Adding your phone number completes your profile — the qualifying
          action for your referral.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_18rem]">
          <Card>
            <ProfileForm
              defaultName={user.name}
              defaultPhone={user.phone ?? ""}
              email={user.email}
            />
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Profile completion</h2>
            <div
              className="bg-canvas mt-3 h-2 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-success h-full rounded-full transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-muted mt-2 text-sm">{completion}% complete</p>

            <ul className="mt-4 text-sm">
              <ChecklistRow label="Name" done={hasName} />
              <ChecklistRow label="Email" done={hasEmail} />
              <ChecklistRow label="Phone" done={hasPhone} />
            </ul>

            {user.profileComplete ? (
              <p className="bg-success-soft text-success mt-4 rounded-lg px-3 py-2 text-sm">
                You have completed the requirements for your referral reward.
              </p>
            ) : null}
          </Card>
        </div>
      </main>
    </>
  );
}
