import React, { useState } from 'react';

const VideoSegmentation = () => {
    const [message, setMessage] = useState('');

    const handleSegmentVideo = async (videoFile) => {
        try {
            const response = await fetch('http://127.0.0.1:5000/segment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_file: videoFile }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
            } else {
                setMessage(data.message || 'Erreur inconnue');
            }
        } catch (error) {
            setMessage('Erreur de connexion au serveur');
        }
    };

    return (
        <div>
            <h1>Segmentation de Vidéo</h1>
            <button onClick={() => handleSegmentVideo('nom_de_ton_video.mp4')}>
                Segmenter la Vidéo
            </button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default VideoSegmentation;
