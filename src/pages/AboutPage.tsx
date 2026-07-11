import { useEffect, useState } from "react";
import { getProfile } from "../api/profile";
import type { ProfileVO } from "../types";
import Spinner from "../components/Spinner";
import { PageHeader } from "../components/ui/PagePrimitives";

interface SocialLink {
  name: string;
  url: string;
}

export default function AboutPage() {
  const [profile, setProfile] = useState<ProfileVO | null>(null);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        try {
          setLinks(p.socialLinks ? (JSON.parse(p.socialLinks) as SocialLink[]) : []);
        } catch {
          setLinks([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const name = profile?.displayName ?? "Harvey";

  return (
    <div className="space-y-8">
      <PageHeader title="关于我" description="一点背景，以及如何找到我。" />

      <div className="flex flex-col gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:flex-row sm:items-start">
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt="avatar"
            className="h-24 w-24 shrink-0 rounded-full object-cover ring-4 ring-[var(--color-code-bg)]"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[var(--color-code-bg)] font-serif text-3xl text-[var(--color-accent)]">
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl font-semibold text-[var(--color-heading)]">{name}</h2>
          {profile?.bio && (
            <p className="mt-3 whitespace-pre-line leading-relaxed text-[var(--color-text-muted)]">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {links.length > 0 && (
        <section>
          <h3 className="mb-3 font-serif text-lg font-semibold text-[var(--color-heading)]">链接</h3>
          <div className="flex flex-wrap gap-3">
            {links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-accent)] transition hover:border-[var(--color-accent)]"
              >
                {l.name}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
