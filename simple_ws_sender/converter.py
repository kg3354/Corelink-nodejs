import cv2
import os

def avi_to_tiff(video_path, output_folder):
    # Create the output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Load the video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Construct the filename for each frame
        filename = os.path.join(output_folder, f"frame_{frame_idx:04d}.tiff")
        
        # Save the frame as a TIFF file
        cv2.imwrite(filename, frame)
        print(f"Saved {filename}")
        
        frame_idx += 1

    cap.release()
    print("Conversion completed.")

# Example usage
avi_to_tiff('1.avi', 'output_frames')

