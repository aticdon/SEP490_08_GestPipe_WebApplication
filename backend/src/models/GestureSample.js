const mongoose = require('mongoose');

const gestureSampleSchema = new mongoose.Schema(
  {
    instance_id: { type: Number, index: true },
    pose_label: { type: String, required: true, index: true },
    gesture_type: { type: String, enum: ['static', 'dynamic'], index: true },
    left_finger_state_0: Number,
    left_finger_state_1: Number,
    left_finger_state_2: Number,
    left_finger_state_3: Number,
    left_finger_state_4: Number,
    right_finger_state_0: Number,
    right_finger_state_1: Number,
    right_finger_state_2: Number,
    right_finger_state_3: Number,
    right_finger_state_4: Number,
    motion_x_start: Number,
    motion_y_start: Number,
    motion_x_mid: Number,
    motion_y_mid: Number,
    motion_x_end: Number,
    motion_y_end: Number,
    main_axis_x: Number,
    main_axis_y: Number,
    delta_x: Number,
    delta_y: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('GestureSample', gestureSampleSchema);
