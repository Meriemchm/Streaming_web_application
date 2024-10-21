import React, { useEffect, useState } from "react";

const Content = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [debugMessage, setDebugMessage] = useState(""); // Pour afficher un message de débogage

  const apiUrl = "http://192.168.191.49:3000";

  useEffect(() => {
    const fetchVideos = async () => {
      setDebugMessage("Je suis dans fetchVideos"); // Définir un message de débogage
      
      try {
        console.log(`Fetching videos from: ${apiUrl}/getvideo`);
        const response = await fetch(`${apiUrl}/getvideo`);
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des vidéos");
        }

        const data = await response.json();
        console.log("Vidéos récupérées :", data);
        setVideos(data);
        setDebugMessage("Vidéos récupérées avec succès");
      } catch (err) {
        setError(err.message);
        setDebugMessage(`Erreur: ${err.message}`);
      }
    };

    fetchVideos();
  }, [apiUrl]);

  return (
    <div className="w-full p-4">
      {/* Afficher le message de débogage */}
      <h1>{debugMessage}</h1>

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
