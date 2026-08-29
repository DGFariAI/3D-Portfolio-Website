import { Link, Navigate, useParams } from "react-router-dom";
import { PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";
import SEO from "../components/SEO";
import BrandCursor from "../components/BrandCursor";
import { getPost, posts, formatDate } from "../lib/posts";
import "./styles/Post.css";

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
