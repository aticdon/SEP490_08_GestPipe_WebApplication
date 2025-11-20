const mongoose = require('mongoose');

const adminGestureSampleSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true
    },
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
    modelPath: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'admingesturesamples'
  }
);

// Compound index for efficient queries
adminGestureSampleSchema.index({ adminId: 1, pose_label: 1 });
adminGestureSampleSchema.index({ adminId: 1, gesture_type: 1 });

module.exports = mongoose.model('AdminGestureSamples', adminGestureSampleSchema);