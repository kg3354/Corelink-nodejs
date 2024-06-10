# Closed Loop Research Overview

## Introduction

Closed loop research, also known as real-time application research, is a cutting-edge approach designed to enhance the efficiency and innovative potential of scientific studies through real time integration of feedback from data processing, fostering innovation and interdisciplinary collaboration.  For example, in a neuroscience study investigating neural activity patterns, researchers can use closed loop systems to modify stimulation parameters at real time as they observe changes in brain activity. This could involve adjusting the intensity, frequency, or duration of experiment parameters or stimuli based on the immediate feedback received from neuroimaging data. 


## High-Level Workflow Overview
The workflow involves a streamlined process where experimental data is captured, processed, and analyzed in real time, allowing immediate adjustments to be made to ongoing research parameters. This process utilizes a low latency (40 microsecond RTT) network and a series of interconnected platforms that work together to ensure seamless operation.

## Components
- Data Acquisition Node (DAQ):  Traditionally serving as the primary component for data capture within experiments, the DAQ node collects a variety of data forms, including images and sensor outputs. In conventional setups, this node operates in batch mode, where it accumulates data throughout the experiment, which is subsequently sent for analysis post-experimentation. However, in our proposed framework, the DAQ node is enhanced with real-time processing capabilities. It not only captures the data but also actively engages with it, analyzing and utilizing immediate feedback to dynamically adjust experimental conditions. 

- High-Speed Research Network (HSRN): A dedicated research network that connects data acquisition nodes and HPC resources, enabling fast data transfer and communication. The HSRN connects NYU buildings with 2x400G uplinks, with up to 100G optical fiber directly to specially equipped research DAQs, servers and workstations. 

- Corelink: A programmable low-latency messaging platform. It is intended to be a powerful communication layer to connect real-time applications such as audio, video, motion capture, virtual reality, etc. Instead of creating ad-hoc communication protocols, Corelink allows the connection of many various types of applications, taking care of selecting the streams that application can consume based on their metadata. Corelink also allows the user to wire streams on the fly and inserting plugins that process, filter, mix, or re-encode streams on the server.

    - Corelink Raw Image Workspace: In this case study, this is where raw data from DAQ nodes, such as images or sensor readings, are initially published.

    - Control Workspace: After processing, the results and any actionable commands are published to this workspace, which the DAQ node subscribes to for feedback and parameter adjustment.

- Docker: A containerization platform that packages the analysis software, ensuring consistency across different computing environments.

- Kubernetes: A container orchestration system that manages applications, ensuring they run efficiently and scale as needed.It provides the ecosystem for managing Docker containers and can run batch jobs or long-term services.
        
    - Kubernetes Batch Jobs: For tasks that need to run to completion, such as processing a dataset.
        
    - Kubernetes Services: Services are abstractions that define a logical set of pods (the smallest deployable units in Kubernetes) and a policy by which to access them, such as load-balancing.


## Process Flow

1. Data Capture: Data is captured by the DAQ using specialized equipment tailored for the specific experimental needs.
2. Data Streaming: The captured data is streamed in real time over HSRN using Corelink producers. It is published to a "raw data" workspace from where it can be consumed by the processing units.
3. Data Processing: Kubernetes orchestrates containers that pull raw data from the Corelink raw data workspace, process it, and output the results. These results are then published to the control workspace on Corelink that transmites processed data.
4. Feedback Loop: The DAQ subscribes to the control workspace, and the results from data processing are being received in real time, allowing adjustments to be made to research parameters through experiment instrumentation.  


## Sample Application of Real Time Research

The Fenton Lab is a neurobiology of cognition laboratory that studies how brains store experiences as memories, and how the expression of knowledge activates information that is relevant without activating what is irrelevant. In collaboration with the Fenton Lab, we have demonstrated a practical application of real-time research, showcasing the integration of modern technology in neuroscience.


### Sample Process Flow:
- **Data Capture**: The DAQ Node, equipped with specialized camera software named MINISCOPE, captures neuroscience images.

- **Data Streaming**: The captured neuroscience images are stored on disk for further experimental needs. Using the Chokidar JavaScript library, the uncompressed video data is captured and sent to the Corelink raw data workspace via HSRN. A JavaScript Corelink Receiver on the HSRN Kubernetes cluster subscribes to the raw image workspace and generates a TIFF file every thousand frames received from the workspace by passing the buffer to a Python child process. This step is necessary because the FIOLA pipeline is written in Python, and passing a buffer avoids additional disk I/O.

- **Data Processing**: A specialized container running the FIOLA pipeline, an accelerated pipeline for fluorescence imaging online analysis, processes the images and publishes the output to the Corelink Result workspace.

- **Feedback Loop**: The DAQ Node subscribes to the control workspace and translates the processed data into immediate modifications or actions within the ongoing experiment.

The corresponding files in this directory are:
- watch_and_send.js
- receive_then_fiola.js
- conert_avi_to_tiff.py
- fiola_pipeline.py

Please refer to FIOLA's official github page for installation guide 

## Conclusion
Adopting the closed loop research framework leverages advanced technology to elevate the research process, making it more dynamic and responsive to immediate data. This general guide serves as a starting point for researchers to engage with real-time adaptive experimentation using modern data streaming and containerization technologies. 

## Getting Started with Real-Time Adaptive Research

- Understand Corelink: Get acquainted with Corelink's real-time messaging capabilities.
- Learn Docker: Familiarize yourself with containerization concepts and Docker usage.
- Explore Kubernetes: Understand the basics of Kubernetes for managing containers.

For details on how HSRN achieves Real Time Application Research, please refer to the next documentation. 

