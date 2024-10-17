import React, { useEffect, useState } from "react";

const Content = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  // URL de l'API
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(`${apiUrl}/getvideo`);
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des vidéos");
        }
        const data = await response.json();
        setVideos(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchVideos();
  }, [apiUrl]);

  return (
    <div className="w-full p-4">
      {error && <p className="text-red-500">{error}</p>}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Liste des vidéos :
      </h2>
      <ul className="grid grid-cols-1 gap-6">
        {videos.map((videoUrl, index) => (
          <li key={index} className="bg-white shadow-md rounded-lg p-4">
            <p className="text-gray-700 truncate mb-2">{videoUrl}</p>
            <video className="w-full h-auto" src={videoUrl} controls>
              Votre navigateur ne supporte pas la lecture de cette vidéo.
            </video>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Content;
