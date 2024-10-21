import os
import subprocess
from flask import Flask, jsonify

app = Flask(__name__)

# Répertoire de téléchargement des vidéos et des segments
video_upload_folder = r"C:\Users\M\Desktop\CMM\Streaming_web_application\server\uploads"
segment_folder = r"C:\Users\M\Desktop\CMM\Streaming_web_application\server\uploads\segments"

# Fonction de segmentation des vidéos avec FFmpeg
def segment_video(video_file):
    video_path = os.path.join(video_upload_folder, video_file)
    segment_path = os.path.join(segment_folder, video_file.split('.')[0])

    if not os.path.exists(segment_path):
        os.makedirs(segment_path)

    ffmpeg_command = [
        'ffmpeg', '-i', video_path, 
        '-c:v', 'libx264', '-hls_time', '10', '-hls_list_size', '0',
        '-f', 'hls', f'{segment_path}/playlist.m3u8'
    ]

    subprocess.run(ffmpeg_command)

# Endpoint pour récupérer les vidéos
@app.route('/getvideo', methods=['GET'])
def get_videos():
    videos = [f for f in os.listdir(video_upload_folder) if f.endswith('.mp4')]
    return jsonify(videos)

# Endpoint pour récupérer les segments d'une vidéo
@app.route('/segments/<video_id>', methods=['GET'])
def get_segments(video_id):
    segment_path = os.path.join(segment_folder, video_id)
    if os.path.exists(segment_path):
        segments = [f for f in os.listdir(segment_path) if f.endswith('.ts') or f.endswith('.m3u8')]
        return jsonify(segments)
    else:
        segment_video(f"{video_id}.mp4")
        segments = [f for f in os.listdir(segment_path) if f.endswith('.ts') or f.endswith('.m3u8')]
        return jsonify(segments)

if __name__ == '__main__':
    app.run(debug=True)
