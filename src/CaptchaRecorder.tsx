import { useRef } from 'react';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.js';
import './CaptchaRecorder.css';
import { useWavesurfer } from '@wavesurfer/react';

type Props = {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onStartRecording: () => void;
}

const RECORD_DURATION = 5.0; // seconds

function newRecorder(): RecordPlugin {
  return RecordPlugin.create({
    renderRecordedAudio: false,
    continuousWaveform: true,
    continuousWaveformDuration: RECORD_DURATION,
  });
}

export function CaptchaRecorder({ onRecordingComplete, onStartRecording }: Props) {
  const containerRef = useRef(null)

  const recordRef = useRef(newRecorder());

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: 100,
    waveColor: 'rgba(105, 105, 105, 1)',
    progressColor: 'rgba(158, 154, 154, 1)',
    barWidth: 3,
    width: "90%",
    cursorColor: 'transparent',
    hideScrollbar: true,

    normalize: true,
    barRadius: 1,
  })

  const isRecording = recordRef.current.isRecording()

  return (
    <div className="captcha-box">
      <div className="captcha-content">
        {!isRecording ? <>
          <div className="captcha-circle">
            <svg
              onClick={async () => {
                wavesurfer?.unregisterPlugin(recordRef.current)
                wavesurfer?.seekTo(0)
                wavesurfer?.empty()
                recordRef.current.destroy()
                recordRef.current = newRecorder()
                wavesurfer?.registerPlugin(recordRef.current)
                await recordRef.current.startRecording({})
                onStartRecording()
              }}
              style={{
                fill: 'orange',
              }} width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3C5 1.34315 6.34315 0 8 0C9.65685 0 11 1.34315 11 3V7C11 8.65685 9.65685 10 8 10C6.34315 10 5 8.65685 5 7V3Z" />
              <path d="M9 13.9291V16H7V13.9291C3.60771 13.4439 1 10.5265 1 7V6H3V7C3 9.76142 5.23858 12 8 12C10.7614 12 13 9.76142 13 7V6H15V7C15 10.5265 12.3923 13.4439 9 13.9291Z" />
            </svg>
          </div>
        </> : <>
          <div className="captcha-circle">
            <svg
              onClick={() => {
                recordRef.current.pauseRecording()
                recordRef.current.on("record-pause", blob => {
                  onRecordingComplete(blob, recordRef.current.getDuration() / 1000)
                })
              }}
              style={{
                fill: 'red',
              }} width="48" height="48" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="8" height="8" rx="2" />
            </svg>
          </div>
        </>}

        <div className='captcha-wave' ref={containerRef}></div>

        <div className='captcha-duration'>
          {(recordRef.current.getDuration() / 1000).toFixed(2)}s
        </div>
      </div>
    </div >
  );
}

