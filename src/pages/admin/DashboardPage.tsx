import { useEffect, useState } from "react";
import { adminListPosts } from "../../api/posts";
import { listProjects } from "../../api/projects";
import { adminListComments } from "../../api/comments";

export default function DashboardPage() {
  const [postCount, setPostCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    adminListPosts(0, 1).then((p) => setPostCount(p.total)).catch(() => {});
    listProjects().then((p) => setProjectCount(p.length)).catch(() => {});
    adminListComments("PENDING").then((c) => setPendingCount(c.length)).catch(() => {});
  }, []);

  const cards = [
    { label: "文章总数", value: postCount },
    { label: "成果总数", value: projectCount },
    { label: "待审核评论", value: pendingCount },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">概览</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border bg-white p-6">
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="mt-1 text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
