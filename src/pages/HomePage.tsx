import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, MapTrifold, CheckSquare } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { listPosts } from "../api/posts";
import { listProjects } from "../api/projects";
import { getProfile } from "../api/profile";
import type { PostVO, ProjectVO, ProfileVO } from "../types";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { EmptyState } from "../components/ui/PagePrimitives";
import { formatPostDate } from "../lib/markdown";

export default function HomePage() {
  const [profile, setProfile] = useState<ProfileVO | null>(null);
  const [posts, setPosts] = useState<PostVO[]>([]);
  const [projects, setProjects] = useState<ProjectVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    Promise.allSettled([getProfile(), listPosts(0, 5), listProjects()])
      .then(([person, writing, work]) => {
        if (!current) return;
        if (person.status === "fulfilled") setProfile(person.value);
        if (writing.status === "fulfilled") setPosts(writing.value.items);
        if (work.status === "fulfilled") setProjects(work.value.slice(0, 3));
        setFailed([person, writing, work].some((result) => result.status === "rejected"));
        setLoading(false);
      });
    return () => { current = false; };
  }, []);

  const name = profile?.displayName ?? "Harvey";
  const featured = posts[0];

  return (
    <div className="garden-home">
      <section className="garden-hero" aria-label="个人介绍">
        <div className="garden-hero-copy">
          <p className="garden-hello">你好，我是</p>
          <h1>{name}<span aria-hidden="true">.</span></h1>
          <p className="garden-hero-statement">记录灵感，<br />也认真生活。</p>
          <p className="garden-hero-bio">{profile?.bio || "欢迎来到我的数字花园。"}</p>
          <div className="garden-hero-actions">
            <Link to="/posts" className="garden-button garden-button-primary">随想涂鸦 <ArrowUpRight size={17} aria-hidden="true" /></Link>
            <Link to="/projects" className="garden-text-link">查看成果 <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
        <figure className="garden-hero-art">
          <div className="garden-portrait-frame">
            <img src={profile?.avatarUrl || "/portraits/studio.jpg"} alt={name + " 的个人角色头像"} width="960" height="960" fetchPriority="high" />
          </div>
          <figcaption>写点想法，做点东西，留住日常。</figcaption>
        </figure>
      </section>

      {failed && <p className="garden-notice" role="status">部分内容暂时未能加载，刷新页面后再试。</p>}

      <section className="garden-section" aria-labelledby="latest-heading" aria-busy={loading}>
        <div className="garden-section-heading">
          <h2 id="latest-heading">最新灵感<span aria-hidden="true"> / Writing</span></h2>
          <Link to="/posts" className="garden-text-link">查看全部 <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
        {loading ? <div className="garden-writing-skeleton" aria-label="正在加载灵感"><div /><div /></div> : featured ? (
          <div className="garden-writing-grid">
            <Link to={"/posts/" + featured.slug} className="garden-featured-post">
              <div className="garden-featured-meta"><BookOpen size={18} aria-hidden="true" /><span>最近写下</span><time dateTime={new Date(featured.inDtm * 1000).toISOString()}>{formatPostDate(featured.inDtm)}</time></div>
              <h3>{featured.title}</h3>
              {featured.summary && <p>{featured.summary}</p>}
              <div className="garden-featured-bottom"><span>{featured.tags.slice(0, 2).join(" / ")}</span><span className="garden-read-link">读这篇 <ArrowUpRight size={20} aria-hidden="true" /></span></div>
            </Link>
            <div className="garden-recent-posts">{posts.slice(1).map((post) => <PostCard key={post.id} post={post} compact />)}</div>
          </div>
        ) : <EmptyState>{failed ? "文章暂时未能加载" : "还没有文章，新的想法会慢慢写在这里。"}</EmptyState>}
      </section>

      <section className="garden-section" aria-labelledby="projects-heading" aria-busy={loading}>
        <div className="garden-section-heading">
          <h2 id="projects-heading">精选成果<span aria-hidden="true"> / Making</span></h2>
          <Link to="/projects" className="garden-text-link">查看全部 <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="garden-project-grid">
          {loading && <><div className="garden-project-skeleton" aria-label="正在加载成果" /><div className="garden-project-skeleton" aria-hidden="true" /></>}
          {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
        {!loading && !projects.length && <EmptyState>{failed ? "成果暂时未能加载" : "还没有成果项目"}</EmptyState>}
      </section>

      <section className="garden-explore" aria-label="探索花园">
        <div><p>花园里的其他角落</p><h2>写作之外，<br />还有生活。</h2></div>
        <div className="garden-explore-links">
          <Link to="/album"><MapTrifold size={23} aria-hidden="true" /><span><strong>足迹</strong><small>把走过的地方，留在地图上。</small></span><ArrowUpRight size={20} aria-hidden="true" /></Link>
          <Link to="/todos"><CheckSquare size={23} aria-hidden="true" /><span><strong>计划</strong><small>让脑海里的下一步，慢慢落地。</small></span><ArrowUpRight size={20} aria-hidden="true" /></Link>
          <Link to="/tracker"><BookOpen size={23} aria-hidden="true" /><span><strong>有数 · 记录日常</strong><small>看见时间，也看见自己的变化。</small></span><ArrowUpRight size={20} aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
