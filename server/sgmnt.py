import os
import subprocess

# Chemin vers le dossier contenant les vidéos MP4
input_folder = r"C:\Users\M\Desktop\CMM\Streaming_web_application\server\uploads"
# Chemin vers le dossier de sortie pour les segments
output_folder = r"C:\Users\M\Desktop\CMM\Streaming_web_application\server\segments"

# Créer le dossier de sortie s'il n'existe pas
os.makedirs(output_folder, exist_ok=True)

# Parcourir tous les fichiers dans le dossier d'entrée
for filename in os.listdir(input_folder):
    if filename.endswith(".mp4"):
        video_path = os.path.join(input_folder, filename)
        
        # Créer un dossier pour chaque vidéo
        video_output_folder = os.path.join(output_folder, os.path.splitext(filename)[0])
        os.makedirs(video_output_folder, exist_ok=True)
        
        # Chemin vers le fichier de playlist .m3u8
        playlist_path = os.path.join(video_output_folder, "playlist.m3u8")
        
        # Commande FFmpeg pour segmenter la vidéo
        command = [
            'ffmpeg',
            '-i', video_path,
            '-codec', 'copy',  # Correction ici
            '-start_number', '0',
            '-hls_time', '10',
            '-hls_list_size', '0',
            '-f', 'hls',
            playlist_path
        ]
        
        # Exécuter la commande FFmpeg
        subprocess.run(command)

print("Segmentation terminée.")
