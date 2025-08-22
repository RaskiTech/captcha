import { useMemo, useState } from 'react';
import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.js';
import './Captcha.css';
import { useWavesurfer } from '@wavesurfer/react';

export function Captcha() {
  const [stage, setStage] = useState(0)

  const [isRecording, setRecording] = useState(true)

  const containerRef = useRef(null)

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: 100,
    waveColor: 'rgba(105, 105, 105, 1)',
    progressColor: 'rgba(45, 45, 45, 1)',
    url: "/audio.wav",
    barWidth: 2,

    plugins: useMemo(() => [RecordPlugin.create({

    })], []),
  })

  return (
    <div className="captcha-box">
      <div className="captcha-content">
        <div className="captcha-circle" onClick={() => {
          wavesurfer?.playPause()
        }}>
          {isRecording ? <>
            <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3C5 1.34315 6.34315 0 8 0C9.65685 0 11 1.34315 11 3V7C11 8.65685 9.65685 10 8 10C6.34315 10 5 8.65685 5 7V3Z" fill="#000000" />
              <path d="M9 13.9291V16H7V13.9291C3.60771 13.4439 1 10.5265 1 7V6H3V7C3 9.76142 5.23858 12 8 12C10.7614 12 13 9.76142 13 7V6H15V7C15 10.5265 12.3923 13.4439 9 13.9291Z" fill="#000000" />
            </svg>
          </>
            : <>
              <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="8" fill="#000000" />
                <polygon points="6,4.5 12,8 6,11.5" fill="#ffffff" />
              </svg>
            </>
          }
        </div>
        <div className='captcha-wave' ref={containerRef}></div>
      </div>
      <div className="captcha-bottom-text">
        <b>Please speak into the microphone</b>
      </div>
    </div>
  );
}