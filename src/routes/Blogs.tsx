import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import "./styles/Blogs.css";
import BrandCursor from "../components/BrandCursor";

/**
 * DGFari Learn.
 *
 * Placeholder until Phase 2 wires this to Sanity. It exists now so the hub's
 * avatar and hint lead somewhere real rather than to a dead route, and so the
 * URL is live and linkable from day one.
 */
const Blogs = () => (
  <div className="blogs">
    <BrandCursor />
    <SEO
      title="DGFari Learn"
      description="Writing on building with purpose: brand, product, AI, and the craft behind them."
      path="/blogs"
    />

    <header className="blogs-head">
      <h1>
        DGFari <span>Learn</span>
      </h1>
      <p>Writing on building with purpose.</p>
    </header>

    <div className="blogs-empty">
      <p>The first posts are being written.</p>
      <Link className="blogs-back" to="/" data-cursor="disable">
        Back to the hub
      </Link>
    </div>
  </div>
);

export default Blogs;
