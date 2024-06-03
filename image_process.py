# # import sys
# # import logging
# # import tifffile
# # import imageio
# # import numpy as np
# # import io
# # import fiola_pipeline

# # # Setup basic logging
# # logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# # def process_avi_frames(avi_bytes):
# #     frames = []
# #     reader = imageio.get_reader(io.BytesIO(avi_bytes), 'avi')
# #     for frame in reader:
# #         frames.append(frame)
# #     return frames

# # def save_as_tiff(frames, output_path):
# #     tifffile.imwrite(output_path, np.array(frames), photometric='rgb')
# #     logging.info(f"TIFF image saved at {output_path}")

# # if __name__ == "__main__":
# #     all_frames = []
# #     output_tiff_path = "./constructed_image.tiff"

# #     # Read binary data from stdin
# #     input_data = sys.stdin.buffer.read()
# #     avi_bytes = np.frombuffer(input_data, dtype=np.uint8)

# #     # Process AVI frames
# #     frames = process_avi_frames(avi_bytes)
# #     all_frames.extend(frames)

# #     if all_frames:
# #         save_as_tiff(all_frames, output_tiff_path)
# #         logging.info("Starting Fiola pipeline")
# #         fiola_pipeline.run_pipeline(output_tiff_path)
# import sys
# import logging
# import tifffile
# import imageio
# import numpy as np
# import io
# import fiola_pipeline

# # Setup basic logging
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# def process_avi_frames(avi_bytes):
#     frames = []
#     reader = imageio.get_reader(io.BytesIO(avi_bytes), 'avi')
#     for frame in reader:
#         frames.append(frame)
#     return frames

# def save_as_tiff(frames, output_path):
#     tifffile.imwrite(output_path, np.array(frames), photometric='rgb')
#     logging.info(f"TIFF image saved at {output_path}")

# if __name__ == "__main__":
#     all_frames = []
#     output_tiff_path = "./constructed_image.tiff"

#     # Read binary data from stdin
#     input_data = sys.stdin.buffer.read()
#     avi_bytes = np.frombuffer(input_data, dtype=np.uint8)

#     # Process AVI frames
#     frames = process_avi_frames(avi_bytes)
#     all_frames.extend(frames)

#     if all_frames:
#         save_as_tiff(all_frames, output_tiff_path)
#         logging.info("Starting Fiola pipeline")
#         #fiola_pipeline.run_pipeline(output_tiff_path)

import sys
import logging
import tifffile
import imageio
import numpy as np
import io
import fiola_pipeline

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def process_avi_frames(avi_bytes):
    frames = []
    reader = imageio.get_reader(io.BytesIO(avi_bytes), 'avi')
    for frame in reader:
        frames.append(frame)
    return frames

def save_as_tiff(frames, output_path):
    non_empty_frames = [frame for frame in frames if frame is not None]
    tifffile.imwrite(output_path, np.array(non_empty_frames), photometric='rgb')
    logging.info(f"TIFF image saved at {output_path}")

if __name__ == "__main__":
    all_frames = []
    output_tiff_path = "./constructed_image.tiff"

    while True:
        try:
            # Read binary data from stdin
            input_data = sys.stdin.buffer.read()
            if not input_data:
                break

            avi_bytes = np.frombuffer(input_data, dtype=np.uint8)

            # Process AVI frames
            frames = process_avi_frames(avi_bytes)
            all_frames.extend(frames)
        except EOFError:
            break

    if all_frames:
        save_as_tiff(all_frames, output_tiff_path)
        logging.info("Starting Fiola pipeline")
        fiola_pipeline.run_pipeline(output_tiff_path)
