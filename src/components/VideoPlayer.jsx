import React, { useState, useEffect, useRef } from "react";
import {
  checkBandwidthWithFirstSegment,
  loadVideoSegments,
  calculateTotalDuration,
} from "./videoUtils";

function VideoPlayer({ videoId }) {
  const [resolution, setResolution] = useState("480p");
  const [videoSources, setVideoSources] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const videoPlayerRef = useRef(null);
  const serverIp = import.meta.env.VITE_SERVER_IP;

  useEffect(() => {
    //checkBandwidthWithFirstSegment(serverIp, videoId, setResolution);
    loadVideoSegments(
      serverIp,
      videoId,
      resolution,
      setVideoSources,
      setCurrentSegmentIndex,
      (segments) => {
        calculateTotalDuration(segments, setTotalDuration);
        generateThumbnails(segments); // Générer image pour chaque segment
      }
    );
  }, [resolution]);

  useEffect(() => {
    const loadSegment = async () => {
      if (videoPlayerRef.current && videoSources.length > 0) {
        const currentSegmentUrl = videoSources[currentSegmentIndex];
        videoPlayerRef.current.src = currentSegmentUrl;
        videoPlayerRef.current.play();
      }
    };
    loadSegment();
  }, [currentSegmentIndex, videoSources]);

  const handleVideoEnd = () => {
    setCurrentSegmentIndex((prevIndex) => {
      if (prevIndex < videoSources.length - 1) {
        return prevIndex + 1;
      } else {
        return 0;
      }
    });
  };

  useEffect(() => {
    const videoPlayer = videoPlayerRef.current;
    if (videoPlayer) {
      videoPlayer.addEventListener("ended", handleVideoEnd);
    }
    return () => {
      if (videoPlayer) {
        videoPlayer.removeEventListener("ended", handleVideoEnd);
      }
    };
  }, [videoSources]);

  const handleSliderChange = (event) => {
    const newIndex = parseInt(event.target.value, 10);
    setCurrentSegmentIndex(newIndex);
  };

  // Fonction pour générer image à partir d'un segment vidéo
  const generateThumbnailFromVideo = (videoUrl, time) => {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.currentTime = time;
    video.crossOrigin = "anonymous"; 

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    return new Promise((resolve) => {
      video.onloadeddata = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL("image/png");
        resolve(thumbnailUrl);
      };
    });
  };

  // Fimage pour tous les segments
  const generateThumbnails = (segments) => {
    const thumbnailPromises = segments.map((segmentUrl, index) => {
      return generateThumbnailFromVideo(segmentUrl, 2) // Capturer une image au temps 2 secondes
        .then((thumbnailUrl) => {
          return { index, thumbnailUrl };
        });
    });

    Promise.all(thumbnailPromises).then((thumbnailsData) => {
      setThumbnails(thumbnailsData);
    });
  };

  // en cliquant sur l'image
  const goToSegment = (index) => {
    setCurrentSegmentIndex(index);
  };

  // changer la résolution
  const handleResolutionChange = (event) => {
    setResolution(event.target.value);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center p-4 bg-gray-100">
      <div className="flex flex-col items-center justify-center ">
        {/* Dropdown*/}
        <select
          value={resolution}
          onChange={handleResolutionChange}
          className="mb-4 p-2 border rounded"
        >
          <option value="480p">480p</option>
          <option value="720p">720p</option>
          <option value="1080p">1080p</option>
        </select>

        {/* Lecteur vidéo */}
        <video
          ref={videoPlayerRef}
          controls
          className="w-full mb-4 rounded-lg shadow-lg"
          crossOrigin="anonymous" // CORS
        />

        <div className="text-center">
          <p className="text-lg font-semibold">
            Total Duration:{" "}
            <span className="font-normal">
              {totalDuration.toFixed(2)} seconds
            </span>
          </p>
          <p className="text-lg font-semibold">
            Resolution: <span className="font-normal">{resolution}</span>
          </p>
          <p className="text-lg font-semibold">
            Current Segment:{" "}
            <span className="font-normal">
              {currentSegmentIndex + 1} of {videoSources.length}
            </span>
          </p>
          <input
            type="range"
            min="0"
            max={videoSources.length - 1}
            value={currentSegmentIndex}
            onChange={handleSliderChange}
            className="w-full mt-4"
          />
        </div>
      </div>

      {/* images */}
      <div className="mt-4">
        <div className="flex md:flex-col justify-center items-center">
          {thumbnails.map(({ index, thumbnailUrl }) => (
            <button
              key={index}
              onClick={() => goToSegment(index)}
              className={`border-2 ${
                currentSegmentIndex === index
                  ? "border-blue-500"
                  : "border-transparent"
              } rounded-md`}
            >
              <img
                src={thumbnailUrl}
                alt={`Segment ${index + 1}`}
                className="md:w-80 md:h-24 h-16 w-16 object-cover rounded-md"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
