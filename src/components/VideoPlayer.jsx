import React, { useState, useEffect, useRef } from "react";
import {
  calculateTotalDuration,
  loadVideoSegments,
  generateThumbnails,
  checkSegmentExists,
  checkBandwidthWithFirstSegment,
  generateRandomSpeed,
} from "./videoUtils";

function VideoPlayer({ videoId, speed }) {
  const [resolutions, setResolutions] = useState([]);
  const [resolution, setResolution] = useState("");
  const [videoSources, setVideoSources] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoPlayerRef = useRef(null);
  const serverIp = import.meta.env.VITE_SERVER_IP;
  // console.log("not main ", (speed / 1000000).toFixed(2));

  // Fetch resolutions

  useEffect(() => {
    const fetchResolutionsAndSetBest = async () => {
      try {
        const response = await fetch(
          `http://${serverIp}:3000/video/resolutions/${videoId}`
        );
        const data = await response.json();

        if (response.ok) {
          const availableResolutions = data.resolutions;
          setResolutions(availableResolutions);

          if (availableResolutions.length > 0) {
            await checkBandwidthWithFirstSegment(
              serverIp,
              videoId,
              speed,
              availableResolutions,
              (bestResolution) => {
                setResolution(bestResolution);
              }
            );
          } else {
            setResolution("480p");
          }
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error("Error fetching resolutions:", error);
      }
    };

    fetchResolutionsAndSetBest();
  }, [videoId, speed]);

  // Load video segments
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
          generateThumbnails(segments, setThumbnails);
        }
      );
    }
  }, [resolution]);

  const loadValidSegment = async (videoSources, currentIndex) => {
    while (currentIndex < videoSources.length) {
      const segmentUrl = videoSources[currentIndex];
      const exists = await checkSegmentExists(segmentUrl);
      if (exists) {
        return currentIndex; // existe
      }
      // passe au suivant
      currentIndex++;
    }
    return -1; // d=fin
  };

  // segments
  useEffect(() => {
    const loadSegment = async () => {
      if (videoPlayerRef.current && videoSources.length > 0) {
        let validIndex = await loadValidSegment(
          videoSources,
          currentSegmentIndex
        );

        // valid
        if (validIndex !== -1) {
          const currentSegmentUrl = videoSources[validIndex];
          videoPlayerRef.current.src = currentSegmentUrl;
          setCurrentSegmentIndex(validIndex); // ma segment actuel
        } else {
          // debut
          setCurrentSegmentIndex(0);
        }

        if (isPlaying) {
          videoPlayerRef.current.play();
        }
      }
    };
    loadSegment();
  }, [currentSegmentIndex, videoSources, isPlaying]);

  const handleVideoEnd = () => {
    setCurrentSegmentIndex((prevIndex) => {
      if (prevIndex < videoSources.length - 1) {
        return prevIndex + 1;
      } else {
        return 0; // dernier
      }
    });
  };

  //play handle

  useEffect(() => {
    const videoPlayer = videoPlayerRef.current;
    if (videoPlayer) {
      videoPlayer.addEventListener("ended", handleVideoEnd);
      videoPlayer.addEventListener("play", () => setIsPlaying(true));
    }
    return () => {
      if (videoPlayer) {
        videoPlayer.removeEventListener("ended", handleVideoEnd);
        videoPlayer.removeEventListener("play", () => setIsPlaying(true));
      }
    };
  }, [videoSources]);

  const handleResolutionChange = (event) => {
    setResolution(event.target.value);
  };
  const handleSliderChange = async (event) => {
    let newIndex = parseInt(event.target.value, 10);
    let validIndex = await loadValidSegment(videoSources, newIndex);
    if (validIndex !== -1) {
      setCurrentSegmentIndex(validIndex);
    }
  };

  const goToSegment = (index) => {
    setCurrentSegmentIndex(index);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center p-4 bg-gray-100">
      <div className="flex flex-col items-center justify-center">
        {/* Dropdown for resolution */}
        <select
          value={resolution}
          onChange={handleResolutionChange}
          className="mb-4 p-2 border rounded"
        >
          {resolutions
            .sort((a, b) => parseInt(b) - parseInt(a)) // Trier de la plus grande à la plus petite
            .map((res) => (
              <option key={res} value={res}>
                {res}
              </option>
            ))}
        </select>

        {/* Video Player */}
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

      <div className="mt-4">
        <div className="flex md:flex-col justify-center items-center">
          {thumbnails.map(({ index, thumbnailUrl, isAvailable, size }) => (
            <div key={index} className="flex flex-col items-center">
              {/* Afficher la taille en Mo */}
              <p className="text-sm text-gray-500">
                {size
                  ? `${(size / (1024 * 1024)).toFixed(2)} MB`
                  : "Loading..."}
              </p>
              <button
                onClick={isAvailable ? () => goToSegment(index) : undefined}
                className={`border-2 ${
                  currentSegmentIndex === index
                    ? "border-blue-500"
                    : "border-transparent"
                } rounded-md ${
                  isAvailable ? "" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <img
                  src={thumbnailUrl}
                  alt={`Segment ${index + 1}`}
                  className="md:w-80 md:h-24 h-16 w-16 object-cover rounded-md"
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
