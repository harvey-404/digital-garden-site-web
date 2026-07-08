import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPosts } from "../api/posts";
import { listProjects } from "../api/projects";
import { getProfile } from "../api/profile";
import type { PostVO, ProjectVO, ProfileVO } from "../types";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import Spinner from "../components/Spinner";

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

  return (
    <div className="space-y-12">
      <section className="text-center">
        {profile?.avatarUrl && (
          <img src={profile.avatarUrl} alt="avatar" className="mx-auto h-24 w-24 rounded-full object-cover" />
        )}
        <h1 className="mt-4 text-3xl font-bold">{profile?.displayName ?? "Harvey"}</h1>
        {profile?.bio && <p className="mt-2 text-slate-500">{profile.bio}</p>}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">最新灵感</h2>
          <Link to="/posts" className="text-sm text-slate-500 hover:text-slate-800">查看全部 →</Link>
        </div>
        <div className="grid gap-4">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
          {posts.length === 0 && <p className="text-slate-400">还没文章</p>}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">精选成果</h2>
          <Link to="/projects" className="text-sm text-slate-500 hover:text-slate-800">查看全部 →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          {projects.length === 0 && <p className="text-slate-400">还没成果</p>}
        </div>
      </section>
    </div>
  );
}
