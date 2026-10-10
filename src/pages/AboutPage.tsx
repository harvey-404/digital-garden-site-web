import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { getProfile } from "../api/profile";
import type { ProfileVO } from "../types";
import Spinner from "../components/Spinner";

interface SocialLink { name: string; url: string; }

export default function AboutPage() {
  const [profile, setProfile] = useState<ProfileVO | null>(null);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let current = true;
    getProfile().then((person) => {
      if (!current) return;
      setProfile(person);
      try {
        const social: unknown = person.socialLinks ? JSON.parse(person.socialLinks) : [];
        setLinks(Array.isArray(social) ? social.filter((link): link is SocialLink => typeof link?.name === "string" && typeof link?.url === "string" && /^https?:\/\//i.test(link.url)) : []);
      } catch { setLinks([]); }
    }).catch(() => { if (current) setFailed(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);
  if (loading) return <Spinner />;
  const name = profile?.displayName ?? "Harvey";
  return (
    <div className="garden-about">
      <header className="garden-page-heading"><p className="garden-page-kicker">花园的主人</p><h1>关于我<span aria-hidden="true">.</span></h1><p>一点背景，以及如何找到我。</p></header>
      <section className="garden-about-grid">
        <figure className="garden-about-portrait"><img src={profile?.avatarUrl || "/portraits/studio.jpg"} alt={name + " 的个人角色头像"} width="960" height="960" /><figcaption>{name} / Digital Garden</figcaption></figure>
        <div className="garden-about-copy">
          <p className="garden-hello">很高兴在这里遇见你。</p>
          <h2>我是 {name}<span>，</span><br />这是一座慢慢生长的<br className="garden-about-break" />数字花园。</h2>
          <p className="garden-about-bio">{profile?.bio || "欢迎来到我的数字花园。"}</p>
          {failed && <p role="status" className="garden-notice">个人资料暂时未能加载，请稍后刷新。</p>}
          <div className="garden-about-paths">
            <Link to="/posts"><span>写下来的想法<small>文章、笔记和还在生长的灵感。</small></span><ArrowUpRight size={21} aria-hidden="true" /></Link>
            <Link to="/projects"><span>做出来的东西<small>从一个念头，到可以打开的作品。</small></span><ArrowUpRight size={21} aria-hidden="true" /></Link>
            <Link to="/album"><span>生活留下的足迹<small>走过的地方，值得留下的片刻。</small></span><ArrowUpRight size={21} aria-hidden="true" /></Link>
          </div>
          {links.length > 0 && <div className="garden-social-links">{links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.name} <ArrowUpRight size={15} aria-hidden="true" /></a>)}</div>}
          <Link to="/" className="garden-text-link">回到花园 <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
