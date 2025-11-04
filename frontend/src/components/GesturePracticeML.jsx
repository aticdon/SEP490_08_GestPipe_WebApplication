import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { X, PlayCircle, StopCircle, RotateCcw } from 'lucide-react';

// Gesture templates từ CSV data thực tế
const GESTURE_TEMPLATES = {
  "rotate_down": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 1, 0, 0, 0],
    "main_axis_x": 0,
    "main_axis_y": 1,
    "delta_x": -0.002614,
    "delta_y": 0.185558,
    "is_static": false,
    "description": "Rotate down - Index and thumb extended, move down"
  },
  "rotate_left": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 1, 0, 0, 0],
    "main_axis_x": 1,
    "main_axis_y": 0,
    "delta_x": -0.130413,
    "delta_y": -0.005325,
    "is_static": false,
    "description": "Rotate left - Index and thumb extended, move right (your right)"
  },
  "zoom_in": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 1, 1, 0, 0],
    "main_axis_x": 0,
    "main_axis_y": 1,
    "delta_x": 0.0,
    "delta_y": -0.168766,
    "is_static": false,
    "description": "Zoom in - Thumb, index, middle extended, move up"
  },
  "rotate_right": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 1, 0, 0, 0],
    "main_axis_x": 1,
    "main_axis_y": 0,
    "delta_x": 0.117388,
    "delta_y": 0.04424,
    "is_static": false,
    "description": "Rotate right - Index and thumb extended, move left (your left)"
  },
  "zoom_out": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 1, 1, 0, 0],
    "main_axis_x": 0,
    "main_axis_y": 1,
    "delta_x": -0.062817,
    "delta_y": 0.191093,
    "is_static": false,
    "description": "Zoom out - Thumb, index, middle extended, move down"
  },
  "home": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 0, 0, 0, 0],
    "main_axis_x": 1,
    "main_axis_y": 0,
    "delta_x": -0.002603,
    "delta_y": 0.002198,
    "is_static": true,
    "description": "Home - Only thumb extended, hold for 1 second"
  },
  "rotate_up": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 1, 0, 0, 0],
    "main_axis_x": 0,
    "main_axis_y": 1,
    "delta_x": -0.093339,
    "delta_y": -0.186964,
    "is_static": false,
    "description": "Rotate up - Index and thumb extended, move up"
  },
  "previous_slide": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [0, 1, 1, 0, 0],
    "main_axis_x": 1,
    "main_axis_y": 0,
    "delta_x": -0.15216,
    "delta_y": -0.016298,
    "is_static": false,
    "description": "Previous slide - Index and middle extended, move right (your right)"
  },
  "next_slide": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [0, 1, 1, 0, 0],
    "main_axis_x": 1,
    "main_axis_y": 0,
    "delta_x": 0.116381,
    "delta_y": 0.00673,
    "is_static": false,
    "description": "Next slide - Index and middle extended, move left (your left)"
  },
  "end": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [0, 0, 0, 0, 1],
    "main_axis_x": 1,
    "main_axis_y": 0,
    "delta_x": -0.002566,
    "delta_y": -0.002014,
    "is_static": true,
    "description": "End - Only pinky extended, hold for 1 second"
  }
};

