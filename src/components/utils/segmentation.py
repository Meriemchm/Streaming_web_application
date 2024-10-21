import os
import subprocess

def segment_video(input_file, output_dir, segment_length=10):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    output_pattern = os.path.join(output_dir, "output%03d.mp4")

    command = [
        "ffmpeg",
        "-i", input_file,
        "-c", "copy",
        "-map", "0",
        "-segment_time", str(segment_length),
        "-f", "segment",
        "-reset_timestamps", "1",
        output_pattern
    ]
    
    try:
        subprocess.run(command, check=True)
        print(f"Segmentation terminée. Segments sauvegardés dans {output_dir}")
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de la segmentation : {e}")

if __name__ == "__main__":
    input_folder = r"Streaming_web_application\server\uploads"  # Utilisation d'une chaîne brute
    output_folder = r"Streaming_web_application\server\uploads\segments"  # Chaîne brute

    for video_file in os.listdir(input_folder):
        if video_file.endswith(".mp4"):
            input_video = os.path.join(input_folder, video_file)
            video_output_folder = os.path.join(output_folder, os.path.splitext(video_file)[0])
            segment_video(input_video, video_output_folder)
