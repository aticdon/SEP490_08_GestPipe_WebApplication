  const mongoose = require('mongoose');

  const VersionSchema = new mongoose.Schema({
    name: { type: String, required: true },             // Tên version: Gestpipe.v1.20
    release_name: { type: String },                     // Có thể giống name hoặc biệt danh riêng
    description: { type: mongoose.Schema.Types.Mixed }, // Dạng JSON, chứa text/features
    release_date: { type: Date, required: false },      // Ngày phát hành
    downloads: { type: Number, default: 0 },            // Số lượng download
    accuracy: { type: Number, default: 0 },             // Độ chính xác (float)
    status: { type: String },                           // Trạng thái version
    
    // Gesture Set fields
    gestureSetId: { type: String },                     // ID của gesture set
    gestureSetName: { type: String },                   // "Bộ cử chỉ chuẩn v1.0"
    gestureSetType: { type: String, enum: ['app', 'gestureset'], default: 'app' }, // Loại version
    driveFolder: { type: String },                      // "/AllDefaultGestures/gesture_set_v1.0/"
    isActiveGestureSet: { type: Boolean, default: false }, // Bộ đang được sử dụng
    gestureCount: { type: Number },                     // Số lượng gesture trong bộ
    
    admin_id: { type: mongoose.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now }
  }, {
    collection: "Version"
  });

  module.exports = mongoose.model("Version", VersionSchema);