from flask import Flask, jsonify
import os
import subprocess

app = Flask(__name__)

@app.route('/segment-videos', methods=['POST'])
def segment_videos():
    input_folder = r"C:\Users\M\Desktop\CMM\Streaming_web_application\server\uploads"
    output_folder = r"C:\Users\M\Desktop\CMM\Streaming_web_application\server\segments"

    os.makedirs(output_folder, exist_ok=True)

    for filename in os.listdir(input_folder):
        if filename.endswith(".mp4"):
            video_path = os.path.join(input_folder, filename)
            video_output_folder = os.path.join(output_folder, os.path.splitext(filename)[0])
            os.makedirs(video_output_folder, exist_ok=True)
            playlist_path = os.path.join(video_output_folder, "playlist.m3u8")
            
            command = [
                'ffmpeg',
                '-i', video_path,
                '-codec', 'copy',
                '-start_number', '0',
                '-hls_time', '10',
                '-hls_list_size', '0',
                '-f', 'hls',
                playlist_path
            ]
            
            # Exécuter la commande FFmpeg
            subprocess.run(command)

    return jsonify({"message": "Segmentation terminée."})

if __name__ == '__main__':
    app.run(debug=True)
