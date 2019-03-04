import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import classnames from 'classnames';
import Spinner from 'react-spinner';
import clipboardCopy from 'clipboard-copy';
import hark from 'hark';
import * as faceapi from 'face-api.js';
import Logger from '../Logger';
import * as appPropTypes from './appPropTypes';
import EditableInput from './EditableInput';

const logger = new Logger('PeerView');

const tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions(
	{
		inputSize      : 160,
		scoreThreshold : 0.5
	});

export default class PeerView extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state =
		{
			audioVolume           : 0, // Integer from 0 to 10.,
			showInfo              : window.SHOW_INFO || false,
			videoResolutionWidth  : null,
			videoResolutionHeight : null
		};

		// Latest received video track.
		// @type {MediaStreamTrack}
		this._audioTrack = null;

		// Latest received video track.
		// @type {MediaStreamTrack}
		this._videoTrack = null;

		// Hark instance.
		// @type {Object}
		this._hark = null;

		// Periodic timer for reading video resolution.
		this._videoResolutionPeriodicTimer = null;

		// requestAnimationFrame for face detection.
		this._faceDetectionRequestAnimationFrame = null;
	}

	render()
	{
		const {
			isMe,
			peer,
			audioProducerId,
			videoProducerId,
			audioConsumerId,
			videoConsumerId,
			videoVisible,
			videoMultiLayer,
			videoCurrentSpatialLayer,
			videoPreferredSpatialLayer,
			audioCodec,
			videoCodec,
			audioScore,
			videoScore,
			onChangeDisplayName,
			onChangeVideoPreferredSpatialLayer,
			onRequestKeyFrame
		} = this.props;

		const {
			audioVolume,
			showInfo,
			videoResolutionWidth,
			videoResolutionHeight
		} = this.state;

		return (
			<div data-component='PeerView'>
				<div className='info'>
					<div
						className={classnames('info-icon', { on: showInfo })}
						onClick={() => this.setState({ showInfo: !showInfo })}
					/>

					<div className={classnames('box', { visible: showInfo })}>
						<If condition={audioProducerId || audioConsumerId}>
							<h1>audio</h1>

							<If condition={audioProducerId}>
								<p>
									{'id: '}
									<span
										className='copiable'
										data-tip='Copy audio producer id to clipboard'
										onClick={() => clipboardCopy(audioProducerId)}
									>
										{audioProducerId}
									</span>
								</p>

								<ReactTooltip
									type='light'
									effect='solid'
									delayShow={1500}
									delayHide={50}
								/>
							</If>

							<If condition={audioConsumerId}>
								<p>
									{'id: '}
									<span
										className='copiable'
										data-tip='Copy video producer id to clipboard'
										onClick={() => clipboardCopy(audioConsumerId)}
									>
										{audioConsumerId}
									</span>
								</p>

								<ReactTooltip
									type='light'
									effect='solid'
									delayShow={1500}
									delayHide={50}
								/>
							</If>

							<If condition={audioCodec}>
								<p>codec: {audioCodec}</p>
							</If>

							<If condition={audioProducerId && audioScore}>
								{this._printProducerScore(audioProducerId, audioScore)}
							</If>

							<If condition={audioConsumerId && audioScore}>
								{this._printConsumerScore(audioConsumerId, audioScore)}
							</If>
						</If>

						<If condition={videoProducerId || videoConsumerId}>
							<h1>video</h1>

							<If condition={videoProducerId}>
								<p>
									{'id: '}
									<span
										className='copiable'
										data-tip='Copy audio consumer id to clipboard'
										onClick={() => clipboardCopy(videoProducerId)}
									>
										{videoProducerId}
									</span>
								</p>

								<ReactTooltip
									type='light'
									effect='solid'
									delayShow={1500}
									delayHide={50}
								/>
							</If>

							<If condition={videoConsumerId}>
								<p>
									{'id: '}
									<span
										className='copiable'
										data-tip='Copy video consumer id to clipboard'
										onClick={() => clipboardCopy(videoConsumerId)}
									>
										{videoConsumerId}
									</span>
								</p>

								<ReactTooltip
									type='light'
									effect='solid'
									delayShow={1500}
									delayHide={50}
								/>
							</If>

							<If condition={videoCodec}>
								<p>codec: {videoCodec}</p>
							</If>

							<If condition={videoVisible && videoResolutionWidth !== null}>
								<p>resolution: {videoResolutionWidth}x{videoResolutionHeight}</p>
							</If>

							<If condition={!isMe && videoMultiLayer}>
								<p>current spatial layer: {videoCurrentSpatialLayer}</p>
								<p>
									preferred spatial layer: {videoPreferredSpatialLayer}
									<span>{' '}</span>
									<span
										className='clickable'
										onClick={(event) =>
										{
											event.stopPropagation();

											let newPreferredSpatialLayer;

											switch (videoPreferredSpatialLayer)
											{
												case 0:
													newPreferredSpatialLayer = 2;
													break;

												case 1:
													newPreferredSpatialLayer = 0;
													break;

												case 2:
													newPreferredSpatialLayer = 1;
													break;

												default:
													newPreferredSpatialLayer = 1;
													break;
											}

											onChangeVideoPreferredSpatialLayer(newPreferredSpatialLayer);
										}}
									>
										{'[ down ]'}
									</span>
									<span>{' '}</span>
									<span
										className='clickable'
										onClick={(event) =>
										{
											event.stopPropagation();

											let newPreferredSpatialLayer;

											switch (videoPreferredSpatialLayer)
											{
												case 0:
													newPreferredSpatialLayer = 1;
													break;

												case 1:
													newPreferredSpatialLayer = 2;
													break;

												case 2:
													newPreferredSpatialLayer = 0;
													break;

												default:
													newPreferredSpatialLayer = 2;
													break;
											}

											onChangeVideoPreferredSpatialLayer(newPreferredSpatialLayer);
										}}
									>
										{'[ up ]'}
									</span>
								</p>

								<If condition={!isMe && videoCodec}>
									<p>
										<span
											className='clickable'
											onClick={(event) =>
											{
												event.stopPropagation();

												if (!onRequestKeyFrame)
													return;

												onRequestKeyFrame();
											}}
										>
											{'[ request keyframe ]'}
										</span>
									</p>
								</If>
							</If>

							<If condition={videoProducerId && videoScore}>
								{this._printProducerScore(videoProducerId, videoScore)}
							</If>

							<If condition={videoConsumerId && videoScore}>
								{this._printConsumerScore(videoConsumerId, videoScore)}
							</If>
						</If>
					</div>

					<div className={classnames('peer', { 'is-me': isMe })}>
						<Choose>
							<When condition={isMe}>
								<EditableInput
									value={peer.displayName}
									propName='displayName'
									className='display-name editable'
									classLoading='loading'
									classInvalid='invalid'
									shouldBlockWhileLoading
									editProps={{
										maxLength   : 20,
										autoCorrect : 'false',
										spellCheck  : 'false'
									}}
									onChange={({ displayName }) => onChangeDisplayName(displayName)}
								/>
							</When>

							<Otherwise>
								<span className='display-name'>
									{peer.displayName}
								</span>
							</Otherwise>
						</Choose>

						<div className='row'>
							<span
								className={classnames('device-icon', peer.device.flag)}
							/>
							<span className='device-version'>
								{peer.device.name} {peer.device.version || null}
							</span>
						</div>
					</div>
				</div>

				<video
					ref='video'
					className={classnames({
						'is-me' : isMe,
						hidden  : !videoVisible
					})}
					autoPlay={false}
					muted={isMe}
					controls={!isMe}
				/>

				<canvas
					ref='canvas'
					className={classnames('face-detection', { 'is-me': isMe })}
				/>

				<div className='volume-container'>
					<div className={classnames('bar', `level${audioVolume}`)} />
				</div>

				<If condition={videoVisible && videoScore < 5}>
					<div className='spinner-container'>
						<Spinner />
					</div>
				</If>
			</div>
		);
	}

	componentDidMount()
	{
		const { audioTrack, videoTrack } = this.props;

		this._setTracks(audioTrack, videoTrack);
	}

	componentWillUnmount()
	{
		if (this._hark)
			this._hark.stop();

		clearInterval(this._videoResolutionPeriodicTimer);
		cancelAnimationFrame(this._faceDetectionRequestAnimationFrame);
	}

	componentWillReceiveProps(nextProps)
	{
		const { audioTrack, videoTrack } = nextProps;

		this._setTracks(audioTrack, videoTrack);
	}

	_setTracks(audioTrack, videoTrack)
	{
		const { faceDetection } = this.props;

		if (this._audioTrack === audioTrack && this._videoTrack === videoTrack)
			return;

		this._audioTrack = audioTrack;
		this._videoTrack = videoTrack;

		if (this._hark)
			this._hark.stop();

		this._stopVideoResolution();

		if (faceDetection)
			this._stopFaceDetection();

		const { video } = this.refs;

		if (audioTrack || videoTrack)
		{
			const stream = new MediaStream;

			if (audioTrack)
				stream.addTrack(audioTrack);

			if (videoTrack)
				stream.addTrack(videoTrack);

			video.srcObject = stream;

			video.play()
				.catch((error) => logger.warn('video.play() failed:%o', error));

			if (audioTrack)
				this._runHark(stream);

			if (videoTrack)
			{
				this._startVideoResolution();

				if (faceDetection)
					this._startFaceDetection();
			}
		}
		else
		{
			video.srcObject = null;
		}
	}

	_runHark(stream)
	{
		if (!stream.getAudioTracks()[0])
			throw new Error('_runHark() | given stream has no audio track');

		this._hark = hark(stream, { play: false });

		// eslint-disable-next-line no-unused-vars
		this._hark.on('volume_change', (dBs, threshold) =>
		{
			// The exact formula to convert from dBs (-100..0) to linear (0..1) is:
			//   Math.pow(10, dBs / 20)
			// However it does not produce a visually useful output, so let exagerate
			// it a bit. Also, let convert it from 0..1 to 0..10 and avoid value 1 to
			// minimize component renderings.
			let audioVolume = Math.round(Math.pow(10, dBs / 85) * 10);

			if (audioVolume === 1)
				audioVolume = 0;

			if (audioVolume !== this.state.audioVolume)
				this.setState({ audioVolume });
		});
	}

	_startVideoResolution()
	{
		this._videoResolutionPeriodicTimer = setInterval(() =>
		{
			const {
				videoResolutionWidth,
				videoResolutionHeight
			} = this.state;
			const { video } = this.refs;

			if (
				video.videoWidth !== videoResolutionWidth ||
				video.videoHeight !== videoResolutionHeight
			)
			{
				this.setState(
					{
						videoResolutionWidth  : video.videoWidth,
						videoResolutionHeight : video.videoHeight
					});
			}
		}, 1000);
	}

	_stopVideoResolution()
	{
		clearInterval(this._videoResolutionPeriodicTimer);

		this.setState(
			{
				videoResolutionWidth  : null,
				videoResolutionHeight : null
			});
	}

	_startFaceDetection()
	{
		const { video, canvas } = this.refs;

		const step = () =>
		{
			// NOTE: Somehow this is critical. Otherwise the Promise returned by
			// faceapi.detectSingleFace() never resolves or rejects.
			if (!this._videoTrack || video.readyState < 2)
			{
				this._faceDetectionRequestAnimationFrame = requestAnimationFrame(step);

				return;
			}

			faceapi.detectSingleFace(video, tinyFaceDetectorOptions)
				.then((detection) =>
				{
					if (detection)
					{
						const width = video.offsetWidth;
						const height = video.offsetHeight;

						canvas.width = width;
						canvas.height = height;

						const resizedDetection = detection.forSize(width, height);

						faceapi.drawDetection(
							canvas, [ resizedDetection ], { withScore: false });
					}
					else
					{
						// Trick to hide the canvas rectangle.
						canvas.width = 0;
						canvas.height = 0;
					}

					this._faceDetectionRequestAnimationFrame =
						requestAnimationFrame(() => setTimeout(step, 100));
				});
		};

		step();
	}

	_stopFaceDetection()
	{
		cancelAnimationFrame(this._faceDetectionRequestAnimationFrame);

		const { canvas } = this.refs;

		canvas.width = 0;
		canvas.height = 0;
	}

	_printProducerScore(id, score)
	{
		const scores = Array.isArray(score) ? score : [ score ];

		return (
			<React.Fragment key={id}>
				<p>streams:</p>

				{
					// eslint-disable-next-line no-shadow
					scores.map(({ ssrc, score }, idx) => (
						<p key={idx} className='indent'>
							{`ssrc:${ssrc}, score:${score}`}
						</p>
					))
				}
			</React.Fragment>
		);
	}

	_printConsumerScore(id, score)
	{
		const scores = Array.isArray(score) ? score : [ score ];

		return (
			<React.Fragment key={id}>
				<p>score:</p>

				{
					scores.map(({ producer, consumer }, idx) => (
						<p key={idx} className='indent'>
							{`producer${producer}, score:${consumer}`}
						</p>
					))
				}
			</React.Fragment>
		);
	}
}

PeerView.propTypes =
{
	isMe : PropTypes.bool,
	peer : PropTypes.oneOfType(
		[ appPropTypes.Me, appPropTypes.Peer ]).isRequired,
	audioProducerId                    : PropTypes.string,
	videoProducerId                    : PropTypes.string,
	audioConsumerId                    : PropTypes.string,
	videoConsumerId                    : PropTypes.string,
	audioTrack                         : PropTypes.any,
	videoTrack                         : PropTypes.any,
	videoVisible                       : PropTypes.bool.isRequired,
	videoMultiLayer                    : PropTypes.bool,
	videoCurrentSpatialLayer           : PropTypes.number,
	videoPreferredSpatialLayer         : PropTypes.number,
	audioCodec                         : PropTypes.string,
	videoCodec                         : PropTypes.string,
	audioScore                         : PropTypes.any,
	videoScore                         : PropTypes.any,
	faceDetection                      : PropTypes.bool.isRequired,
	onChangeDisplayName                : PropTypes.func,
	onChangeVideoPreferredSpatialLayer : PropTypes.func,
	onRequestKeyFrame                  : PropTypes.func
};
