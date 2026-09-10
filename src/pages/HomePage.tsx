import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPosts } from "../api/posts";
import { listProjects } from "../api/projects";
import { getProfile } from "../api/profile";
import type { PostVO, ProjectVO, ProfileVO } from "../types";
import FlipAvatar from "../components/FlipAvatar";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import Spinner from "../components/Spinner";
import StatusPulse from "../components/StatusPulse";
import { EmptyState, SectionHeader } from "../components/ui/PagePrimitives";

export default function HomePage() {
  const [profile, setProfile] = useState<ProfileVO | null>(null);
  const [posts, setPosts] = useState<PostVO[]>([]);
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProfile(), listPosts(0, 5), listProjects()])
      .then(([p, postPage, projs]) => {
        setProfile(p);
        setPosts(postPage.items);
        setProjects(projs.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const name = profile?.displayName ?? "Harvey";

  return (
    <div className="space-y-14">
      <section className="relative overflow-visible rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-[var(--shadow-sm)] sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at top, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 65%)",
          }}
        />
        <div className="relative">
          <FlipAvatar
            initial={name.charAt(0)}
            name={name}
            portraitUrl={profile?.avatarUrl}
          />
          <div className="mt-5 flex items-center justify-center gap-2.5">
            <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-semibold tracking-tight text-[var(--color-heading)]">
              {name}
            </h1>
            <StatusPulse />
          </div>
          {profile?.bio ? (
            <p className="mx-auto mt-3 max-w-xl whitespace-pre-line text-[var(--color-text-muted)]">
              {profile.bio}
            </p>
          ) : (
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-muted)]">
              记录灵感，展示成果 — 我的数字花园
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/posts" className="dg-btn dg-btn--fill">
              随想涂鸦
            </Link>
            <Link to="/projects" className="dg-btn dg-btn--ghost">
              查看成果
            </Link>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="最新灵感" to="/posts" />
        <div className="grid gap-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
          {posts.length === 0 && <EmptyState>还没文章，去后台写一篇吧</EmptyState>}
        </div>
      </section>

      <section>
        <SectionHeader title="精选成果" to="/projects" />
        <div className="grid gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {projects.length === 0 && <EmptyState>还没有成果项目</EmptyState>}
        </div>
      </section>
    </div>
  );
}
