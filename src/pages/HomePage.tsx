import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPosts } from "../api/posts";
import { listProjects } from "../api/projects";
import { getProfile } from "../api/profile";
import type { PostVO, ProjectVO, ProfileVO } from "../types";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import Spinner from "../components/Spinner";
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
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-[var(--shadow-sm)] sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at top, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 65%)",
          }}
        />
        <div className="relative">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="avatar"
              className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[var(--color-code-bg)]"
            />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-code-bg)] font-serif text-3xl text-[var(--color-accent)]">
              {name.charAt(0)}
            </div>
          )}
          <h1 className="mt-5 font-serif text-[clamp(2rem,5vw,2.75rem)] font-semibold tracking-tight text-[var(--color-heading)]">
            {name}
          </h1>
          {profile?.bio ? (
            <p className="mx-auto mt-3 max-w-xl whitespace-pre-line text-[var(--color-text-muted)]">
              {profile.bio}
            </p>
          ) : (
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-muted)]">
              记录灵感，展示成果 — 我的数字花园
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            <Link
              to="/posts"
              className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              阅读灵感
            </Link>
            <Link
              to="/projects"
              className="rounded-full border border-[var(--color-border)] px-5 py-2 text-[var(--color-heading)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {projects.length === 0 && <EmptyState>还没有成果项目</EmptyState>}
        </div>
      </section>
    </div>
  );
}
