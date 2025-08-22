import './Captcha.css';
import './App.css';
import { useMemo, useState, useRef, useEffect } from 'react';
import { CaptchaRecorder } from './CaptchaRecorder';
import { Recognizer } from './recognizer';


function RenderMessagebox(message: string, clearMessage: () => void, 
	color: 'success' | 'error' | 'warning', leftSideSvg: React.ReactNode ) 
{
	return (
		<div className={`captcha-messagebox-outer${message ? ' active' : ''}`}> 
			<div 
				className={`captcha-messagebox captcha-messagebox-${color}`}
				onClick={clearMessage}
			>
				<div className="captcha-messagebox-content">
					<div className="captcha-messagebox-left">
						<svg className="captcha-messagebox-icon" fill="currentColor">{leftSideSvg}</svg>
						<span className="captcha-messagebox-text">{message}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

type Message = { label: string; status: 'pass' | 'fail' | 'loading'; }

export default function Captcha() {
	const [checks, setChecks] = useState<Message[]>([]);
	const [passedCheckCount, setPassedCheckCount] = useState<number>(-1)

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

	const IsLoudEnough: (audio: Blob, duration: number) => Promise<Message> = async (audio: Blob, duration: number) => {
		const Decode = async (audio: Blob): Promise<number> => {
			// 1. Decode audio data
			const arrayBuffer = await audio.arrayBuffer();
			const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

			// 2. Get PCM data from all channels and find max amplitude
			let max = 0;
			for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
				const data = audioBuffer.getChannelData(ch);
				for (let i = 0; i < data.length; i++) {
				max = Math.max(max, Math.abs(data[i]));
				}
			}

			return max
		};

		const threshold = 0.2; // 0 (silent) to 1 (max)
		const loudEnough = (await Decode(audio)) > threshold;
		await new Promise( (res) => { setTimeout(res, 1000) })

		return { label: "Yes", status: 'pass' }
	}
	const IsShortEnough: (audio: Blob, duration: number) => Promise<Message> = async (audio: Blob, duration: number) => {

		await new Promise( (res) => { setTimeout(res, 1000) }) // Load for a while

		if (duration < 4.0)
			return { label: "Recording was short enough.", status: 'pass' }
		else
			return { label: "Our servers can't handle recordings over 4 seconds.", status: 'fail' }
	}
	const ContainsWord: (audio: Blob, duration: number, speech: Promise<string>) => Promise<Message> = async (audio: Blob, duration: number, speech: Promise<string>) => {
		const result = await speech
		
		if (result.includes("they're"))
			return { label: "Identification successful with \"they're\"", status: 'pass' }
		else
			return { label: "Please include the word \"they're\" so we can easily identify you.", status: 'fail' }
	}
	const ContainsEnoughPitch: (audio: Blob, duration: number) => Promise<Message> = async (audio: Blob, duration: number) => {

		return { label: "Please include the word \"they're\" so we can easily identify you.", status: 'fail' }
	}

	const OnStartRecording = async () => {
		speechRecognition.start()
	}
	const OnRecordingComplete = async (audio: Blob, duration: number) => {
		const speechPromise = speechRecognition.stop()
		const checks = [
			IsLoudEnough, 
			IsShortEnough, 
			async (audio: Blob, duration: number) => await ContainsWord(audio, duration, speechPromise),
			ContainsEnoughPitch
		]
		var pastChecks: Message[] = []
		var currentCheck: Message = { label:'', status: 'loading' }

		// Check functions until one fails
		setChecks([])
		await new Promise( (res) => { setTimeout(res, 1) }) // Wait for just a moment to allow all message boxes to disappear

		for (let i = 0; i < checks.length; i++) {
			const checkFunction = checks[i]
			currentCheck = { label: 'Loading...', status: 'loading' }
			setChecks([...pastChecks, currentCheck])
			currentCheck = await checkFunction(audio, duration)
			pastChecks = [...pastChecks, currentCheck]
			setChecks(pastChecks)

			if (currentCheck.status == 'fail' && i >= passedCheckCount)
				break

			setPassedCheckCount(i+1)
		}


		// TODO: Add logic for all checks complete
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<p>Please speak to confirm you are a human</p>
			<div style={{ width: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '18px 12px'}}>
				<CaptchaRecorder onStartRecording={OnStartRecording} onRecordingComplete={OnRecordingComplete}/>
								<div style={{ marginTop: checks.length > 0 ? 12 : 0, width: '100%' }}>
									   {checks.map((check, idx) => {
										   // Animate only if this check hasn't animated in yet
										   const popIn = !animatedChecks.current.has(check.label) && idx === checks.length - 1;
										   return (
											   <div key={idx} className={`captcha-messagebox-outer captcha-pop-in`}>
												{check.status == 'pass' ? 
													RenderMessagebox(check.label, () => {}, 'success', 
														<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />)
												: check.status == 'fail' ?
													RenderMessagebox(check.label, () => {}, 'error', 
														<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />)
												: RenderMessagebox(check.label, () => {}, 'warning', 
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
