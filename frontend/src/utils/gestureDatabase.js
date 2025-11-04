// Gesture database utility based on your CSV data
export const GESTURE_DATABASE = {
  'rotate_down': {
    id: 1,
    left_finger: [0,0,0,0,0],
    right_finger: [1,1,0,0,0],
    motion_start: [0.624055, 0.451542],
    motion_mid: [0.615109, 0.521483],
    motion_end: [0.605445, 0.623617],
    main_axis: [0,1],
    delta: [-0.002614, 0.185558],
    type: 'dynamic',
    description: '🔄⬇️ Rotate hand downward - thumb and index extended, move down',
    instruction: 'Extend thumb and index finger, then move hand downward'
  },
  'rotate_left': {
    id: 2,
    left_finger: [0,0,0,0,0],
    right_finger: [1,1,0,0,0],
    motion_start: [0.700592, 0.521203],
    motion_mid: [0.609221, 0.515263],
    motion_end: [0.530381, 0.504322],
    main_axis: [1,0],
    delta: [-0.130413, -0.005325],
    type: 'dynamic',
    description: '🔄⬅️ Rotate hand leftward - thumb and index extended, move left',
    instruction: 'Extend thumb and index finger, then move hand to the left'
  },
  'zoom_in': {
    id: 3,
    left_finger: [0,0,0,0,0],
    right_finger: [1,1,1,0,0],
    motion_start: [0.579149, 0.588623],
    motion_mid: [0.594609, 0.479239],
    motion_end: [0.593111, 0.427196],
    main_axis: [0,1],
    delta: [0.0, -0.168766],
    type: 'dynamic',
    description: '🤏 Zoom in - pinch with thumb, index, and middle finger',
    instruction: 'Bring thumb, index, and middle finger together in pinching motion'
  },
  'rotate_right': {
    id: 4,
    left_finger: [0,0,0,0,0],
    right_finger: [1,1,0,0,0],
    motion_start: [0.519356, 0.513941],
    motion_mid: [0.59543, 0.5103],
    motion_end: [0.650029, 0.523184],
    main_axis: [1,0],
    delta: [0.117388, 0.04424],
    type: 'dynamic',
    description: '🔄➡️ Rotate hand rightward - thumb and index extended, move right',
    instruction: 'Extend thumb and index finger, then move hand to the right'
  },
  'zoom_out': {
    id: 5,
    left_finger: [0,0,0,0,0],
    right_finger: [1,1,1,0,0],
    motion_start: [0.586247, 0.461246],
    motion_mid: [0.583464, 0.54286],
    motion_end: [0.574318, 0.653507],
    main_axis: [0,1],
    delta: [-0.062817, 0.191093],
    type: 'dynamic',
    description: '🖐️ Zoom out - spread thumb, index, and middle finger wide',
    instruction: 'Spread thumb, index, and middle finger wide apart'
  },
  'home': {
    id: 6,
    left_finger: [0,0,0,0,0],
    right_finger: [1,0,0,0,0],
    motion_start: [0.589237, 0.487445],
    motion_mid: [0.588898, 0.486901],
    motion_end: [0.588259, 0.487556],
    main_axis: [1,0],
    delta: [-0.002603, 0.002198],
    type: 'static',
    description: '🏠 Home gesture - thumbs up with minimal motion',
    instruction: 'Show thumbs up and hold steady'
  },
  'rotate_up': {
    id: 7,
    left_finger: [0,0,0,0,0],
    right_finger: [1,1,0,0,0],
    motion_start: [0.609287, 0.579126],
    motion_mid: [0.61273, 0.484454],
    motion_end: [0.611311, 0.393994],
    main_axis: [0,1],
    delta: [-0.093339, -0.186964],
    type: 'dynamic',
    description: '🔄⬆️ Rotate hand upward - thumb and index extended, move up',
    instruction: 'Extend thumb and index finger, then move hand upward'
  },
  'previous_slide': {
    id: 9,
    left_finger: [0,0,0,0,0],
    right_finger: [0,1,1,0,0],
    motion_start: [0.673277, 0.505762],
    motion_mid: [0.559976, 0.498925],
    motion_end: [0.499317, 0.508579],
    main_axis: [1,0],
    delta: [-0.15216, -0.016298],
    type: 'dynamic',
    description: '👈 Previous slide - point left with index and middle finger',
    instruction: 'Extend index and middle finger, point and move to the left'
  },
  'next_slide': {
    id: 10,
    left_finger: [0,0,0,0,0],
    right_finger: [0,1,1,0,0],
    motion_start: [0.551511, 0.489961],
    motion_mid: [0.628375, 0.486376],
    motion_end: [0.695994, 0.489401],
    main_axis: [1,0],
    delta: [0.116381, 0.00673],
    type: 'dynamic',
    description: '👉 Next slide - point right with index and middle finger',
    instruction: 'Extend index and middle finger, point and move to the right'
  },
  'end': {
    id: 14,
    left_finger: [0,0,0,0,0],
    right_finger: [0,0,0,0,1],
    motion_start: [0.616981, 0.431811],
    motion_mid: [0.615352, 0.429471],
    motion_end: [0.614736, 0.430074],
    main_axis: [1,0],
    delta: [-0.002566, -0.002014],
    type: 'static',
    description: '✊ End gesture - closed fist with pinky slightly extended',
    instruction: 'Make a fist with only pinky slightly extended and hold steady'
  }
};

// Get all available gesture labels
export const getAvailableGestures = () => {
  return Object.keys(GESTURE_DATABASE);
};

// Get gesture template by name
export const getGestureTemplate = (gestureName) => {
  return GESTURE_DATABASE[gestureName] || null;
};

// Validate if gesture exists in database
export const isValidGesture = (gestureName) => {
  return gestureName in GESTURE_DATABASE;
};

// Get gestures by type
export const getGesturesByType = (type) => {
  return Object.entries(GESTURE_DATABASE)
    .filter(([_, template]) => template.type === type)
    .map(([name, _]) => name);
};

// Calculate gesture similarity score
export const calculateGestureSimilarity = (detectedFingers, expectedFingers) => {
  if (!detectedFingers || !expectedFingers) return 0;
  
  const matches = detectedFingers.reduce((count, finger, index) => {
    return count + (finger === expectedFingers[index] ? 1 : 0);
  }, 0);
  
  return matches / expectedFingers.length;
};

// Calculate motion similarity score
export const calculateMotionSimilarity = (detectedDelta, expectedDelta, threshold = 0.1) => {
  if (!detectedDelta || !expectedDelta) return 0;
  
  const distance = Math.sqrt(
    Math.pow(detectedDelta[0] - expectedDelta[0], 2) + 
    Math.pow(detectedDelta[1] - expectedDelta[1], 2)
  );
  
  return Math.max(0, 1 - (distance / threshold));
};

// Get gesture instruction text
export const getGestureInstruction = (gestureName) => {
  const template = getGestureTemplate(gestureName);
  return template ? template.instruction : 'Practice the gesture as shown';
};

// Export for component usage
export default GESTURE_DATABASE;