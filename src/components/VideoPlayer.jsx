import React, { useState, useEffect, useRef } from "react";
import {
  checkBandwidthWithFirstSegment,
  loadVideoSegments,
  calculateTotalDuration
} from "./videoUtils";

function VideoPlayer({ videoId }) {
  const [resolution, setResolution] = useState("480p");
  const [videoSources, setVideoSources] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const videoPlayerRef = useRef(null);
  const serverIp = import.meta.env.VITE_SERVER_IP;

  useEffect(() => {
    checkBandwidthWithFirstSegment(serverIp, videoId, setResolution);
    loadVideoSegments(serverIp, videoId, resolution, setVideoSources, setCurrentSegmentIndex, (segments) => calculateTotalDuration(segments, setTotalDuration));
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

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100">
      <video
        ref={videoPlayerRef}
        controls
        autoPlay
        className="w-full mb-4 rounded-lg shadow-lg"
      />
      <div className="text-center">
        <p className="text-lg font-semibold">
          Total Duration: <span className="font-normal">{totalDuration.toFixed(2)} seconds</span>
        </p>
        <p className="text-lg font-semibold">Resolution: <span className="font-normal">{resolution}</span></p>
        <p className="text-lg font-semibold">
          Current Segment: <span className="font-normal">{currentSegmentIndex + 1} of {videoSources.length}</span>
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
  );
}

export default VideoPlayer;
