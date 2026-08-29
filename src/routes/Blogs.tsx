import { Link } from "react-router-dom";
import { PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";
import SEO from "../components/SEO";
import BrandCursor from "../components/BrandCursor";
import { posts, formatDate } from "../lib/posts";
import { useReveal } from "../hooks/useReveal";
import "./styles/Blogs.css";

/** The sparkle rule used on the hub and the coming-soon page. Repeated here
 *  so the three pages punctuate the same way. */
const Rule = () => (
  <div className="learn-rule" aria-hidden="true">
    <span />
    <svg viewBox="0 0 24 24">
      <path d="M12 0c.8 6.2 5 10.4 11.2 11.2v1.6C17 13.6 12.8 17.8 12 24c-.8-6.2-5-10.4-11.2-11.2v-1.6C7 10.4 11.2 6.2 12 0z" />
    </svg>
    <span />
  </div>
);

const Meta = ({ date, minutes }: { date: string; minutes: number }) => (
  <p className="learn-meta">
    <time dateTime={date}>{formatDate(date)}</time>
    <span aria-hidden="true">/</span>
    <span>{minutes} min read</span>
  </p>
);

/**
 * DGFari Learn.
 *
 * The newest post leads at full width and the rest follow as a rule-separated
 * index. That asymmetry is the point: a grid of identical cards gives every
 * post the same weight, which is exactly the claim a publication should not
 * be making about its own archive.
 */
const Blogs = () => {
  const [lead, ...rest] = posts;
  const ref = useReveal<HTMLDivElement>();

  return (
    <div className="learn" ref={ref}>
      <BrandCursor />
      <SEO
        title="DGFari Learn"
        description="Writing on building with purpose: brand, product, AI, and the craft behind them."
        path="/blogs"
      />

      <header className="learn-head" data-reveal>
        <Link className="learn-back" to="/" data-cursor="disable">
          <PiArrowLeftBold aria-hidden="true" />
          Back to the hub
        </Link>

        <h1>
          DGFari <span>Learn</span>
        </h1>
        <p className="learn-tagline">
          Writing on becoming who you were made to be, and building with the
          One who made you.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="learn-empty" data-reveal>
          <p>The first posts are being written.</p>
        </div>
      ) : (
        <>
          <Rule />

          <article className="learn-lead" data-reveal>
            <Link to={`/blogs/${lead.slug}`} data-cursor="disable">
              <span className="learn-flag">Latest</span>
              <h2>{lead.title}</h2>
              <p className="learn-excerpt">{lead.excerpt}</p>
              <Meta date={lead.date} minutes={lead.readingMinutes} />
              <span className="learn-cue">
                Read this
                <PiArrowRightBold aria-hidden="true" />
              </span>
            </Link>
          </article>

          {rest.length > 0 && (
            <>
              <h2 className="learn-more-label" data-reveal>
                More writing
              </h2>

              <ul className="learn-list">
                {rest.map((post, i) => (
                  <li
                    key={post.slug}
                    data-reveal
                    // Staggers the entrance so the list arrives as a sequence
                    // rather than all at once. Capped, or a long archive would
                    // leave the last rows waiting seconds to appear.
                    style={{ "--i": Math.min(i, 6) } as React.CSSProperties}
                  >
                    <Link to={`/blogs/${post.slug}`} data-cursor="disable">
                      <div className="learn-list-main">
                        <h3>{post.title}</h3>
                        <p className="learn-excerpt">{post.excerpt}</p>
                        <Meta date={post.date} minutes={post.readingMinutes} />
                      </div>
                      <PiArrowRightBold
                        className="learn-list-arrow"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Blogs;
