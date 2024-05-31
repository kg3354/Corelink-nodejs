# -*- coding: utf-8 -*-


import sys

"""# Installation"""
sys.path.append('/usr/src/app/CaImAn')
from base64 import b64encode
import caiman as cm
from IPython.display import HTML, clear_output
import imageio
import logging
import matplotlib.pyplot as plt
import numpy as np
import pyximport
pyximport.install()
import scipy
from tensorflow.python.client import device_lib
from time import time
from fiola.demo_initialize_calcium import run_caiman_init
from fiola.fiolaparams import fiolaparams
from fiola.fiola import FIOLA
from fiola.utilities import download_demo, load, to_2D, movie_iterator

import pickle
from confluent_kafka import Producer
import json
from datetime import datetime
import logging
import os



logging.basicConfig(format=
                    "%(relativeCreated)12d [%(filename)s:%(funcName)20s():%(lineno)s]"\
                    "[%(process)d] %(message)s",
                    level=logging.INFO)
logging.info(device_lib.list_local_devices()) # if GPU is not detected, try to reinstall tensorflow with pip install tensorflow==2.4.1


def run_pipeline(file_name):
    """# Set up parameters"""
    folder = ''
    mode = 'calcium'                    # 'voltage' or 'calcium 'fluorescence indicator
    # Parameter setting
    if mode == 'voltage':
        fnames = download_demo(folder, 'demo_voltage_imaging.hdf5')
        # setting params
        # dataset dependent parameters
        fr = 400                        # sample rate of the movie

        num_frames_init =  1000        # number of frames used for initialization
        num_frames_total =  2000       # estimated total number of frames for processing, this is used for generating matrix to store data
        offline_batch = 200             # number of frames for one batch to perform offline motion correction
        batch = 1                       # number of frames processing at the same time using gpu. 1 for online processing.
        flip = True                     # whether to flip signal to find spikes
        detrend = True                  # whether to remove the slow trend in the fluorescence data
        do_deconvolve = True            # If True, perform spike detection for voltage imaging or deconvolution for calcium imaging.
        ms = [10, 10]                   # maximum shift in x and y axis respectively. Will not perform motion correction if None.
        update_bg = True                # update background components for spatial footprints
        filt_window = 15                # window size of median filter for removing the subthreshold activities. It can be integer or a list.
                                        # an integer means the window size of the full median filter. Suggested values range [9, 15]. It needs to be an odd number.
                                        # a list with two values [x, y] means an antisymmetric median filter which uses x past frames and y future frames.
        minimal_thresh = 3.5            # minimal of the threshold for voltage spike detection. Suggested value range [2.8, 3.5]
        template_window = 2             # half window size of the template; will not perform template matching if window size equals 0.
        nb = 1                          # number of background components
        lag = 11                        # lag for retrieving the online result. 5 frames are suggested for calcium imaging. For voltage imaging, it needs to be larger than filt_window // 2 + template_window + 2.

        options = {
            'fnames': fnames,
            'fr': fr,
            'mode': mode,
            'num_frames_init': num_frames_init,
            'num_frames_total':num_frames_total,
            'offline_batch': offline_batch,
            'batch':batch,
            'flip': flip,
            'detrend': detrend,
            'do_deconvolve': do_deconvolve,
            'ms': ms,
            'update_bg': update_bg,
            'filt_window': filt_window,
            'minimal_thresh': minimal_thresh,
            'template_window':template_window,
            'nb': nb,
            'lag': lag}


        logging.info('Loading Movie')


    elif mode == 'calcium':
        fnames=file_name
        fr = 30                         # sample rate of the movie

        mode = 'calcium'                # 'voltage' or 'calcium 'fluorescence indicator
        num_frames_init =  1000         # number of frames used for initialization
        num_frames_total =  2000        # estimated total number of frames for processing, this is used for generating matrix to store data
        offline_batch = 5               # number of frames for one batch to perform offline motion correction
        batch= 1                        # number of frames processing at the same time using gpu. 1 for online processing.
        flip = False                    # whether to flip signal to find spikes
        detrend = False                  # whether to remove the slow trend in the fluorescence data
        dc_param = 0.9995               # DC blocker parameter for removing the slow trend in the fluorescence data. It is usually between
                                        # 0.99 and 1. Higher value will remove less trend. No detrending will perform if detrend=False.
        do_deconvolve = True            # If True, perform spike detection for voltage imaging or deconvolution for calcium imaging.
        ms = [5, 5]                     # maximum shift in x and y axis respectively. Will not perform motion correction if None.
        center_dims = None              # template dimensions for motion correction. If None, the input will the the shape of the FOV
        hals_movie = 'hp_thresh'        # apply hals on the movie high-pass filtered and thresholded with 0 (hp_thresh); movie only high-pass filtered (hp);
                                        # original movie (orig); no HALS needed if the input is from CaImAn (when init_method is 'caiman' or 'weighted_masks')
        n_split = 1                     # split neuron spatial footprints into n_split portion before performing matrix multiplication, increase the number when spatial masks are larger than 2GB
        nb = 2                          # number of background components
        trace_with_neg=True             # return trace with negative components (noise) if True; otherwise the trace is cutoff at 0
        lag = 5                         # lag for retrieving the online result.

        options = {
            'fnames': fnames,
            'fr': fr,
            'mode': mode,
            'num_frames_init': num_frames_init,
            'num_frames_total':num_frames_total,
            'offline_batch': offline_batch,
            'batch':batch,
            'flip': flip,
            'detrend': detrend,
            'dc_param': dc_param,
            'do_deconvolve': do_deconvolve,
            'ms': ms,
            'hals_movie': hals_movie,
            'center_dims':center_dims,
            'n_split': n_split,
            'nb' : nb,
            'trace_with_neg':trace_with_neg,
            'lag': lag}
    else:
        raise Exception('mode must be either calcium or voltage')


    """# Load movie.
    ### If dealing with calcium data, run initialization with CaImAn
    """

    if mode == 'voltage':
        logging.info('Loading Movie')
        mov = cm.load(fnames, subindices=range(num_frames_init))
        fnames_init = fnames.split('.')[0] + '_init.tif'
        mov.save(fnames_init)
        path_ROIs = download_demo(folder, 'demo_voltage_imaging_ROIs.hdf5')
        mask = load(path_ROIs)
        template = np.median(mov, 0)

    elif mode == 'calcium':
        mov = cm.load(fnames, subindices=range(num_frames_init))
        fnames_init = fnames.split('.')[0] + '_init.tif'
        mov.save(fnames_init)

        # run caiman initialization. User might need to change the parameters
        # inside the file to get good initialization result
        caiman_file = run_caiman_init(fnames_init, pw_rigid=True,
                                        max_shifts=ms, gnb=nb, rf=15, K=4, gSig=[4, 4])

        # load results of initialization
        cnm2 = cm.source_extraction.cnmf.cnmf.load_CNMF(caiman_file)
        estimates = cnm2.estimates
        template = cnm2.estimates.template
        Cn = cnm2.estimates.Cn

    """### Display calculated template and overlaid neuron masks from initialization."""

    display_images = True
    if display_images:
        fig, ax = plt.subplots(1, 2)
        ax[0].imshow(template, vmax=np.percentile(template, 99.9), cmap='gray')
        ax[0].set_title('median img')
        ax[1].set_title('masks')
        if mode == 'voltage':
            ax[1].imshow(mask.mean(0), cmap='gray')
        elif mode == 'calcium':
            Ab = np.hstack((estimates.A.toarray(), estimates.b))
            Ab = Ab.reshape([mov.shape[1], mov.shape[2], -1], order='F').transpose([2, 0, 1])
            ax[1].imshow(Ab.mean(0), cmap='gray')

    """# GPU motion correction"""

    #%% Run FIOLA: set variable to true to include that portion of the pipeline.
    # example motion correction
    motion_correct = True
    # example source separation
    do_nnls = True

    #%% Mot corr only
    if motion_correct:
        params = fiolaparams(params_dict=options)
        fio = FIOLA(params=params)
        # run motion correction on GPU on the initialization movie
        mc_nn_mov, shifts_fiola, _ = fio.fit_gpu_motion_correction(mov, template, fio.params.mc_nnls['offline_batch'], min_mov=mov.min())
        plt.plot(shifts_fiola)
        plt.xlabel('Frames')
        plt.ylabel('Pixels')
        plt.legend(['X shifts', 'Y shifts'])
        plt.title('X and Y shifts used for motion correction')
    else:
        mc_nn_mov = mov

    #%% compare with original movie
    ds_ratio = 0.2
    moviehandle = cm.concatenate([mov.resize(1, 1, ds_ratio),
                    cm.movie(mc_nn_mov).resize(1, 1, ds_ratio)], axis=2)
    min_, max_ = np.min(moviehandle), np.max(moviehandle)
    moviehandle = np.array((moviehandle-min_)/(max_-min_)*255,dtype='uint8')
    m_path = folder + '/motion_correct.mp4'
    imageio.mimwrite(m_path, moviehandle, fps = 20, quality=8)

    mp4 = open(m_path,'rb').read()
    data_url = "data:video/mp4;base64," + b64encode(mp4).decode()
    HTML("""
    <video width=800 controls>
        <source src="%s" type="video/mp4">
    </video>
    """ % data_url)

    """# GPU source extraction"""

    #%% NNLS only
    if do_nnls:
        params = fiolaparams(params_dict=options)
        fio = FIOLA(params=params)
        if mode == 'voltage':
            A = scipy.sparse.coo_matrix(to_2D(mask, order='F')).T
            fio.fit_hals(mc_nn_mov, A)
            Ab = fio.Ab # Ab includes spatial masks of all neurons and background
        else:
            Ab = np.hstack((estimates.A.toarray(), estimates.b))
        trace_fiola, _ = fio.fit_gpu_nnls(mc_nn_mov, Ab, batch_size=fio.params.mc_nnls['offline_batch'])
        plt.plot(trace_fiola[:-nb].T)
        plt.xlabel('Frames')
        plt.ylabel('Fluorescence signal')
        plt.title('Extracted sources for all neurons and background')

    else: # use traces of CaImAn
        if trace_with_neg == True:
            trace_fiola = np.vstack((estimates.C+estimates.YrA, estimates.f))
        else:
            trace_fiola = estimates.C+estimates.YrA
            trace_fiola[trace_fiola < 0] = 0
            trace_fiola = np.vstack((trace_fiola, estimates.f))

    """# Set up whole pipeline with initialization"""
    #%% set up online pipeline
    params = fiolaparams(params_dict=options)
    fio = FIOLA(params=params)
    if mode == 'voltage': # not thoroughly tested and computationally intensive for large files, it will estimate the baseline
        fio.fit_hals(mc_nn_mov, A)
        Ab = fio.Ab
    else:
        Ab = np.hstack((estimates.A.toarray(), estimates.b))
    Ab = Ab.astype(np.float32)
    fio = fio.create_pipeline(mc_nn_mov, trace_fiola, template, Ab, min_mov=mov.min())

    """# Online analysis"""

    time_per_step = np.zeros((num_frames_total-num_frames_init) // batch)
    online_trace = np.zeros((fio.Ab.shape[-1], num_frames_total-num_frames_init), dtype=np.float32)
    online_trace_deconvolved = np.zeros((fio.Ab.shape[-1] - fio.params.hals['nb'], num_frames_total-num_frames_init), dtype=np.float32)
    start = time()

    for idx, memmap_image in movie_iterator(fnames, num_frames_init, num_frames_total, batch_size=batch):
        if idx % 1000 == 0:
            print(f'processed {idx} frames')
        fio.fit_online_frame(memmap_image)
        online_trace[:, idx-num_frames_init:idx-num_frames_init+batch] = fio.pipeline.saoz.trace[:,idx-batch:idx]
        online_trace_deconvolved[:, idx-num_frames_init:idx-num_frames_init+batch] = fio.pipeline.saoz.trace_deconvolved[:,idx-batch-fio.params.retrieve['lag']:idx-fio.params.retrieve['lag']]
        time_per_step[(idx-num_frames_init)//batch] = (time()-start)

    fio.pipeline.saoz.online_trace = online_trace
    fio.pipeline.saoz.online_trace_deconvolved = online_trace_deconvolved

    logging.info(f'total time online: {time()-start}')
    logging.info(f'time per frame online: {(time()-start)/(num_frames_total-num_frames_init)}')

    plt.figure()
    plt.stackplot(range(len(np.diff(time_per_step))), np.diff(time_per_step)*1000)
    plt.xlabel('Frames')
    plt.ylabel('Time (ms)')
    plt.title('Time per frame')

    """# Visualization"""

    #%% visualize result of first 15 neurons. This is not the ideal visualization, check ipython notebook for better visualization tool.
    fio.compute_estimates()
    indexes = list(range(Ab.shape[1]))[:-nb]
    spatials = Ab.reshape([mov.shape[1], mov.shape[2], -1], order='F').transpose([2, 0, 1])

    for i in range(15):
        clear_output(wait=True)
        fig = plt.figure(constrained_layout=True,figsize=(12,4))
        gs = fig.add_gridspec(1, 3)
        ax1 = fig.add_subplot(gs[:1])
        ax2 = fig.add_subplot(gs[1:])

        spatial = spatials[indexes][i].copy()
        ax1.imshow(template, interpolation='None', cmap=plt.cm.gray, vmax=np.percentile(template, 98))
        spatial[spatial == 0] = np.nan
        ax1.imshow(spatial, interpolation='None',
                    alpha=0.5, cmap=plt.cm.hot)
        ax1.set_title(f'neuron {indexes[i]}')
        ax1.axis('off')

        if mode == 'voltage':
            tr = fio.estimates.t[indexes][i]
            spikes = np.delete(fio.estimates.index[indexes][i], fio.estimates.index[indexes][i]==0)
            ax2.plot(np.arange(0, num_frames_init), tr[:num_frames_init], color='lightsteelblue')
            ax2.plot(np.arange(num_frames_init, num_frames_total), tr[num_frames_init:num_frames_total], color='blue')
            h_min = tr.max()
            ax2.plot(spikes, np.max(tr) * np.ones(spikes.shape),
                    color='r', marker='.', markersize=5, fillstyle='none', linestyle='none')
            ax2.legend(['init trace',   'online trace', 'spikes'])
        elif mode == 'calcium':
            tr = fio.estimates.trace[indexes][i]
            tr = tr - np.median(tr)
            tr_dec = fio.estimates.trace_deconvolved[indexes][i]
            ax2.plot(np.arange(0, num_frames_init), tr[:num_frames_init], color='lightsteelblue')
            ax2.plot(np.arange(num_frames_init, num_frames_total), tr[num_frames_init:num_frames_total], color='blue')
            ax2.plot(tr_dec, color='red')
            ax2.legend(['init trace', 'online trace', 'deconvolved trace'])
        ax2.set_xlabel('Frames')
        ax2.set_ylabel('Signals')
        plt.show()
        plt.pause(0.5)

    #%% save result
    if True:
        np.save(folder + './fiola_result', fio.estimates)
        # serialized_arr = pickle.dumps(fio.estimates)
        # # Setup basic logging
        # logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

        # logging.info("Initializing Kafka producer...")
        # bootstrap_servers = os.getenv('KAFKA_BROKER_LIST', 'kafka-loadbalancer-controller-0.kafka-loadbalancer-controller-headless.fenton-neuroscience.svc.cluster.local:9092')
        # sasl_mechanism = os.getenv('KAFKA_SASL_MECHANISM', 'PLAINTEXT')
        # security_protocol = os.getenv('KAFKA_SECURITY_PROTOCOL', 'PLAINTEXT')  # Default to PLAINTEXT if not specified

        # conf = {
        #     'bootstrap.servers': bootstrap_servers,
        #     'security.protocol': security_protocol,
        #     'sasl.mechanisms': sasl_mechanism,
        # }

        # producer = Producer(**conf)
        # logging.info("Kafka producer initialized.")

        # topic_name = os.getenv('KAFKA_TOPIC', 'fiola_output')  # Default to 'fiola_output' if not specified

        # def delivery_report(err, msg):
        #     """Called once for each message produced to indicate delivery result.
        #     Triggered by poll() or flush()."""
        #     if err is not None:
        #         logging.error('Message delivery failed: {}'.format(err))
        #     else:
        #         logging.info('Message delivered to {} [{}]'.format(msg.topic(), msg.partition()))

        # # Produce message
        # producer.produce(topic_name, value=serialized_arr, callback=delivery_report)
        # producer.flush()

        # print("Result sent to topic fiola_output")