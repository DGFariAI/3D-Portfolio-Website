import { useState } from "react";
import { MdArrowOutward } from "react-icons/md";

interface Props {
  image: string;
  alt?: string;
  video?: string;
  link?: string;
  videoLeft?: number;
}

const WorkImage = (props: Props) => {
  const [isVideo, setIsVideo] = useState(!!props.video);
  const [video, setVideo] = useState(props.video || "");

  const handleMouseEnter = () => {
    if (props.video) {
      setIsVideo(true);
      setVideo(props.video);
    }
  };

  return (
    <div className="work-image">
      <a
        className="work-image-in"
        href={props.link}
        onMouseEnter={handleMouseEnter}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor={"disable"}
      >
        {props.link && (
          <div className="work-link">
            <MdArrowOutward />
          </div>
        )}
        <img src={props.image} alt={props.alt} />
        {isVideo && video && (
          <video
            src={video}
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            onError={() => setIsVideo(false)}
            style={{
              position: 'absolute',
              width: '120%',
              height: '100%',
              top: 0,
              left: props.videoLeft || 0,
              backgroundColor: '#000',
              objectFit: 'cover',
              zIndex: 1
            }}
          />
        )}
      </a>
    </div>
  );
};

export default WorkImage;
