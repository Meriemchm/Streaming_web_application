import React from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

const VideoPlayer = ({ src }) => {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    const player = videojs(videoRef.current, {
      controls: true,
      sources: [
        {
          src: src,
          type: "application/x-mpegURL",
        },
      ],
    });

    return () => {
      if (player) {
        player.dispose();
      }
    };
  }, [src]);

  return (
    <div>
      <video
        ref={videoRef}
        className="video-js vjs-default-skin"
        controls
        preload="auto"
      />
    </div>
  );
};

export default VideoPlayer;
