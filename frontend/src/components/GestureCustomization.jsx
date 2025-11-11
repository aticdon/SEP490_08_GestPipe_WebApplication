import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { X, Zap } from 'lucide-react';
import { customizeGesture } from '../services/gestureService';

const REQUIRED_SAMPLES = 5;
const MIN_FRAMES = 12;

const getFingerStates = (landmarks, isLeftHand = false) => {
  if (!landmarks || landmarks.length < 21) return [0, 0, 0, 0, 0];

  const fingers = [0, 0, 0, 0, 0];

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const indexMcp = landmarks[5];
  const mcpMiddle = landmarks[9];
  const mcpPinky = landmarks[17];

  const v1 = [mcpMiddle.x - wrist.x, mcpMiddle.y - wrist.y];
  const v2 = [mcpPinky.x - wrist.x, mcpPinky.y - wrist.y];
  const crossZ = v1[0] * v2[1] - v1[1] * v2[0];
  const palmFacing = crossZ > 0 ? 1 : -1;

  const palmCenterX = (indexMcp.x + mcpPinky.x) / 2;
  const palmCenterY = (indexMcp.y + mcpPinky.y) / 2;
  const thumbToPalmDist = Math.sqrt(
    Math.pow(thumbTip.x - palmCenterX, 2) + Math.pow(thumbTip.y - palmCenterY, 2)
  );

  const thumbExtendedX = Math.abs(thumbTip.x - thumbMcp.x) > 0.04;
  const thumbExtendedY = Math.abs(thumbTip.y - thumbMcp.y) > 0.03;

  let thumbPositionOpen = false;
  if (isLeftHand) {
    if (palmFacing > 0) {
      thumbPositionOpen = thumbTip.x < thumbIp.x;
    } else {
      thumbPositionOpen = thumbTip.x > thumbIp.x;
    }
  } else {
    if (palmFacing > 0) {
      thumbPositionOpen = thumbTip.x < thumbIp.x;
    } else {
      thumbPositionOpen = thumbTip.x > thumbIp.x;
    }
  }

  const angleBetweenPoints = (p1, p2, p3) => {
    const vec1 = [p1.x - p2.x, p1.y - p2.y];
    const vec2 = [p3.x - p2.x, p3.y - p2.y];
    const dot = vec1[0] * vec2[0] + vec1[1] * vec2[1];
    const mag1 = Math.hypot(vec1[0], vec1[1]);
    const mag2 = Math.hypot(vec2[0], vec2[1]);
    if (!mag1 || !mag2) return 0;
    const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return (Math.acos(cos) * 180) / Math.PI;
  };

  const thumbAngle = angleBetweenPoints(thumbMcp, thumbIp, thumbTip);
  const thumbStraight = thumbAngle > 140;

  const distanceOpen = thumbToPalmDist > 0.08;
  const extensionOpen = thumbExtendedX || thumbExtendedY;
  const angleOpen = thumbStraight;

  const thumbIsOpen = (distanceOpen || extensionOpen || angleOpen) && thumbPositionOpen;
  fingers[0] = thumbIsOpen ? 1 : 0;

  fingers[1] = landmarks[8].y < landmarks[6].y ? 1 : 0;
  fingers[2] = landmarks[12].y < landmarks[10].y ? 1 : 0;
  fingers[3] = landmarks[16].y < landmarks[14].y ? 1 : 0;
  fingers[4] = landmarks[20].y < landmarks[18].y ? 1 : 0;

  return fingers;
};

const smoothPoints = (points) => {
  if (points.length <= 2) return points;
  return points.map((point, idx) => {
    const prev = points[idx - 1] ?? point;
    const next = points[idx + 1] ?? point;
    return {
      x: (prev.x + point.x + next.x) / 3,
      y: (prev.y + point.y + next.y) / 3,
    };
  });
};

