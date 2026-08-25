import { Link } from "react-router-dom";
import { PiArrowLeftBold } from "react-icons/pi";
import SEO from "../components/SEO";
import "./styles/ComingSoon.css";
import BrandCursor from "../components/BrandCursor";

interface Props {
  name: string;
  logo?: string;
  blurb: string;
  path: string;
  description: string;
}

/**
 * Holding page for a product that is announced but not shipped.
 *
 * Written as a component with props rather than a page hardcoded to DGFari AI,
 * because the hub already implies more of these are coming: a second one is a
 * route and four lines, not a new file.
 */
const ComingSoon = ({ name, logo, blurb, path, description }: Props) => (
  <div className="soon">
    <BrandCursor />
    <SEO title={`${name} | Coming soon`} description={description} path={path} />

    <div className="soon-inner">
      {logo && <img className="soon-mark" src={logo} alt="" width={72} height={72} />}

      <span className="soon-tag">Coming soon</span>
      <h1>{name}</h1>
      <p className="soon-blurb">{blurb}</p>

      <div className="soon-rule" aria-hidden="true">
        <span />
        <svg viewBox="0 0 24 24">
          <path d="M12 0c.8 6.2 5 10.4 11.2 11.2v1.6C17 13.6 12.8 17.8 12 24c-.8-6.2-5-10.4-11.2-11.2v-1.6C7 10.4 11.2 6.2 12 0z" />
        </svg>
        <span />
      </div>

      <Link className="soon-back" to="/" data-cursor="disable">
        <PiArrowLeftBold aria-hidden="true" />
        Back to the hub
      </Link>
    </div>
  </div>
);

export default ComingSoon;
