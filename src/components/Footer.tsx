import { ArrowUp, ArrowUpRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="garden-footer">
      <div className="garden-footer-inner">
        <div>
          <Link to="/" className="garden-footer-brand">Digital Garden<span>.</span></Link>
          <p>记录灵感，展示成果，留住日常。</p>
        </div>
        <div className="garden-footer-right">
          <Link to="/about">关于这座花园 <ArrowUpRight size={15} aria-hidden="true" /></Link>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>
            回到顶部 <ArrowUp size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="garden-footer-bottom">© {new Date().getFullYear()} Harvey · Digital Garden</div>
    </footer>
  );
}
