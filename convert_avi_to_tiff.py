# import sys
# import imageio
# import numpy as np
# from io import BytesIO

# def convert_avi_to_tiff(input_buffer, output_path):
#     try:
#         # Create a reader for the AVI buffer
#         reader = imageio.get_reader(input_buffer, 'avi')
        
#         frames = []
#         for frame in reader:
#             # Convert each frame to a numpy array and append to the frames list
#             frames.append(frame)

#         # Write frames to a TIFF file
#         imageio.mimwrite(output_path, frames, format='TIFF')
#     except Exception as e:
#         print(f"Error processing AVI buffer: {e}", file=sys.stderr)
#         sys.exit(1)

# if __name__ == "__main__":
#     output_path = sys.argv[1]
#     buffer = BytesIO(sys.stdin.buffer.read())

#     convert_avi_to_tiff(buffer, output_path)
#     print(f'TIFF image saved at {output_path}')
import sys
import imageio
import numpy as np
from io import BytesIO

def process_frames(input_buffer):
    try:
        reader = imageio.get_reader(input_buffer, 'avi')
        frames = []
        for i, frame in enumerate(reader):
            try:
                frames.append(frame)
            except Exception as frame_error:
                print(f"Error processing frame {i}: {frame_error}", file=sys.stderr)
        return frames
    except Exception as e:
        print(f"Error reading AVI buffer: {e}", file=sys.stderr)
        return None

def convert_avi_to_tiff(input_buffer, output_path):
    frames = process_frames(input_buffer)
    while frames is None:
        # Retry processing the AVI buffer if reading frames failed
        print("Retrying processing the AVI buffer...", file=sys.stderr)
        frames = process_frames(input_buffer)
    
    if frames:
        try:
            # Write frames to a TIFF file
            imageio.mimwrite(output_path, frames, format='TIFF')
            print(f'TIFF image saved at {output_path}')
        except Exception as e:
            print(f"Error writing TIFF file: {e}", file=sys.stderr)
    else:
        print("No frames were successfully processed.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <output_path>", file=sys.stderr)
        sys.exit(1)

    output_path = sys.argv[1]
    buffer = BytesIO(sys.stdin.buffer.read())

    convert_avi_to_tiff(buffer, output_path)