const buildSampleFromBuffer = (buffer, leftStates, rightStates, poseLabel, instanceId) => {
  const smoothed = smoothPoints(buffer);
  const first = smoothed[0];
  const middle = smoothed[Math.floor(smoothed.length / 2)];
  const last = smoothed[smoothed.length - 1];
  const deltaX = last.x - first.x;
  const deltaY = last.y - first.y;
  const mainAxisX = Math.abs(deltaX) >= Math.abs(deltaY) ? 1 : 0;
  const mainAxisY = Math.abs(deltaY) > Math.abs(deltaX) ? 1 : 0;

  return {
    instance_id: instanceId,
    pose_label: poseLabel,
    left_finger_state: leftStates ?? [0, 0, 0, 0, 0],
    right_finger_state: rightStates ?? [0, 0, 0, 0, 0],
    motion_x_start: first.x,
    motion_y_start: first.y,
    motion_x_mid: middle.x,
    motion_y_mid: middle.y,
    motion_x_end: last.x,
    motion_y_end: last.y,
    main_axis_x: mainAxisX,
    main_axis_y: mainAxisY,
    delta_x: deltaX,
    delta_y: deltaY,
  };
};

function GestureCustomization({
  gestureName,
  admin,
  onClose,
  onCompleted,
  resetSession = false,
  theme = 'dark',
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle, recording, success, error
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [samples, setSamples] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Put two hands to record.');
  const uploadingRef = useRef(false);

  

  const recordingStateRef = useRef('WAIT');
  const bufferRef = useRef([]);
  const currentLeftStateRef = useRef([0, 0, 0, 0, 0]);
  const currentRightStateRef = useRef([0, 0, 0, 0, 0]);
  const instanceCounterRef = useRef(1);
  const prevLeftFistRef = useRef(false);

  useEffect(() => {
    setSamples([]);
    setStatus('idle');
    setMessage('');
    setStatusMessage('Put two hands to record.');
    setIsUploading(false);
    recordingStateRef.current = 'WAIT';
    bufferRef.current = [];
    instanceCounterRef.current = 1;
  }, [gestureName, admin]);

  const handleSampleCompleted = useCallback(
    async (sample) => {
      setSamples((prev) => {
        const updated = [...prev, sample];
        setStatusMessage(`Collected ${updated.length}/${REQUIRED_SAMPLES} samples`);
        if (updated.length >= REQUIRED_SAMPLES && !uploadingRef.current) {
          uploadingRef.current = true;
          setIsUploading(true);
          (async () => {
            setStatus('recording');
            setMessage('Uploading samples...');
            setStatusMessage('Uploading samples to server, please wait...');
            try {
              await customizeGesture({
                adminId: admin?.id || admin?._id,
                gestureName,
                samples: updated,
              });
              setStatus('success');
              setMessage('Uploaded successfully.');
              toast.success(`Customization for ${gestureName} complete!`);
              if (onCompleted) {
                onCompleted(gestureName);
              }
              uploadingRef.current = false;
              setIsUploading(false);
              setTimeout(onClose, 2000);
            } catch (err) {
              const errorMessage =
                err.response?.data?.message || 'Failed to upload custom gesture samples.';
              setStatus('error');
              setMessage(errorMessage);
              toast.error(errorMessage);
              uploadingRef.current = false;
              setIsUploading(false);
              setStatusMessage('Upload failed. You can try recording again.');
            }
          })();
        }
        return updated;
      });
    },
    [admin, gestureName, isUploading, onClose]
  );

  const onResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      const canvasCtx = canvas?.getContext('2d');
      if (!canvas || !canvasCtx) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      const hands = [];
      if (results.multiHandLandmarks && results.multiHandedness) {
        results.multiHandLandmarks.forEach((landmarks, idx) => {
          const mpLabel = results.multiHandedness[idx]?.label || 'Left';
          // Camera feed mirrored horizontally, swap labels to match user's view
          const userLabel = mpLabel === 'Left' ? 'Right' : 'Left';
          hands.push({ handedness: userLabel, landmarks });
          for (const landmark of landmarks) {
            const x = landmark.x * canvas.width;
            const y = landmark.y * canvas.height;
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 3, 0, 2 * Math.PI);
            canvasCtx.fillStyle = '#FFCC00';
            canvasCtx.fill();
          }
        });
      }
      canvasCtx.restore();
      if (loading) setLoading(false);

      const leftHand = hands.find((hand) => hand.handedness === 'Left');
      const rightHand = hands.find((hand) => hand.handedness === 'Right');

      const leftPresent = Boolean(leftHand);
      const rightPresent = Boolean(rightHand);

      const leftStates = getFingerStates(leftHand?.landmarks, true);
      const rightStates = getFingerStates(rightHand?.landmarks, false);
      const currentLeftFist = leftStates.slice(1).every((finger) => finger === 0);
      const prevLeftFist = prevLeftFistRef.current;

      const wrist = rightHand?.landmarks?.[0];

      if (!leftPresent || !rightPresent) {
        recordingStateRef.current = 'WAIT';
        bufferRef.current = [];
        prevLeftFistRef.current = false;
        if (!isUploading) {
          setStatusMessage('Need both hands in frame to record.');
        }
        return;
      }

      if (recordingStateRef.current === 'WAIT') {
        if (!isUploading) {
          setStatusMessage('Put two hands to record – close left fist to start.');
        }
        if (!isUploading && currentLeftFist && !prevLeftFist && wrist) {
          recordingStateRef.current = 'RECORD';
          bufferRef.current = [];
          currentLeftStateRef.current = leftStates;
          currentRightStateRef.current = rightStates;
          setStatusMessage('Recording... release left fist to stop.');
        }
      } else if (recordingStateRef.current === 'RECORD') {
        if (wrist) {
          bufferRef.current.push({ x: wrist.x, y: wrist.y });
        }
        if (!currentLeftFist && prevLeftFist) {
          recordingStateRef.current = 'PROCESS';
        }
      } else if (recordingStateRef.current === 'PROCESS') {
        const buffer = bufferRef.current;
        recordingStateRef.current = 'WAIT';
        if (!buffer || buffer.length < MIN_FRAMES) {
          setStatusMessage('Sample too short. Try again.');
          return;
        }
        const sample = buildSampleFromBuffer(
          buffer,
          currentLeftStateRef.current,
          currentRightStateRef.current,
          gestureName,
          instanceCounterRef.current
        );
        instanceCounterRef.current += 1;
        bufferRef.current = [];
        setStatusMessage('Sample captured! Get ready for the next one.');
        handleSampleCompleted(sample);
      }

      prevLeftFistRef.current = currentLeftFist;
    },
    [loading, gestureName, handleSampleCompleted, isUploading]
  );

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    handsRef.current = hands;

    const startCamera = async () => {
      if (!videoRef.current) return;
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      await camera.start();
    };

    startCamera();

    return () => {
      cameraRef.current?.stop();
      cameraRef.current = null;
      handsRef.current?.close();
      handsRef.current = null;
    };
  }, []);

  useEffect(() => {
    handsRef.current?.onResults(onResults);
  }, [onResults]);

  const handleStartCustomization = () => {
    setSamples([]);
    setStatus('recording');
    setMessage('Recording started. Close/open left fist 5 times to capture samples.');
    setStatusMessage('Recording... follow the instructions on screen.');
    setIsUploading(false);
    instanceCounterRef.current = 1;
    bufferRef.current = [];
    recordingStateRef.current = 'WAIT';
    prevLeftFistRef.current = false;
    uploadingRef.current = false;
    toast.info(`Recording gesture ${gestureName}.`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-xl max-w-2xl w-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className={`flex justify-between items-center p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-xl font-bold">Customize Gesture: {gestureName}</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 relative">
          {loading && status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10 rounded-lg">
              <p>Loading Camera...</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full rounded-lg border border-gray-600"
            style={{ transform: 'scaleX(-1)' }}
          />
          <video ref={videoRef} className="hidden" autoPlay playsInline muted />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/60 text-white text-sm">
            {statusMessage}
          </div>
        </div>

        <div className="p-4 flex flex-col items-center gap-4 border-t border-gray-700">
            <p className="text-sm text-gray-400 text-center">
              Put two hands to record, giữ tay trái nắm lại để bắt đầu ghi và thả ra để kết thúc một sample. Cần {REQUIRED_SAMPLES} lần thu hợp lệ.
            </p>
            <p className="text-base font-semibold text-cyan-300">
              Samples: {samples.length}/{REQUIRED_SAMPLES}
            </p>
            <button
                onClick={handleStartCustomization}
                disabled={status === 'recording' || isUploading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 disabled:bg-gray-500 transition-all"
            >
                <Zap size={20} />
                {status === 'recording' ? 'Recording in Progress...' : 'Start Customization'}
            </button>
            {message && (
                <p className={`mt-2 text-center font-medium h-5 ${
                    status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-gray-300'
                }`}>
                    {message}
                </p>
            )}
        </div>
      </div>
    </div>
  );
}

export default GestureCustomization;