const GesturePracticeML = ({ gestureName, onClose, theme = 'dark' }) => {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  
  // State management
  const [practiceState, setPracticeState] = useState("IDLE"); // IDLE, RECORDING, EVALUATING
  const [gestureSequence, setGestureSequence] = useState([]);
  const [leftFistDetected, setLeftFistDetected] = useState(false);
  const [prevLeftFistState, setPrevLeftFistState] = useState(false);
  const [attemptStats, setAttemptStats] = useState({ correct: 0, wrong: 0 });
  const [statusMessage, setStatusMessage] = useState('');
  const [currentHandInfo, setCurrentHandInfo] = useState('');
  
  // Static gesture tracking
  const [staticHoldStartTime, setStaticHoldStartTime] = useState(null);
  const [staticRequiredDuration] = useState(1000);
  const [staticPositions, setStaticPositions] = useState([]);
  
  // Get gesture template
  const template = GESTURE_TEMPLATES[gestureName];
  
  // MediaPipe hands detection
  const getFingerStates = useCallback((landmarks, isLeftHand = false) => {
    if (!landmarks || landmarks.length < 21) return [0, 0, 0, 0, 0];
    
    const fingers = [0, 0, 0, 0, 0];
    
    // THUMB - khác nhau giữa tay trái và tay phải
    if (isLeftHand) {
      if (landmarks[4].x < landmarks[3].x) {
        fingers[0] = 1;
      }
    } else {
      if (landmarks[4].x > landmarks[3].x) {
        fingers[0] = 1;
      }
    }
    
    // Các ngón còn lại
    const fingerTips = [8, 12, 16, 20];
    const fingerPips = [6, 10, 14, 18];
    
    for (let i = 0; i < 4; i++) {
      if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) {
        fingers[i + 1] = 1;
      }
    }
    
    return fingers;
  }, []);
  
  // Motion analysis functions
  const calculateMaxMovement = useCallback((positions) => {
    if (positions.length < 2) return 0;
    
    let maxDist = 0;
    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i].x - positions[0].x;
      const dy = positions[i].y - positions[0].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      maxDist = Math.max(maxDist, dist);
    }
    return maxDist;
  }, []);
  
  const getStaticProgress = useCallback(() => {
    if (!staticHoldStartTime) return "0%";
    const elapsed = Date.now() - staticHoldStartTime;
    const progress = Math.min(100, (elapsed / staticRequiredDuration) * 100);
    return `${Math.round(progress)}%`;
  }, [staticHoldStartTime, staticRequiredDuration]);
  
  // Gesture evaluation
  const analyzeRecordedGesture = useCallback(() => {
    if (!template) {
      return { success: false, message: "No gesture template found" };
    }
    
    if (gestureSequence.length === 0) {
      return { success: false, message: "No gesture data recorded" };
    }
    
    // 1. Analyze finger states (average over all frames)
    const avgFingers = [0, 0, 0, 0, 0];
    for (const frame of gestureSequence) {
      for (let i = 0; i < 5; i++) {
        avgFingers[i] += frame.fingers[i];
      }
    }
    for (let i = 0; i < 5; i++) {
      avgFingers[i] = Math.round(avgFingers[i] / gestureSequence.length);
    }
    
    // Check finger states match
    const fingerMatch = template.right_fingers.every((expected, i) => expected === avgFingers[i]);
    if (!fingerMatch) {
      return { 
        success: false, 
        message: `Wrong fingers: got [${avgFingers.join(',')}], expected [${template.right_fingers.join(',')}]` 
      };
    }
    
    // 2. For static gestures, special validation
    if (template.is_static) {
      if (!staticHoldStartTime) {
        return { success: false, message: "Static gesture not held properly" };
      }
      
      const holdDuration = Date.now() - staticHoldStartTime;
      if (holdDuration < staticRequiredDuration) {
        return { success: false, message: `Hold for ${((staticRequiredDuration - holdDuration) / 1000).toFixed(1)}s more` };
      }
      
      const maxMovement = calculateMaxMovement(staticPositions);
      if (maxMovement > 0.03) {
        return { 
          success: false, 
          message: `Too much movement during hold (${(maxMovement * 100).toFixed(1)}cm)` 
        };
      }
      
      return { success: true, message: `Perfect static ${gestureName}! Held for ${(holdDuration / 1000).toFixed(1)}s` };
    }
    
    // 3. For dynamic gestures, check motion
    if (gestureSequence.length < 3) {
      return { success: false, message: "Too few motion frames" };
    }
    
    const startWrist = gestureSequence[0].wrist;
    const endWrist = gestureSequence[gestureSequence.length - 1].wrist;
    const deltaX = endWrist.x - startWrist.x;
    const deltaY = endWrist.y - startWrist.y;
    const deltaMag = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Check sufficient motion
    if (deltaMag < 0.03) {
      return { success: false, message: "Not enough motion detected" };
    }
    
    // Check motion direction
    const expectedMainX = template.main_axis_x;
    const actualMainX = Math.abs(deltaX) >= Math.abs(deltaY) ? 1 : 0;
    
    if (expectedMainX !== actualMainX) {
      const expectedDir = expectedMainX ? 'horizontal' : 'vertical';
      const actualDir = actualMainX ? 'horizontal' : 'vertical';
      return { 
        success: false, 
        message: `Wrong direction: moved ${actualDir}, expected ${expectedDir}` 
      };
    }
    
    // Check specific direction within main axis (với camera mirror)
    if (expectedMainX === 1) {
      // Horizontal motion - FLIP for camera mirror effect
      const expectedRight = template.delta_x > 0;
      const actualRight = deltaX < 0; // FLIPPED: camera mirror effect
      if (expectedRight !== actualRight) {
        return { 
          success: false, 
          message: `Wrong horizontal direction: moved ${actualRight ? 'right' : 'left'}, expected ${expectedRight ? 'right' : 'left'}` 
        };
      }
    } else {
      // Vertical motion - NO FLIP needed
      const expectedDown = template.delta_y > 0;
      const actualDown = deltaY > 0;
      if (expectedDown !== actualDown) {
        return { 
          success: false, 
          message: `Wrong vertical direction: moved ${actualDown ? 'down' : 'up'}, expected ${expectedDown ? 'down' : 'up'}` 
        };
      }
    }
    
    return { success: true, message: `Perfect ${gestureName}!` };
  }, [template, gestureSequence, gestureName, staticHoldStartTime, staticRequiredDuration, calculateMaxMovement, staticPositions]);
  
  // Practice session functions
  // Remove startPracticeRecording - now integrated in processGestures
  
  const handleStaticGesture = useCallback((fingerStates, wrist, currentTime) => {
    if (!template) return;
    
    const correctFingers = template.right_fingers.every((expected, i) => expected === fingerStates[i]);
    
    if (correctFingers) {
      if (!staticHoldStartTime) {
        setStaticHoldStartTime(currentTime);
        setStaticPositions([{ x: wrist.x, y: wrist.y, time: currentTime }]);
      } else {
        setStaticPositions(prev => [...prev, { x: wrist.x, y: wrist.y, time: currentTime }]);
        
        const movement = calculateMaxMovement([...staticPositions, { x: wrist.x, y: wrist.y, time: currentTime }]);
        if (movement > 0.03) {
          setStaticHoldStartTime(null);
          setStaticPositions([]);
          return;
        }
        
        const holdDuration = currentTime - staticHoldStartTime;
        if (holdDuration >= staticRequiredDuration) {
          setTimeout(() => evaluatePracticeGesture(), 100);
        }
      }
    } else {
      setStaticHoldStartTime(null);
      setStaticPositions([]);
    }
  }, [template, staticHoldStartTime, staticPositions, calculateMaxMovement, staticRequiredDuration]);
  
  const evaluatePracticeGesture = () => {
    // Get current sequence length
    setGestureSequence(currentSequence => {
      console.log('🔍 Evaluating gesture, current sequence length:', currentSequence.length);
      
      if (currentSequence.length === 0) {
        setStatusMessage('⚠️ No gesture data recorded');
        setPracticeState("IDLE");
        return currentSequence;
      }
      
      setStatusMessage(`🔍 Evaluating gesture...`);
      
      // Evaluate with current sequence
      const result = analyzeGestureWithSequence(currentSequence);
      
      if (result.success) {
        setAttemptStats(prev => ({ ...prev, correct: prev.correct + 1 }));
        setStatusMessage(`✅ CORRECT! ${result.message}`);
        toast.success(`✅ ${result.message}`);
      } else {
        setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
        setStatusMessage(`❌ WRONG: ${result.message}`);
        toast.error(`❌ ${result.message}`);
      }
      
      setTimeout(() => {
        setPracticeState("IDLE");
        setStatusMessage(`🎯 Practice ${gestureName} - Close left fist to try again`);
      }, 3000);
      
      return currentSequence;
    });
  };
  
  // New function to analyze gesture with given sequence
  const analyzeGestureWithSequence = (sequence) => {
    if (!template) {
      return { success: false, message: "No gesture template found" };
    }
    
    if (sequence.length === 0) {
      return { success: false, message: "No gesture data recorded" };
    }
    
    // Same analysis logic as before but with passed sequence
    const avgFingers = [0, 0, 0, 0, 0];
    for (const frame of sequence) {
      for (let i = 0; i < 5; i++) {
        avgFingers[i] += frame.fingers[i];
      }
    }
    for (let i = 0; i < 5; i++) {
      avgFingers[i] = Math.round(avgFingers[i] / sequence.length);
    }
    
    const fingerMatch = template.right_fingers.every((expected, i) => expected === avgFingers[i]);
    if (!fingerMatch) {
      return { 
        success: false, 
        message: `Wrong fingers: got [${avgFingers.join(',')}], expected [${template.right_fingers.join(',')}]` 
      };
    }
    
    if (template.is_static) {
      if (!staticHoldStartTime) {
        return { success: false, message: "Static gesture not held properly" };
      }
      
      const holdDuration = Date.now() - staticHoldStartTime;
      if (holdDuration < staticRequiredDuration) {
        return { success: false, message: `Hold for ${((staticRequiredDuration - holdDuration) / 1000).toFixed(1)}s more` };
      }
      
      const maxMovement = calculateMaxMovement(staticPositions);
      if (maxMovement > 0.03) {
        return { 
          success: false, 
          message: `Too much movement during hold (${(maxMovement * 100).toFixed(1)}cm)` 
        };
      }
      
      return { success: true, message: `Perfect static ${gestureName}! Held for ${(holdDuration / 1000).toFixed(1)}s` };
    }
    
    if (sequence.length < 3) {
      return { success: false, message: "Too few motion frames" };
    }
    
    const startWrist = sequence[0].wrist;
    const endWrist = sequence[sequence.length - 1].wrist;
    const deltaX = endWrist.x - startWrist.x;
    const deltaY = endWrist.y - startWrist.y;
    const deltaMag = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (deltaMag < 0.03) {
      return { success: false, message: "Not enough motion detected" };
    }
    
    const expectedMainX = template.main_axis_x;
    const actualMainX = Math.abs(deltaX) >= Math.abs(deltaY) ? 1 : 0;
    
    if (expectedMainX !== actualMainX) {
      const expectedDir = expectedMainX ? 'horizontal' : 'vertical';
      const actualDir = actualMainX ? 'horizontal' : 'vertical';
      return { 
        success: false, 
        message: `Wrong direction: moved ${actualDir}, expected ${expectedDir}` 
      };
    }
    
    if (expectedMainX === 1) {
      const expectedRight = template.delta_x > 0;
      const actualRight = deltaX < 0;
      if (expectedRight !== actualRight) {
        return { 
          success: false, 
          message: `Wrong horizontal direction: moved ${actualRight ? 'right' : 'left'}, expected ${expectedRight ? 'right' : 'left'}` 
        };
      }
    } else {
      const expectedDown = template.delta_y > 0;
      const actualDown = deltaY > 0;
      if (expectedDown !== actualDown) {
        return { 
          success: false, 
          message: `Wrong vertical direction: moved ${actualDown ? 'down' : 'up'}, expected ${expectedDown ? 'down' : 'up'}` 
        };
      }
    }
    
    return { success: true, message: `Perfect ${gestureName}!` };
  };
  
  // MediaPipe results handler
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas?.getContext('2d');
    if (!canvas || !canvasCtx) return;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandedness) {
      let leftHand = null, rightHand = null;
      
      for (let index = 0; index < results.multiHandLandmarks.length; index++) {
        const classification = results.multiHandedness[index];
        const landmarks = results.multiHandLandmarks[index];
        
        // Draw landmarks với màu khác nhau
        const isLeft = classification.label === 'Right'; // MediaPipe Web trả về ngược
        drawLandmarks(canvasCtx, landmarks, isLeft ? '#00FF00' : '#FF0000');
        
        if (classification.label === 'Right') {
          leftHand = landmarks;
        } else if (classification.label === 'Left') {
          rightHand = landmarks;
        }
      }
      
      processGestures({ leftHand, rightHand });
    }
    
    canvasCtx.restore();
  }, []);
  
  // Draw landmarks function
  const drawLandmarks = useCallback((ctx, landmarks, color = '#FF0000') => {
    ctx.fillStyle = color;
    for (const landmark of landmarks) {
      const x = landmark.x * canvasRef.current.width;
      const y = landmark.y * canvasRef.current.height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    if (landmarks.length > 0) {
      const wrist = landmarks[0];
      const x = wrist.x * canvasRef.current.width;
      const y = wrist.y * canvasRef.current.height;
      
      ctx.fillStyle = color;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const handLabel = color === '#00FF00' ? 'LEFT' : 'RIGHT';
      ctx.fillText(handLabel, x, y - 20);
    }
  }, []);
  
  // Process gestures function  
  const processGestures = useCallback(({ leftHand, rightHand }) => {
    let info = '🖐️ ';
    
    // Kiểm tra có cả 2 tay không
    if (!leftHand || !rightHand) {
      console.log('⚠️ Missing hands - Left:', !!leftHand, 'Right:', !!rightHand);
      setCurrentHandInfo('❌ Need both hands');
      return;
    }
    
    const currentLeftFist = getFingerStates(leftHand, true).every(f => f === 0);
    const leftFingers = getFingerStates(leftHand, true);
    const rightFingers = getFingerStates(rightHand, false);
    
    info += `Left[${leftFingers.join(',')}] Right[${rightFingers.join(',')}] `;
    
    // Debug log chi tiết
    console.log('🖐️ Hands detected - Left fingers:', leftFingers, 'Is fist:', currentLeftFist);
    console.log('📊 Current practiceState:', practiceState, 'Prev fist state:', prevLeftFistState);
    
    // State machine logic với template
    if (template) {
      if (currentLeftFist && !prevLeftFistState) {
        console.log('� FIST DETECTED - SHOULD TRANSITION TO RECORDING');
        setPracticeState(currentState => {
          console.log('🔄 Functional update - Current state:', currentState);
          if (currentState === "IDLE") {
            console.log('✅ TRANSITIONING: IDLE → RECORDING');
            
            // Reset data
            setGestureSequence([]);
            setStaticHoldStartTime(null);
            setStaticPositions([]);
            
            if (template.is_static) {
              setStatusMessage(`🔵 Static ${gestureName} - Hold correct fingers for 1 second...`);
            } else {
              setStatusMessage(`🔴 Recording ${gestureName} - Make gesture with right hand...`);
            }
            
            return "RECORDING";
          }
          console.log('⚠️ Not transitioning - current state is not IDLE');
          return currentState;
        });
      } else if (!currentLeftFist && prevLeftFistState) {
        console.log('✋ FIST RELEASED - SHOULD EVALUATE');
        setPracticeState(currentState => {
          console.log('🔄 Functional update - Current state:', currentState);
          if (currentState === "RECORDING") {
            console.log('✅ TRANSITIONING: RECORDING → EVALUATING');
            setTimeout(() => evaluatePracticeGesture(), 100);
            return "EVALUATING";
          }
          console.log('⚠️ Not evaluating - current state is not RECORDING');
          return currentState;
        });
      }
      
      if (currentLeftFist) info += '👊 FIST! ';
    }
    
    // Handle recording
    if (practiceState === "RECORDING") {
      console.log('🎬 In RECORDING mode - capturing right hand');
      const wrist = rightHand[0];
      const currentTime = Date.now();
      
      const frameData = {
        timestamp: currentTime,
        fingers: rightFingers,
        wrist: { x: wrist.x, y: wrist.y },
        landmarks: rightHand
      };
      
      setGestureSequence(prev => {
        const newSequence = [...prev, frameData];
        console.log('📹 Recording frame', newSequence.length, 'fingers:', rightFingers);
        return newSequence;
      });
      
      if (template && template.is_static) {
        handleStaticGesture(rightFingers, wrist, currentTime);
        info += ` 🔵 STATIC:${getStaticProgress()}`;
      } else {
        info += ` 🔴 REC:${gestureSequence.length + 1}`;
      }
    }
    
    setPrevLeftFistState(currentLeftFist);
    
    if (template) {
      info += ` | State: ${practiceState}`;
    }
    
    setCurrentHandInfo(info);
  }, [getFingerStates, template, prevLeftFistState, practiceState, gestureSequence.length]);
  
  // Initialize MediaPipe
  useEffect(() => {
    let mounted = true;
    
    const initializeMediaPipe = async () => {
      try {
        // Initialize MediaPipe Hands
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        
        hands.onResults(onResults);
        handsRef.current = hands;
        
        // Initialize camera
        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current && videoRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });
          
          cameraRef.current = camera;
          await camera.start();
          
          if (mounted) {
            setStatusMessage(`🎯 Practice ${gestureName} - Close left fist to start!`);
            toast.success('MediaPipe loaded successfully!');
          }
        }
      } catch (error) {
        console.error('MediaPipe initialization error:', error);
        if (mounted) {
          setStatusMessage('❌ Failed to initialize MediaPipe');
          toast.error('Failed to initialize camera and MediaPipe');
        }
      }
    };
    
    initializeMediaPipe();
    
    return () => {
      mounted = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [gestureName, onResults]);
  
  // Initialize canvas size
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }
  }, []);
  
  // Helper functions
  const fingerNames = (fingerStates) => {
    const names = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
    const open = fingerStates.map((state, i) => state ? names[i] : null).filter(Boolean);
    return open.length ? open.join(', ') + ' extended' : 'All closed (fist)';
  };
  
  const getMotionDescription = (template) => {
    if (template.main_axis_x === 1) {
      return template.delta_x > 0 ? 'move LEFT (your left)' : 'move RIGHT (your right)';
    } else {
      return template.delta_y > 0 ? 'move DOWN' : 'move UP';
    }
  };
  
  const resetStats = () => {
    setAttemptStats({ correct: 0, wrong: 0 });
    toast.success('📊 Stats reset!');
  };
  
  const total = attemptStats.correct + attemptStats.wrong;
  const accuracy = total > 0 ? ((attemptStats.correct / total) * 100).toFixed(1) : 0;

  if (!template) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
          <h3 className="text-lg font-semibold mb-4">❌ Gesture Not Found</h3>
          <p>Gesture "{gestureName}" is not available in the practice system.</p>
          <button
            onClick={onClose}
            className={`mt-4 px-4 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-4xl mx-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className="text-xl font-bold">🎯 Practice: {gestureName.toUpperCase()}</h2>
            <p className="text-sm opacity-75 mt-1">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : ''}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h3 className="font-semibold mb-2">📋 Instructions:</h3>
            <div className="space-y-2 text-sm">
              <p>• Right hand fingers: [{template.right_fingers.join(',')}] ({fingerNames(template.right_fingers)})</p>
              <p>• {template.is_static ? '🔷 Static gesture - Hold for 1 second without moving!' : '🔶 Dynamic gesture - ' + getMotionDescription(template)}</p>
              <div className="border-t pt-2 mt-2">
                <p><strong>How to practice:</strong></p>
                <p>1. 👊 Close LEFT fist to start recording</p>
                <p>2. ✋ Make gesture with RIGHT hand</p>
                <p>3. 🖐️ Open LEFT fist to evaluate</p>
              </div>
            </div>
          </div>
          
          {/* Camera and Canvas */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-[640px] h-[480px] border rounded-lg transform scale-x-[-1]"
                style={{ backgroundColor: '#333' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-[640px] h-[480px] pointer-events-none transform scale-x-[-1]"
              />
            </div>
          </div>
          
          {/* Status */}
          <div className={`p-3 rounded-lg text-center mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className="font-medium">{statusMessage}</p>
          </div>
          
          {/* Hand Info */}
          <div className={`p-2 rounded-lg text-sm text-center mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p>{currentHandInfo}</p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                📊 Correct: <span className="font-bold text-green-500">{attemptStats.correct}</span>
              </span>
              <span className="text-sm">
                Wrong: <span className="font-bold text-red-500">{attemptStats.wrong}</span>
              </span>
              <span className="text-sm">
                Accuracy: <span className="font-bold text-blue-500">{accuracy}%</span>
              </span>
            </div>
            
            <button
              onClick={resetStats}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Stats</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GesturePracticeML;