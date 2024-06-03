# import sys
# import imageio
# import numpy as np
# from imageio_ffmpeg import read_frames

# def convert_avi_to_tiff(input_buffer, output_path):
#     # Create a reader for the AVI buffer
#     reader = imageio.get_reader(input_buffer, 'avi')
    
#     frames = []
#     for frame in reader:
#         # Convert each frame to a numpy array and append to the frames list
#         frames.append(frame)

#     # Write frames to a TIFF file
#     imageio.mimwrite(output_path, frames, format='TIFF')

# if __name__ == "__main__":
#     output_path = sys.argv[1]
#     buffer = sys.stdin.buffer.read()

#     convert_avi_to_tiff(buffer, output_path)
#     print(f'TIFF image saved at {output_path}')
import sys
import imageio
import numpy as np
from io import BytesIO

def convert_avi_to_tiff(input_buffer, output_path):
    # Create a reader for the AVI buffer
    reader = imageio.get_reader(input_buffer, 'avi')
    
    frames = []
    for frame in reader:
        # Convert each frame to a numpy array and append to the frames list
        frames.append(frame)

    # Write frames to a TIFF file
    imageio.mimwrite(output_path, frames, format='TIFF')

if __name__ == "__main__":
    output_path = sys.argv[1]
    buffer = BytesIO(sys.stdin.buffer.read())

    convert_avi_to_tiff(buffer, output_path)
    print(f'TIFF image saved at {output_path}')
