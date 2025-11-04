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
  "zoom_out": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 1, 1, 0, 0],
    "main_axis_x": 0,
    "main_axis_y": 1,
    "delta_x": 0.0,
    "delta_y": 0.168766,
    "is_static": false,
    "description": "Zoom out - Thumb, index, middle extended, move down"
  },
  "rotate_up": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 1, 0, 0, 0],
    "main_axis_x": 0,
    "main_axis_y": 1,
    "delta_x": 0.028591,
    "delta_y": -0.185792,
    "is_static": false,
    "description": "Rotate up - Index and thumb extended, move up"
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
    "right_fingers": [1, 1, 1, 1, 1],
    "main_axis_x": 1,
    "main_axis_y": 1,
    "delta_x": 0.0,
    "delta_y": 0.0,
    "is_static": true,
    "description": "End - All fingers extended, static hold"
  },
  "home": {
    "left_fingers": [0, 0, 0, 0, 0],
    "right_fingers": [1, 0, 0, 0, 0],
    "main_axis_x": 1,
    "main_axis_y": 1,
    "delta_x": 0.0,
    "delta_y": 0.0,
    "is_static": true,
    "description": "Home - Only thumb extended, static hold"
  }
};

function GesturePracticeMLFixed({ gestureName, onClose }) {
  // Debug gesture name
  console.log('🎯 GesturePracticeMLFixed received gestureName:', gestureName);
  console.log('📋 Available templates:', Object.keys(GESTURE_TEMPLATES));
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const initializingRef = useRef(false);
  
  // State management - WITH REF TRACKING
  const [practiceState, setPracticeState] = useState("IDLE");
  const [gestureSequence, setGestureSequence] = useState([]);
  const [prevLeftFist, setPrevLeftFist] = useState(false);
  const [attemptStats, setAttemptStats] = useState({ correct: 0, wrong: 0 });
  const [statusMessage, setStatusMessage] = useState('');
  const [currentHandInfo, setCurrentHandInfo] = useState('');
  
  // Add refs to track actual values
  const practiceStateRef = useRef("IDLE");
  const prevLeftFistRef = useRef(false);
  const gestureSequenceRef = useRef([]);
  
  // Add timestamp to prevent double evaluation  
  const lastEvalTimeRef = useRef(0);
  
  // Static gesture tracking
  const [staticHoldStartTime, setStaticHoldStartTime] = useState(null);
  const [staticPositions, setStaticPositions] = useState([]);
  const staticRequiredDuration = 1000;
  
  // Map gesture names from database to template names
  const gestureNameMapping = {
    "Rotate_down": "rotate_down",
    "Rotate_left": "rotate_left", 
    "Rotate_right": "rotate_right",
    "Rotate_up": "rotate_up",
    "Zoom_in": "zoom_in",
    "Zoom_out": "zoom_out",
    "Previous_slide": "previous_slide",
    "Next_slide": "next_slide",
    "End": "end",
    "Home": "home"
  };
  
  const templateName = gestureNameMapping[gestureName] || gestureName.toLowerCase();
  const template = GESTURE_TEMPLATES[templateName];
  
  console.log('🔄 Gesture mapping:', {
    originalName: gestureName,
    mappedName: templateName,
    templateExists: !!template,
    templateData: template,
    availableTemplates: Object.keys(GESTURE_TEMPLATES)
  });
  
  // Finger state detection - IMPROVED PYTHON LOGIC PORT
  const getFingerStates = useCallback((landmarks, isLeftHand = false) => {
    if (!landmarks || landmarks.length < 21) return [0, 0, 0, 0, 0];
    
    const fingers = [0, 0, 0, 0, 0];
    
    // Get key landmarks
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];      // Thumb tip
    const thumbIp = landmarks[3];       // Thumb IP joint  
    const thumbMcp = landmarks[2];      // Thumb MCP joint
    const indexMcp = landmarks[5];      // Index MCP joint
    const mcpMiddle = landmarks[9];     // Middle MCP
    const mcpPinky = landmarks[17];     // Pinky MCP

    // Determine palm orientation
    const v1 = [mcpMiddle.x - wrist.x, mcpMiddle.y - wrist.y];
    const v2 = [mcpPinky.x - wrist.x, mcpPinky.y - wrist.y];
    const crossZ = v1[0] * v2[1] - v1[1] * v2[0];
    const palmFacing = crossZ > 0 ? 1 : -1;

    // IMPROVED THUMB DETECTION (4 methods combined)
    
    // Method 1: Distance from thumb tip to palm center
    const palmCenterX = (indexMcp.x + mcpPinky.x) / 2;
    const palmCenterY = (indexMcp.y + mcpPinky.y) / 2;
    const thumbToPalmDist = Math.sqrt(
      Math.pow(thumbTip.x - palmCenterX, 2) + Math.pow(thumbTip.y - palmCenterY, 2)
    );
    
    // Method 2: Thumb extension check (tip vs MCP joint)
    const thumbExtendedX = Math.abs(thumbTip.x - thumbMcp.x) > 0.04; // Extended horizontally
    const thumbExtendedY = Math.abs(thumbTip.y - thumbMcp.y) > 0.03; // Extended vertically
    
    // Method 3: Relative position check (handedness-aware)
    let thumbPositionOpen = false;
    const handednessLabel = isLeftHand ? "Left" : "Right";
    
    if (handednessLabel === "Right") {
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
    
    // Method 4: Angle-based detection (thumb joints alignment)
    const angleBetweenPoints = (p1, p2, p3) => {
      const v1 = [p1.x - p2.x, p1.y - p2.y];
      const v2 = [p3.x - p2.x, p3.y - p2.y];
      
      const dotProduct = v1[0] * v2[0] + v1[1] * v2[1];
      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
      
      if (mag1 === 0 || mag2 === 0) return 0;
      
      const cosAngle = Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2)));
      return (Math.acos(cosAngle) * 180) / Math.PI;
    };
    
    const thumbAngle = angleBetweenPoints(thumbMcp, thumbIp, thumbTip);
    const thumbStraight = thumbAngle > 140; // Straight thumb (extended)
    
    // COMBINED THUMB DECISION (Multiple criteria with OR logic)
    const distanceOpen = thumbToPalmDist > 0.08;
    const extensionOpen = thumbExtendedX || thumbExtendedY;
    const angleOpen = thumbStraight;
    
    // Use OR logic - if any method detects open thumb AND position check passes
    const thumbIsOpen = (distanceOpen || extensionOpen || angleOpen) && thumbPositionOpen;
    fingers[0] = thumbIsOpen ? 1 : 0;
    
    // Other fingers - simple tip vs MCP comparison
    fingers[1] = landmarks[8].y < landmarks[6].y ? 1 : 0;   // Index: tip vs PIP
    fingers[2] = landmarks[12].y < landmarks[10].y ? 1 : 0; // Middle: tip vs PIP
    fingers[3] = landmarks[16].y < landmarks[14].y ? 1 : 0; // Ring: tip vs PIP
    fingers[4] = landmarks[20].y < landmarks[18].y ? 1 : 0; // Pinky: tip vs PIP
    
    console.log('✋ Final finger states:', fingers);
    return fingers;
  }, []);
  
  // Static progress calculation
  const getStaticProgress = useCallback(() => {
    if (!staticHoldStartTime) return "0%";
    const elapsed = Date.now() - staticHoldStartTime;
    const progress = Math.min(100, (elapsed / staticRequiredDuration) * 100);
    return `${Math.round(progress)}%`;
  }, [staticHoldStartTime, staticRequiredDuration]);
  
  // Handle static gesture - FIXED LOGIC
  const handleStaticGesture = useCallback((rightFingers, wrist, currentTime) => {
    if (!template || !template.is_static) {
      console.log('🔵 Not a static gesture, skipping...');
      return;
    }
    
    const targetFingers = template.right_fingers;
    const fingersMatch = rightFingers.every((f, i) => f === targetFingers[i]);
    
    console.log(`🔵 Static ${gestureName}: [${rightFingers.join(',')}] vs [${targetFingers.join(',')}] = ${fingersMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    if (fingersMatch) {
      if (!staticHoldStartTime) {
        console.log('🔵 ✅ MATCH! Starting timer...');
        setStaticHoldStartTime(currentTime);
        setStaticPositions([{ x: wrist.x, y: wrist.y }]);
      } else {
        setStaticPositions(prev => [...prev, { x: wrist.x, y: wrist.y }]);
        const holdDuration = currentTime - staticHoldStartTime;
        if (holdDuration % 200 < 50) { // Log every ~200ms
          console.log(`🔵 ⏱️ Holding: ${(holdDuration/1000).toFixed(1)}s / 1.0s`);
        }
      }
    } else {
      if (staticHoldStartTime) {
        console.log('🔵 ❌ Lost match - timer reset');
        setStaticHoldStartTime(null);
        setStaticPositions([]);
      }
    }
  }, [template?.right_fingers, staticHoldStartTime, staticRequiredDuration]);
  
  // Evaluate gesture - USE REFS WITH PROTECTION
  const evaluateGesture = useCallback(() => {
    // Prevent double evaluation with timestamp cooldown
    const now = Date.now();
    if (now - lastEvalTimeRef.current < 1000) {
      console.log('⚠️ Evaluation cooldown active, skipping...');
      return;
    }
    
    lastEvalTimeRef.current = now;
    console.log('🔍 Starting evaluation...');
    
    const currentSequence = gestureSequenceRef.current;
    console.log('🔍 Evaluating gesture with REF, sequence length:', currentSequence.length);
    
    if (currentSequence.length === 0) {
      setStatusMessage('⚠️ No gesture data recorded');
      setPracticeState("IDLE");
      practiceStateRef.current = "IDLE";
      return;
    }
    
    if (!template) {
      setStatusMessage('❌ No template found');
      setPracticeState("IDLE");
      practiceStateRef.current = "IDLE";
      return;
    }
    
    setStatusMessage('🔍 Evaluating...');
    
    // Calculate average RIGHT HAND finger states ONLY (left hand ignored completely)
    const avgFingers = [0, 0, 0, 0, 0];
    for (const frame of currentSequence) {
      // frame.fingers contains ONLY right hand data - left hand never recorded
      for (let i = 0; i < 5; i++) {
        avgFingers[i] += frame.fingers[i];
      }
    }
    for (let i = 0; i < 5; i++) {
      avgFingers[i] = Math.round(avgFingers[i] / currentSequence.length);
    }
    
    console.log('📊 RIGHT HAND EVALUATION ONLY:', {
      sequenceLength: currentSequence.length,
      rightHandAvgFingers: avgFingers,
      expectedRightFingers: template.right_fingers,
      isStatic: template.is_static,
      note: 'Left hand completely ignored in evaluation'
    });
    
    // Check finger match
    const fingerMatch = template.right_fingers.every((expected, i) => expected === avgFingers[i]);
    if (!fingerMatch) {
      setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      setStatusMessage(`❌ Wrong fingers: got [${avgFingers.join(',')}], expected [${template.right_fingers.join(',')}]`);
      setTimeout(() => {
        setPracticeState("IDLE");
        practiceStateRef.current = "IDLE";
      }, 2000);
      return;
    }
    
    // Check if static gesture - USE SEQUENCE-BASED EVALUATION
    if (template.is_static) {
      console.log('🔵 Evaluating static gesture using sequence data:', {
        sequenceLength: currentSequence.length,
        expectedFingers: template.right_fingers,
        requiredDuration: staticRequiredDuration
      });
      
      // Check if we have enough frames for static gesture (at least 0.5s of recording)
      const minFrames = 15; // ~0.5s at 30fps
      if (currentSequence.length < minFrames) {
        console.log(`🔵 ❌ Not enough frames: ${currentSequence.length} < ${minFrames}`);
        setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
        setStatusMessage(`❌ Hold gesture longer (need ~0.5s minimum)`);
        setTimeout(() => {
          setPracticeState("IDLE");
          practiceStateRef.current = "IDLE";
        }, 2000);
        return;
      }
      
      // Check if majority of frames have correct fingers
      let matchingFrames = 0;
      for (const frame of currentSequence) {
        const frameMatch = frame.fingers.every((f, i) => f === template.right_fingers[i]);
        if (frameMatch) matchingFrames++;
      }
      
      const matchPercentage = (matchingFrames / currentSequence.length) * 100;
      console.log(`🔵 Frame analysis: ${matchingFrames}/${currentSequence.length} = ${matchPercentage.toFixed(1)}% match`);
      
      if (matchPercentage < 70) { // Need 70% of frames to match
        setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
        setStatusMessage(`❌ Inconsistent fingers: only ${matchPercentage.toFixed(0)}% match (need 70%)`);
        setTimeout(() => {
          setPracticeState("IDLE");
          practiceStateRef.current = "IDLE";
        }, 2000);
        return;
      }
      
      // Check hand movement during static hold
      if (currentSequence.length >= 2) {
        const startWrist = currentSequence[0].wrist;
        let maxMovement = 0;
        
        for (const frame of currentSequence) {
          const dx = frame.wrist.x - startWrist.x;
          const dy = frame.wrist.y - startWrist.y;
          const movement = Math.sqrt(dx * dx + dy * dy);
          maxMovement = Math.max(maxMovement, movement);
        }
        
        console.log(`🔵 Movement check: max = ${(maxMovement * 100).toFixed(1)}cm`);
        
        if (maxMovement > 0.05) { // 5cm threshold
          setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
          setStatusMessage(`❌ Too much movement: ${(maxMovement * 100).toFixed(1)}cm (max 5cm)`);
          setTimeout(() => {
            setPracticeState("IDLE");
            practiceStateRef.current = "IDLE";
          }, 2000);
          return;
        }
      }
      
      // Success!
      const durationMs = currentSequence.length * (1000/30); // Estimate duration
      setAttemptStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      setStatusMessage(`✅ Perfect static ${gestureName}! ${matchPercentage.toFixed(0)}% accuracy, ${(durationMs/1000).toFixed(1)}s hold`);
      toast.success(`✅ Perfect ${gestureName}!`);
    } else {
      // Motion gesture using currentSequence
      if (currentSequence.length < 3) {
        setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
        setStatusMessage('❌ Too few motion frames');
        setTimeout(() => {
          setPracticeState("IDLE");
          practiceStateRef.current = "IDLE";
        }, 2000);
        return;
      }
      
      const startWrist = currentSequence[0].wrist;
      const endWrist = currentSequence[currentSequence.length - 1].wrist;
      const deltaX = endWrist.x - startWrist.x;
      const deltaY = endWrist.y - startWrist.y;
      const deltaMag = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (deltaMag < 0.03) {
        setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
        setStatusMessage('❌ Not enough motion detected');
        setTimeout(() => setPracticeState("IDLE"), 2000);
        return;
      }
      
      // Check main direction (horizontal vs vertical)
      const expectedMainX = template.main_axis_x;
      const actualMainX = Math.abs(deltaX) >= Math.abs(deltaY) ? 1 : 0;
      
      console.log('🎯 Direction analysis:', {
        deltaX: deltaX.toFixed(3),
        deltaY: deltaY.toFixed(3),
        deltaMag: deltaMag.toFixed(3),
        expectedMainX,
        actualMainX,
        expectedDeltaX: template.delta_x,
        expectedDeltaY: template.delta_y
      });
      
      if (expectedMainX !== actualMainX) {
        const expectedDir = expectedMainX ? 'horizontal' : 'vertical';
        const actualDir = actualMainX ? 'horizontal' : 'vertical';
        setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
        setStatusMessage(`❌ Wrong main direction: moved ${actualDir}, expected ${expectedDir}`);
        setTimeout(() => {
          setPracticeState("IDLE");
          practiceStateRef.current = "IDLE";
        }, 2000);
        return;
      }
      
      // Check SPECIFIC direction within main axis (like Python script)
      if (expectedMainX === 1) {
        // Horizontal motion - check left/right with camera mirror
        const expectedRight = template.delta_x > 0;
        const actualRight = deltaX < 0; // Camera mirror: negative deltaX = move right
        
        if (expectedRight !== actualRight) {
          const expectedDirStr = expectedRight ? 'right' : 'left';
          const actualDirStr = actualRight ? 'right' : 'left';
          setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
          setStatusMessage(`❌ Wrong horizontal direction: moved ${actualDirStr}, expected ${expectedDirStr}`);
          setTimeout(() => {
            setPracticeState("IDLE");
            practiceStateRef.current = "IDLE";
          }, 2000);
          return;
        }
      } else {
        // Vertical motion - check up/down
        const expectedDown = template.delta_y > 0;
        const actualDown = deltaY > 0;
        
        if (expectedDown !== actualDown) {
          const expectedDirStr = expectedDown ? 'down' : 'up';
          const actualDirStr = actualDown ? 'down' : 'up';
          setAttemptStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
          setStatusMessage(`❌ Wrong vertical direction: moved ${actualDirStr}, expected ${expectedDirStr}`);
          setTimeout(() => {
            setPracticeState("IDLE");
            practiceStateRef.current = "IDLE";
          }, 2000);
          return;
        }
      }
      
      // All checks passed!
      setAttemptStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      setStatusMessage(`✅ Perfect ${gestureName}! Direction: ${deltaMag.toFixed(3)} movement`);
      toast.success(`✅ Perfect ${gestureName}!`);
    }
    
    setTimeout(() => {
      setPracticeState("IDLE");
      practiceStateRef.current = "IDLE";
      setStatusMessage(`🎯 Practice ${gestureName} - Close left fist to start`);
    }, 3000);
  }, [gestureSequence, template, gestureName, staticHoldStartTime, staticRequiredDuration]);
  
  // MediaPipe results handler
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas?.getContext('2d');
    if (!canvas || !canvasCtx) {
      console.log('❌ Canvas not available');
      return;
    }
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandedness) {
      let leftHand = null, rightHand = null;
      
      for (let index = 0; index < results.multiHandLandmarks.length; index++) {
        const classification = results.multiHandedness[index];
        const landmarks = results.multiHandLandmarks[index];
        
        console.log(`Hand ${index}: Label="${classification.label}", Score=${classification.score}`);
        
        // MediaPipe Web camera mirrored - SWAP labels
        if (classification.label === 'Left') {
          rightHand = landmarks;  // MediaPipe "Left" = User's right hand
          console.log('� Right hand detected (MediaPipe labeled as Left)');
        } else if (classification.label === 'Right') {
          leftHand = landmarks;   // MediaPipe "Right" = User's left hand  
          console.log('� Left hand detected (MediaPipe labeled as Right)');
        }
        
        // Draw landmarks with different colors (swap for mirror effect)
        const isUserLeftHand = classification.label === 'Right'; // MediaPipe "Right" = User's left
        drawLandmarks(canvasCtx, landmarks, isUserLeftHand ? '#00FF00' : '#FF0000');
      }
      
      processGestures(leftHand, rightHand);
    }
    
    canvasCtx.restore();
  }, []);
  
  // Draw landmarks
  const drawLandmarks = useCallback((ctx, landmarks, color = '#FF0000') => {
    ctx.fillStyle = color;
    for (const landmark of landmarks) {
      const x = landmark.x * canvasRef.current.width;
      const y = landmark.y * canvasRef.current.height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, []);
  
  // Main gesture processing - SIMPLIFIED
  const processGestures = useCallback((leftHand, rightHand) => {
    let info = '🖐️ ';
    
    // Debug hand presence
    console.log('🖐️ processGestures called - Left:', !!leftHand, 'Right:', !!rightHand);
    
    if (!leftHand || !rightHand) {
      setCurrentHandInfo(`❌ Missing hands - Left: ${!!leftHand}, Right: ${!!rightHand}`);
      return;
    }
    
    const leftFingers = getFingerStates(leftHand, true);
    const rightFingers = getFingerStates(rightHand, false);
    
    // LEFT FIST = chỉ check 4 ngón sau (bỏ qua ngón cái)
    const currentLeftFist = leftFingers.slice(1).every(f => f === 0); // [1,2,3,4] = index,middle,ring,pinky
    
    info += `Left[${leftFingers.join(',')}] Right[${rightFingers.join(',')}] `;
    
    // Use refs for current values
    const currentPracticeState = practiceStateRef.current;
    const currentPrevFist = prevLeftFistRef.current;
    
    console.log('🎯 GESTURE STATE (REF-BASED):', {
      stateProp: practiceState,
      stateRef: currentPracticeState,
      leftFist: currentLeftFist, 
      prevFistProp: prevLeftFist,
      prevFistRef: currentPrevFist,
      leftFingers,
      rightFingers
    });
    
    // Simple state logging với 4-finger fist logic
    if (currentLeftFist !== currentPrevFist) {
      console.log(`🖐️ Left fist state changed: ${currentLeftFist ? 'CLOSED' : 'OPEN'} (4-finger check: [${leftFingers.slice(1).join(',')}] all zero)`);
    }
    
    // REF-BASED STATE MANAGEMENT - LEFT HAND TRIGGERS ONLY
    if (template) {
      // Start recording when fist detected
      if (currentLeftFist && !currentPrevFist && currentPracticeState === "IDLE") {
        console.log('🚀 REF-BASED: STARTING RECORDING');
        practiceStateRef.current = "RECORDING";
        setPracticeState("RECORDING");
        setGestureSequence([]);
        gestureSequenceRef.current = [];
        setStaticHoldStartTime(null);
        setStaticPositions([]);
        
        if (template.is_static) {
          setStatusMessage(`🔵 Static ${gestureName} - Hold correct position`);
        } else {
          setStatusMessage(`🔴 Recording ${gestureName} - Make gesture now`);
        }
        info += '🚀 RECORDING! ';
      }
      
      // Stop recording when fist released 
      if (!currentLeftFist && currentPrevFist && currentPracticeState === "RECORDING") {
        console.log('✋ REF-BASED: STOPPING RECORDING');
        practiceStateRef.current = "EVALUATING";
        setPracticeState("EVALUATING");
        setTimeout(() => evaluateGesture(), 100);
        info += '🔍 EVALUATING! ';
      }
      
      // Record RIGHT HAND gesture data ONLY
      if (currentPracticeState === "RECORDING") {
        const wrist = rightHand[0];
        
        // ONLY RIGHT HAND DATA - no left hand influence
        const frameData = {
          fingers: rightFingers,           // ONLY right hand fingers
          wrist: { x: wrist.x, y: wrist.y }, // ONLY right hand wrist
          timestamp: Date.now()
        };
        
        const newSequence = [...gestureSequenceRef.current, frameData];
        setGestureSequence(newSequence);
        gestureSequenceRef.current = newSequence;
        
        if (template.is_static) {
          console.log(`🔵 CALLING handleStaticGesture - rightFingers: [${rightFingers.join(',')}]`);
          handleStaticGesture(rightFingers, wrist, Date.now());
          info += ` 🔵 STATIC:${getStaticProgress()}`;
        } else {
          info += ` 🔴 FRAMES:${newSequence.length}`;
        }
      }
      
      if (currentLeftFist) info += '👊 FIST! ';
      info += ` | State: ${currentPracticeState}`;
    }
    
    // Update both state and ref
    setPrevLeftFist(currentLeftFist);
    prevLeftFistRef.current = currentLeftFist;
    setCurrentHandInfo(info);
  }, [practiceState, prevLeftFist, template, gestureName, getFingerStates, handleStaticGesture, getStaticProgress, gestureSequence.length, evaluateGesture]);
  
  // Initialize MediaPipe with better cleanup
  useEffect(() => {
    let mounted = true;
    let hands = null;
    let camera = null;
    
    const initializeMediaPipe = async () => {
      try {
        if (!mounted || initializingRef.current) return;
        
        initializingRef.current = true;
        console.log('🚀 Initializing MediaPipe...');
        
        // Cleanup any existing instances
        if (handsRef.current) {
          handsRef.current.close?.();
          handsRef.current = null;
        }
        
        if (cameraRef.current) {
          cameraRef.current.stop();
          cameraRef.current = null;
        }
        
        hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.3,
          minTrackingConfidence: 0.3
        });
        
        hands.onResults(onResults);
        handsRef.current = hands;
        
        if (!mounted) return;
        
        console.log('📹 Starting camera...');
        
        if (videoRef.current) {
          camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current && videoRef.current && mounted) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          
          cameraRef.current = camera;
          
          camera.h.onloadedmetadata = () => {
            if (mounted) console.log('✅ Camera loaded successfully');
          };
          
          await camera.start();
          if (mounted) console.log('✅ Camera started successfully');
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ Error initializing MediaPipe:', error);
          toast.error('Failed to initialize camera');
        }
      } finally {
        initializingRef.current = false;
      }
    };
    
    // Add delay to ensure DOM is ready
    const timer = setTimeout(initializeMediaPipe, 100);
    
    return () => {
      mounted = false;
      initializingRef.current = false;
      clearTimeout(timer);
      
      console.log('🛑 Cleaning up MediaPipe...');
      
      if (camera) {
        camera.stop();
      }
      
      if (hands) {
        hands.close?.();
      }
      
      // Clear refs
      handsRef.current = null;
      cameraRef.current = null;
    };
  }, [onResults]);
  
  // Sync refs with state
  useEffect(() => {
    practiceStateRef.current = practiceState;
    console.log('🔄 State synced:', practiceState);
  }, [practiceState]);
  
  useEffect(() => {
    prevLeftFistRef.current = prevLeftFist;
  }, [prevLeftFist]);
  
  useEffect(() => {
    gestureSequenceRef.current = gestureSequence;
  }, [gestureSequence]);
  
  // Note: Removed auto-complete timer to prevent double evaluation
  // Static gestures only evaluate when user releases left fist
  
  // Set initial status message
  useEffect(() => {
    if (template) {
      setStatusMessage(`🎯 Practice ${gestureName} - Close left fist to start`);
    }
  }, [gestureName, template]);
  
  const resetStats = () => {
    setAttemptStats({ correct: 0, wrong: 0 });
    toast.info('Statistics reset');
  };
  
  if (!template) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Gesture Not Found</h2>
          <p>The gesture "{gestureName}" is not available in the template library.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">ML Gesture Practice: {gestureName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Template Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Gesture Description:</h3>
            <p className="text-blue-700">{template.description}</p>
            <div className="mt-2 text-sm text-blue-600">
              <span className="font-medium">Type:</span> {template.is_static ? 'Static (Hold)' : 'Motion (Move)'}
              <span className="ml-4 font-medium">Right hand fingers:</span> [{template.right_fingers.join(', ')}]
            </div>
          </div>
          
          {/* Gesture Recognition Camera */}
          <div className="mb-4">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full max-w-2xl mx-auto rounded-lg border"
              style={{ transform: 'scaleX(-1)' }}
            />
            <video
              ref={videoRef}
              className="hidden"
              autoPlay
              playsInline
              muted
            />
          </div>
          
          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Status</div>
              <div className={`text-lg font-bold ${
                practiceState === 'RECORDING' ? 'text-red-600' :
                practiceState === 'EVALUATING' ? 'text-yellow-600' :
                'text-gray-600'
              }`}>
                {statusMessage || `🎯 Practice ${gestureName} - Close left fist to start`}
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Hand Detection</div>
              <div className="text-sm font-mono text-gray-800">
                {currentHandInfo || '❌ No hands detected'}
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{attemptStats.correct}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{attemptStats.wrong}</div>
                <div className="text-sm text-gray-600">Wrong</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {attemptStats.correct + attemptStats.wrong > 0 ? 
                    Math.round((attemptStats.correct / (attemptStats.correct + attemptStats.wrong)) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
            </div>
            
            <button
              onClick={resetStats}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Reset Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GesturePracticeMLFixed;