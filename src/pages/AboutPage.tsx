import { useEffect, useState } from "react";
import { getProfile } from "../api/profile";
import type { ProfileVO } from "../types";
import Spinner from "../components/Spinner";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {profile?.avatarUrl && (
          <img src={profile.avatarUrl} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
        )}
        <h1 className="text-2xl font-bold">{profile?.displayName ?? "Harvey"}</h1>
      </div>
      {profile?.bio && <p className="whitespace-pre-line text-slate-600">{profile.bio}</p>}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          {links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-slate-900 underline">
              {l.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
