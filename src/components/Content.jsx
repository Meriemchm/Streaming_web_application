// src/components/Content.jsx
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
    <div>
      {error && <p>{error}</p>}
      <h2>Liste des vidéos :</h2>
      <ul>
        {videos.map((videoUrl, index) => (
          <li key={index}>
            <p>{videoUrl}</p>
            <video width="500" height="320" src={videoUrl} controls>
              Votre navigateur ne supporte pas la lecture de cette vidéo.
            </video>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Content;
