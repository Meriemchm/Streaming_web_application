import React, { useState, useRef } from "react";

const Form = () => {
  const [selectedResolutions, setSelectedResolutions] = useState({
    "480p": false,
    "720p": false,
    "1080p": false,
  });
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const apiUrl = import.meta.env.VITE_SERVER_IP;

  // Référence pour l'élément vidéo
  const videoRef = useRef(null);

  // Gérer le changement des résolutions sélectionnées
  const handleResolutionChange = (event) => {
    const { name, checked } = event.target;
    setSelectedResolutions((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  // Gérer le téléversement de la vidéo
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!videoFile) {
      alert("Veuillez sélectionner une vidéo.");
      return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);

    // Ajout des résolutions sélectionnées
    const selectedRes = Object.keys(selectedResolutions).filter(
      (key) => selectedResolutions[key]
    );
    formData.append("resolutions", JSON.stringify(selectedRes));

    try {
      const response = await fetch(`http://${apiUrl}:3000/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert("Vidéo téléversée et segmentée avec succès !");
        console.log("Réponse du serveur :", data);
      } else {
        throw new Error("Erreur lors du téléversement de la vidéo.");
      }
    } catch (error) {
      console.error("Erreur lors du téléversement :", error);
      alert("Erreur lors du téléversement de la vidéo.");
    }
  };

  // Mettre à jour la durée de la vidéo lorsque le fichier est sélectionné
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setVideoFile(file);

    // Charger la vidéo et obtenir sa durée
    const video = videoRef.current;
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      setEndTime(Math.floor(video.duration));  // Arrondir la durée à un entier
    };
  };

  return (
    <div className="flex flex-col justify-center items-center w-full min-h-screen p-4 bg-gray-100">
      <form
        className="flex flex-col w-full max-w-md p-6 bg-white rounded-lg shadow-md"
        onSubmit={handleUpload}
      >
        <label className="mb-4 text-lg font-semibold text-gray-700">
          Sélectionnez une vidéo :
        </label>
        <input
          type="file"
          name="video"
          accept="video/*"
          onChange={handleVideoChange} // Utilisez la fonction handleVideoChange
          className="py-2 px-4 mb-6 border border-gray-300 rounded-lg"
          required
        />
        {/* Ajoutez l'élément vidéo pour récupérer la durée */}
        <video ref={videoRef} className="hidden" />

        {/* Sélection des résolutions */}
        <label className="mb-4 text-lg font-semibold text-gray-700">
          Choisissez les résolutions :
        </label>
        <div className="flex flex-col mb-6">
          {["480p", "720p", "1080p"].map((res) => (
            <div key={res} className="flex items-center mb-2">
              <input
                type="checkbox"
                name={res}
                checked={selectedResolutions[res]}
                onChange={handleResolutionChange}
                className="mr-2"
              />
              <label>{res}</label>
            </div>
          ))}
        </div>

        {/* Sélection de la plage temporelle */}
        <div className="flex space-x-4 mb-6">
          <div className="flex flex-col">
            <label>Début (s) :</label>
            <input
              type="number"
              min="0"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="py-2 px-4 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <label>Fin (s) :</label>
            <input
              type="number"
              min="0"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="py-2 px-4 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <button
          type="submit"
          className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500"
        >
          Téléverser la vidéo
        </button>
      </form>
    </div>
  );
};

export default Form;
