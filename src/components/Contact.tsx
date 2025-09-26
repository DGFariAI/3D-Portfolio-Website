import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";

const Contact = () => {
  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>Contact</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href="mailto:dgfari28@gmail.com" data-cursor="disable">
                dgfari28@gmail.com
              </a>
            </p>
            <h4>Location</h4>
            <p>
              <a href="location:baguio city, philippines" data-cursor="disable">
                Baguio City, Philippines
              </a>
            </p>
          </div>
          <div className="contact-box">
            <h4>Social</h4>
            <a
              href="https://linkedin.com/in/danica-gabriella-fariñas-melecio-itsdgfari"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Linkedin <MdArrowOutward />
            </a>
            <a
              href="https://www.instagram.com/itsdgfari/"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Instagram <MdArrowOutward />
            </a>
            <a
              href="https://www.facebook.com/itsdgfari/"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Facebook <MdArrowOutward />
            </a>
            <a
              href="https://www.youtube.com/@itsdgfari"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              YouTube <MdArrowOutward />
            </a>
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>Danica Gabriella</span>
            </h2>
            <h5>
              <MdCopyright /> 2025
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
