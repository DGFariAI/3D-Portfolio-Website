import { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";
import SEO from "../components/SEO";
import BrandCursor from "../components/BrandCursor";
import { getPost, posts, formatDate } from "../lib/posts";
import "./styles/Post.css";

/**
 * How far through the article the reader is, as a 0-1 scale on the bar's own
 * transform.
 *
 * Written straight to the DOM node inside a rAF rather than held in state: this
 * fires on every scroll event, and re-rendering the whole article to move one
 * bar would be a render per frame of scrolling. scaleX keeps it on the
 * compositor, so no layout is forced either.
 */
function useReadingProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      // A page shorter than the viewport has nothing to progress through, and
      // dividing by zero here would leave the bar full from the first paint.
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return barRef;
}

/**
 * A single piece of writing.
 *
 * The body is markdown rendered to HTML at module load (see lib/posts), so it
 * is set with dangerouslySetInnerHTML. That is safe here in a way it would not
 * be with user input: the only source is markdown files committed to this
 * repository, which is the same trust level as the rest of the source.
 */
const Post = () => {
  const { slug } = useParams();
  const post = getPost(slug);
  // Called before the early return below, because a hook cannot be skipped on
  // some renders and run on others.
  const barRef = useReadingProgress();

  // An unknown slug goes back to the index rather than showing a dead page.
  if (!post) return <Navigate to="/blogs" replace />;

  const index = posts.findIndex((p) => p.slug === post.slug);
  const next = posts[index + 1];

  return (
    <div className="post">
      <BrandCursor />
      <SEO
        title={`${post.title} | DGFari Learn`}
        description={post.excerpt}
        path={`/blogs/${post.slug}`}
      />

      <div className="post-progress" aria-hidden="true">
        <div className="post-progress-bar" ref={barRef} />
      </div>

      <div className="post-aura" aria-hidden="true">
        <span />
      </div>

      <article className="post-inner">
        <header className="post-head">
          <Link className="post-back" to="/blogs" data-cursor="disable">
            <PiArrowLeftBold aria-hidden="true" />
            DGFari Learn
          </Link>

          {post.tags.length > 0 && (
            <ul className="post-tags">
              {post.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}

          <h1>{post.title}</h1>

          <p className="post-meta">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">/</span>
            <span>{post.readingMinutes} min read</span>
          </p>
        </header>

        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        <div className="post-rule" aria-hidden="true">
          <span />
          <svg viewBox="0 0 24 24">
            <path d="M12 0c.8 6.2 5 10.4 11.2 11.2v1.6C17 13.6 12.8 17.8 12 24c-.8-6.2-5-10.4-11.2-11.2v-1.6C7 10.4 11.2 6.2 12 0z" />
          </svg>
          <span />
        </div>

        <footer className="post-foot">
          {next ? (
            <Link className="post-next" to={`/blogs/${next.slug}`} data-cursor="disable">
              <span className="post-next-label">Read next</span>
              <span className="post-next-title">{next.title}</span>
              <PiArrowRightBold aria-hidden="true" />
            </Link>
          ) : (
            <Link className="post-next" to="/blogs" data-cursor="disable">
              <span className="post-next-label">Back to</span>
              <span className="post-next-title">All writing</span>
              <PiArrowRightBold aria-hidden="true" />
            </Link>
          )}
        </footer>
      </article>
    </div>
  );
};

export default Post;
