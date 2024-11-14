import React, { useState, useEffect, useRef } from "react";
import { calculateTotalDuration,loadVideoSegments,generateThumbnails } from "./videoUtils";

function VideoPlayer({ videoId }) {
  const [resolutions, setResolutions] = useState([]); // Available resolutions
  const [resolution, setResolution] = useState("");
  const [videoSources, setVideoSources] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const videoPlayerRef = useRef(null);
  const serverIp = import.meta.env.VITE_SERVER_IP;

  // Fetch available resolutions
  useEffect(() => {
    const fetchResolutions = async () => {
      try {
        const response = await fetch(`http://${serverIp}:3000/video/resolutions/${videoId}`);
        const data = await response.json();
        if (response.ok) {
          setResolutions(data.resolutions);
          setResolution(data.resolutions[0] || "480p"); // Select the first available resolution
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error("Error fetching resolutions:", error);
      }
    };
    fetchResolutions();
  }, [videoId]);

  // Load video segments based on resolution
  useEffect(() => {
    if (resolution) {
      loadVideoSegments(
        serverIp,
        videoId,
        resolution,
        setVideoSources,
        setCurrentSegmentIndex,
        (segments) => {
          calculateTotalDuration(segments, setTotalDuration);
          generateThumbnails(segments, setThumbnails); // Generate thumbnails
        }
      );
    }
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
        return 0; // Loop to the first segment
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

  const goToSegment = (index) => {
    setCurrentSegmentIndex(index);
  };

  const handleResolutionChange = (event) => {
    setResolution(event.target.value);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center p-4 bg-gray-100">
      <div className="flex flex-col items-center justify-center">
        {/* Dynamic dropdown for resolutions */}
        <select
          value={resolution}
          onChange={handleResolutionChange}
          className="mb-4 p-2 border rounded"
        >
          {resolutions.map((res) => (
            <option key={res} value={res}>
              {res}
            </option>
          ))}
        </select>

        {/* Video player */}
        <video
          ref={videoPlayerRef}
          controls
          className="w-full mb-4 rounded-lg shadow-lg"
          crossOrigin="anonymous"
        />

        <div className="text-center">
          <p className="text-lg font-semibold">
            Total Duration: {totalDuration.toFixed(2)} seconds
          </p>
          <p className="text-lg font-semibold">
            Current Segment: {currentSegmentIndex + 1} of {videoSources.length}
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

      {/* Thumbnails of the segments */}
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
