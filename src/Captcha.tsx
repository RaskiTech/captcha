import './Captcha.css';
import './App.css';
import { useMemo, useState, useRef, useEffect } from 'react';
import { CaptchaRecorder } from './CaptchaRecorder';
import { Recognizer } from './recognizer';


function RenderMessagebox(message: string, clearMessage: () => void,
	color: 'success' | 'error' | 'warning', leftSideSvg: React.ReactNode) {
	return (
		<>
			<div
				className={`captcha-messagebox captcha-messagebox-${color}`}
				onClick={clearMessage}
			>
				<div className="captcha-messagebox-content">
					<div className="captcha-messagebox-left">
						<svg className="captcha-messagebox-icon" fill="currentColor">{leftSideSvg}</svg>
						<span className={`captcha-messagebox-text ${color === 'warning' ? '' : 'resolved'}`}>{message}</span>
					</div>
				</div>
			</div>
		</>
	);
}

type Message = { label: string; status: 'pass' | 'fail' | 'loading'; }

type Props = {
	onSuccess: () => void
}

export default function Captcha({ onSuccess }: Props) {
	const [checks, setChecks] = useState<Message[]>([]);
	const [passedCheckCount, setPassedCheckCount] = useState<number>(-1)
	const [collapsing, setCollapsing] = useState<boolean>(false)
	const numTries = useRef(0)
	const numTriesVocal = useRef(0)

	// Track which checks have animated in
	const animatedChecks = useRef<Set<string>>(new Set());
	useEffect(() => {
		checks.forEach((check) => {
			if (!animatedChecks.current.has(check.label)) {
				animatedChecks.current.add(check.label);
			}
		});
	}, [checks]);

	const speechRecognition = useMemo(() => new Recognizer(), [])

	const IsLoudEnough = async (audio: Blob, _duration: number) => {
		const Decode = async (audio: Blob): Promise<number> => {
			// 1. Decode audio data
			const arrayBuffer = await audio.arrayBuffer();
			const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

			let maxLoudness = 0;
			for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
				const data = audioBuffer.getChannelData(ch);

				console.log(data.length)
				const windowSize = Math.min(20000, data.length);
				for (let start = 0; start + windowSize <= data.length; start += windowSize)
				{
					let sumSquares = 0;
					for (let i = 0; i < data.length; i++) {
						sumSquares += data[i] * data[i];
					}
					const rms = Math.sqrt(sumSquares / data.length);
					maxLoudness = Math.max(maxLoudness, rms);
				}
			}
			return maxLoudness
		}

		const volumeArray = [0, -18, -19, -20, -21, -22, -25, -28]
		const arrayIdx = Math.min(volumeArray.length, numTries.current)
		const threshold = volumeArray[arrayIdx] 
		const rmsLoudness = await Decode(audio);
		const rmsDb = 20 * Math.log10(rmsLoudness); // Convert to dB
		const loudEnough = rmsDb > threshold;
		await new Promise((res) => { setTimeout(res, 1000) })

		console.log("Was " + rmsDb + " / " + threshold)
		if (loudEnough) {
			return { label: "The recording was loud enough", status: 'pass' }
		}
		
		numTries.current++
		return { label: "Sorry, we couldn't quite hear you. Please speak louder", status: 'fail' }
	}
	const IsShortEnough: (audio: Blob, duration: number) => Promise<Message> = async (audio: Blob, duration: number) => {

		await new Promise((res) => { setTimeout(res, 1000) }) // Load for a while

		if (duration < 2.0)
			return { label: "Recording was short enough.", status: 'pass' }
		else
			return { label: "Sorry, our servers can't handle recordings over 2 seconds.", status: 'fail' }
	}
	const ContainsWord: (audio: Blob, duration: number, speech: Promise<string>) => Promise<Message> = async (audio: Blob, duration: number, speech: Promise<string>) => {
		const result = await speech

		await new Promise((res) => { setTimeout(res, 500) }) // Load for a while

		if (result.includes("they're"))
			return { label: "Identification successful with \"they're\"", status: 'pass' }
		else
			return { label: "Please include the word \"they're\" so we can easily identify you. You said:\n" + result, status: 'fail' }
	}
	const ContainsEnoughPitch: (audio: Blob, duration: number) => Promise<Message> = async (audio: Blob, duration: number) => {
		// Helper: naive autocorrelation pitch detection for a window of PCM data
		function detectPitch(samples: Float32Array, sampleRate: number): number | null {
			let bestOffset = -1;
			let bestCorrelation = 0;
			let rms = 0;
			const size = samples.length;
			for (let i = 0; i < size; i++) rms += samples[i] * samples[i];
			rms = Math.sqrt(rms / size);
			if (rms < 0.01) return null; // too quiet

			let found = false;
			for (let offset = 16; offset < 1024; offset++) {
				let correlation = 0;
				for (let i = 0; i < size - offset; i++) {
					correlation += samples[i] * samples[i + offset];
				}
				correlation = correlation / (size - offset);

				if (correlation > bestCorrelation && correlation > 0.001) {
					bestCorrelation = correlation;
					bestOffset = offset;
					found = true;
				}
			}
			if (found && bestOffset > -1) {
				return sampleRate / bestOffset;
			}
			return null;
		}

		const DecodePitch = async (audio: Blob): Promise<{ min: number, max: number }> => {
			const arrayBuffer = await audio.arrayBuffer();
			const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

			let minPitch = Infinity;
			let maxPitch = 0;

			for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
				const data = audioBuffer.getChannelData(ch);

				const windowSize = 2048;
				const hop = 1024;
				for (let i = 0; i < data.length - windowSize; i += hop) {
					const window = data.slice(i, i + windowSize);
					const pitch = detectPitch(window, audioBuffer.sampleRate);
					if (pitch && pitch > 50 && pitch < 2000) { // filter out noise
						minPitch = Math.min(minPitch, pitch);
						maxPitch = Math.max(maxPitch, pitch);
					}
				}
			}
			return {
				min: minPitch === Infinity ? 0 : minPitch,
				max: maxPitch === 0 ? 0 : maxPitch,
			};
		};

		const { min, max } = await DecodePitch(audio)
		await new Promise((res) => { setTimeout(res, 2000) }) // Load for a while

		if (Math.abs(max - min) > 75 && numTriesVocal.current > 0)
			return { label: "Vocal range check successful", status: 'pass' }
		else
		{
			numTriesVocal.current++;
			return { label: "Please include different pitch levels so we can hear your full vocal range.", status: 'fail' }
		}
	}
	const ContainsClap: (audio: Blob, duration: number) => Promise<Message> = async (audio: Blob, duration: number) => {
		const DetectClap = async (audio: Blob): Promise<boolean> => {
			// 1. Decode audio data
			const arrayBuffer = await audio.arrayBuffer();
			const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

			let detected = false;
			const sampleRate = audioBuffer.sampleRate;

			// Window size for detecting sudden changes (about 20ms)
			const windowSize = Math.floor(sampleRate * 0.02);

			for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
				const data = audioBuffer.getChannelData(ch);

				// Step through in windows
				let prevRms = 0
				for (let i = 0; i < data.length - windowSize; i += windowSize) {
					// RMS (energy) of current window
					let sum = 0;
					for (let j = 0; j < windowSize; j++) {
						sum += data[i + j] * data[i + j];
					}
					const rms = Math.sqrt(sum / windowSize);

					// Compare with previous window (sudden spike = clap candidate)
					if (i > 0) {
						if (rms > 0.05 && rms > prevRms * 30) { 
							console.log("Found " + rms + " that was " + rms / prevRms)
							detected = true;
							break;
						}
					}
					prevRms = rms;
				}

				if (detected) break;
			}

			return detected;
		};

		const result = await DetectClap(audio)
		await new Promise((res) => { setTimeout(res, 1000) }) // Load for a while

		if (result)
			return { label: "Clap found.", status: "pass" }
		else
			return { label: "As the last step, please clap in the recording for calibration purposes.", status: "fail" }
	}

	const OnStartRecording = async () => {
		speechRecognition.start()
	}
	const OnRecordingComplete = async (audio: Blob, duration: number) => {

		ContainsClap(audio, duration)

		const speechPromise = speechRecognition.stop()
		const checks = [
			ContainsClap,
			IsShortEnough,
			IsLoudEnough,
			async (audio: Blob, duration: number) => await ContainsWord(audio, duration, speechPromise),
			ContainsEnoughPitch,
		]
		let pastChecks: Message[] = []
		let currentCheck: Message = { label: '', status: 'loading' }

		// Check functions until one fails
		setChecks([])
		await new Promise((res) => { setTimeout(res, 1) }) // Wait for just a moment to allow all message boxes to disappear
		let anyFailed = false

		for (let i = 0; i < checks.length; i++) {
			const checkFunction = checks[i]
			currentCheck = { label: 'Loading...', status: 'loading' }
			setChecks([...pastChecks, currentCheck])
			currentCheck = await checkFunction(audio, duration)
			pastChecks = [...pastChecks, currentCheck]
			setChecks(pastChecks)

			if(currentCheck.status === 'fail') {
				anyFailed = true // true in prod
			}

			if (anyFailed && i >= passedCheckCount) {
				break
			}

			setPassedCheckCount(i + 1)
		}

		if (!anyFailed) {
			// while (pastChecks.length > 0)
			// {
			// 	await new Promise((res) => { setTimeout(res, 500) }) // Wait for just a moment to allow all message boxes to disappear
			// 	console.log("Removing")
			// 	pastChecks.pop()
			// 	setChecks([...pastChecks])
			// }
			await new Promise((res) => { setTimeout(res, 500) }) // Wait for just a moment to allow all message boxes to disappear
			setCollapsing(true)

			onSuccess();
		}

	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<p>Please speak to confirm you are a human</p>
			<div
				className={`captcha-outer-grow ${collapsing ? 'collapse' : ''}`}
				style={{ width: '100%', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '18px 12px' }}>
				<CaptchaRecorder onStartRecording={OnStartRecording} onRecordingComplete={OnRecordingComplete} disabled={collapsing}/>
				<div style={{ marginTop: checks.length > 0 ? 12 : 0, width: '100%' }}>
					{checks.map((check, idx) => {
						return (
							<div key={idx} className={`captcha-messagebox-outer captcha-pop-in`}>
								{check.status == 'pass' ?
									RenderMessagebox(check.label, () => { }, 'success',
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />)
									: check.status == 'fail' ?
										RenderMessagebox(check.label, () => { }, 'error',
											<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />)
										: RenderMessagebox(check.label, () => { }, 'warning',
											<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />)
								}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
