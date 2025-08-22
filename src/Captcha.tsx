import './Captcha.css';
import './App.css';
import { useState } from 'react';
import { CaptchaRecorder } from './CaptchaRecorder';


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


const checksInitial = [
	{ label: 'Was long enough', passed: true },
	{ label: "Wasn't loud enough", passed: false },
];

export default function Captcha() {
	const [checks, setChecks] = useState<{ label: string; passed: boolean; }[]>([]);

	const OnRecordingComplete = (audio: Blob) => {
		setChecks(checksInitial)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<p>Please speak to confirm you are a human</p>
			<div style={{ width: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '18px 12px'}}>
				<CaptchaRecorder onRecordingComplete={OnRecordingComplete}/>
				<div style={{ marginTop: checks.length > 0 ? 12 : 0, width: '100%' }}>
					{checks.map((check, idx) => (
						<div key={idx}>
							{check.passed ? 
								RenderMessagebox(check.label, () => {}, 'success', 
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />)
							: RenderMessagebox(check.label, () => {}, 'error', 
									<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />)
							}
						</div>
					))}
					</div>
				</div>
			</div>
		);
	}
