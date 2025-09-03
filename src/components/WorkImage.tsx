import { useState } from "react";
import { MdArrowOutward } from "react-icons/md";

interface Props {
  image: string;
  alt?: string;
  video?: string;
  link?: string;
}

const WorkImage = (props: Props) => {
  const [isVideo, setIsVideo] = useState(!!props.video);
  const [video, setVideo] = useState(props.video || "");
  
  // Debug logging
  console.log('WorkImage rendered with props:', props);
  console.log('isVideo state:', isVideo);
  console.log('video state:', video);
  
  const handleMouseEnter = async () => {
    if (props.video) {
      setIsVideo(true);
      setVideo(props.video);
    }
  };

  const handleMouseLeave = () => {
  };

  return (
    <div className="work-image">
      <a
        className="work-image-in"
        href={props.link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        target="_blank"
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
            onError={(e) => {
              console.error('Video failed to load:', e);
              setIsVideo(false);
            }}
            onLoadStart={() => console.log('Video started loading')}
            onCanPlay={() => console.log('Video can play')}
            onPause={() => {
              // Force the video to resume if it gets paused
              const videoElement = e.target as HTMLVideoElement;
              videoElement.play();
            }}
            onEnded={() => {
              // Restart the video if it ends (though loop should handle this)
              const videoElement = e.target as HTMLVideoElement;
              videoElement.currentTime = 0;
              videoElement.play();
            }}
            style={{
              position: 'absolute',
              width: '120%',
              height: '100%',
              top: 0,
              left: 0,
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
