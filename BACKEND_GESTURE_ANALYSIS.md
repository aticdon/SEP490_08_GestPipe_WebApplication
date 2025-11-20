# Phân Tích Tổng Thể Backend - Tính Năng Gesture

## 📋 Nội Dung
1. [Cấu Trúc Tổng Quan](#cấu-trúc-tổng-quan)
2. [Các Tính Năng Chính](#các-tính-năng-chính)
3. [Luồng Code Chi Tiết](#luồng-code-chi-tiết)
4. [Các Model Dữ Liệu](#các-model-dữ-liệu)
5. [Flow Diagram](#flow-diagram)

---

## 🏗 Cấu Trúc Tổng Quan

### Điểm Vào Chính
**File**: `backend/server.js`

```
server.js (Express app initialization)
  ↓
Routes (src/routes/)
  ↓
Controllers (src/controllers/)
  ↓
Models (src/models/)
  ↓
MongoDB Database
```

### Routes Gesture
```
/api/gestures/          - gestureRoutes.js    (Quản lý mẫu gesture)
/api/practice/          - practiceRoutes.js   (Phiên luyện tập)
/api/admin-custom-gestures/ - adminCustomGestureRoutes.js (Custom gesture)
```

---

## 🎯 Các Tính Năng Chính

### 1️⃣ **Gesture Management (Quản lý Gesture)**
**Routes**: `/api/gestures`
**Controller**: `gestureController.js`

#### Endpoints:
- `GET /` - Lấy danh sách gesture samples (có phân trang)
- `GET /labels` - Lấy danh sách pose labels
- `GET /stats` - Thống kê gesture (samples count, type breakdown, motion center)
- `POST /customize` - Customize gesture

**Đặc điểm quan trọng**:
- Hỗ trợ filter theo `pose_label` và `gesture_type` (static/dynamic)
- Pagination với page, limit (max 200)
- Aggregate statistics từ database

---

### 2️⃣ **Gesture Training (Huấn luyện Model)**
**Routes**: `/api/gestures/training`
**Controller**: `gestureTrainingController.js`

#### Endpoints:
- `POST /training` - Bắt đầu huấn luyện (chỉ superadmin)
- `GET /training` - Liệt kê các lần huấn luyện
- `GET /training/:id` - Chi tiết lần huấn luyện
- `GET /model-status` - Kiểm tra trạng thái model
- `DELETE /training/:id` - Hủy huấn luyện

**Quá trình huấn luyện**:
```
startTraining()
  ↓
1. Export dữ liệu từ GestureSample collection → CSV file
2. Gọi Python script: train_motion_svm_all_models.py
3. Monitor process (stdout/stderr)
4. Tạo GestureTrainingRun record trong DB
5. Parse kết quả từ training_results/
6. Lưu model artifacts (motion_svm_model.pkl, motion_scaler.pkl, etc.)
```

**Model Artifacts**:
- `motion_svm_model.pkl` - SVM model chính
- `motion_scaler.pkl` - Scaler cho feature normalization
- `static_dynamic_classifier.pkl` - Classifier phân biệt static/dynamic
- `optimal_hyperparameters_per_pose.csv` - Hyperparameters tối ưu

---

### 3️⃣ **Gesture Inference (Dự Đoán)**
**Routes**: `/api/gestures`
**Controller**: `gestureInferenceController.js`

#### Endpoints:
- `GET /model-info` - Lấy thông tin model
- `GET /model-test` - Test model (kiểm tra model có sẵn)

**Chức năng**:
- Kiểm tra sự tồn tại của các model files
- Lấy metadata: size, last modified time
- Validate model ready-to-use

---

### 4️⃣ **Gesture Practice (Luyện Tập)**
**Routes**: `/api/practice` hoặc `/api/gestures/practice`
**Controller**: `gesturePracticeController.js`

#### Endpoints:
- `POST /practice/start` - Bắt đầu phiên luyện tập
- `POST /practice/stop` - Kết thúc phiên luyện tập
- `GET /practice/status` - Lấy trạng thái
- `GET /practice/logs` - Lấy logs phiên

**Quá trình luyện tập**:
```
startPracticeSession()
  ↓
1. Check nếu có session đang chạy
2. Gọi Python script: practice_session.py
   - --camera-index: index camera
   - --gesture: gesture ID muốn luyện
3. Spawn child process
4. Capture stdout/stderr → sessionLogs array
5. Trả về session metadata
```

---

### 5️⃣ **Admin Gesture Request (Request Customize Gesture)**
**Routes**: `/api/gestures` (mix các endpoints)
**Controller**: `adminGestureRequestController.js`

#### Endpoints:
- `GET /admin-gesture-requests` - Lấy requests của admin hiện tại
- `GET /admin-gesture-status` - Lấy status của gestures
- `POST /admin-gesture-request` - Tạo/update request
- `POST /admin-gesture-submit` - Submit để approve
- `POST /admin-gesture-approve` - Approve (chỉ superadmin)
- `POST /admin-gesture-reject` - Reject (chỉ superadmin)
- `DELETE /admin-gesture-delete` - Xóa custom gestures

**Trạng thái Gesture**:
- `ready` - Gesture mặc định, sẵn sàng sử dụng
- `customed` - Đang customize, không thể thay đổi
- `blocked` - Chờ approval từ superadmin

**Flow Customize**:
```
Admin start customize
  ↓
createOrUpdateRequest() → Set status = 'customed'
  ↓
Upload data, configure gesture
  ↓
submitForApproval() → Set status = 'blocked'
  ↓
Superadmin review
  ↓
approveRequests() or rejectRequests()
  ↓
Nếu approve → status = 'ready'
Nếu reject → status = 'ready' + lưu reject reason
```

---

### 6️⃣ **Custom Gesture Upload**
**Routes**: `/api/gestures/customize`
**Controller**: `customGestureUploadController.js`, `customGestureRequestController.js`

#### Endpoints:
- `POST /customize/check-conflict` - Kiểm tra xung đột gesture
- `POST /customize/upload` - Upload custom gesture
- `POST /customize/request` - Submit request customize
- `GET /customize/requests` - Liệt kê requests (chỉ superadmin)
- `POST /customize/requests/:id/approve` - Approve (chỉ superadmin)
- `POST /customize/requests/:id/reject` - Reject (chỉ superadmin)

---

## 📊 Luồng Code Chi Tiết

### **Luồng 1: Xem Gesture Samples**

**User Flow**:
```
Frontend: GET /api/gestures?page=1&limit=25&poseLabel=next_slide
  ↓
Backend: authMiddleware.protect
  ↓
Backend: authMiddleware.authorize('admin', 'superadmin')
  ↓
gestureController.listSamples()
  ↓
GestureSample.find()
  .filter by poseLabel and gestureType
  .skip, limit, sort
  ↓
Trả về data + pagination info
```

**File**:
1. `src/routes/gestureRoutes.js` - Route definition
2. `src/controllers/gestureController.js` - Logic lấy data
3. `src/models/GestureSample.js` - Schema dữ liệu
4. `src/middlewares/authMiddleware.js` - Auth/Authorization

---

### **Luồng 2: Huấn Luyện Model (Training)**

**User Flow**:
```
Frontend: POST /api/gestures/training
  ↓
Backend: Verify superadmin role
  ↓
gestureTrainingController.startTraining()
  ↓
1. Check existing training
2. Create GestureTrainingRun record (status: 'running')
  ↓
3. Query GestureSample collection
  ↓
4. exportGesturesToCsv() - Export to training_dataset.csv
   - Location: PIPELINE_ROOT/training_dataset.csv
  ↓
5. spawn(PYTHON_BIN, [train_motion_svm_all_models.py])
   - PIPELINE_ROOT = ../hybrid_realtime_pipeline/
   - Script location: PIPELINE_ROOT/train_motion_svm_all_models.py
  ↓
6. Capture output:
   - child.stdout → push to GestureTrainingRun.log
   - child.stderr → push to GestureTrainingRun.log
  ↓
7. Wait for process exit
  ↓
8. parseTrainingSummary()
   - Read: PIPELINE_ROOT/training_results/optimal_hyperparameters_per_pose.csv
   - Parse summary statistics
  ↓
9. Update GestureTrainingRun
   - status: 'completed'
   - finishedAt, exitCode
   - summary: { averageCvF1, averageTestF1, bestHyperparams[] }
   - artifactPaths: { model, scaler, staticDynamicClassifier, summaryCsv }
  ↓
10. Return training result
```

**Files**:
1. `src/routes/gestureRoutes.js` - Route: POST /training
2. `src/controllers/gestureTrainingController.js` - Main logic
3. `src/models/GestureTrainingRun.js` - Store training metadata
4. `src/utils/exportGesturesToCsv.js` - Export gestures to CSV
5. `src/utils/parseTrainingSummary.js` - Parse training results
6. Python script: `hybrid_realtime_pipeline/train_motion_svm_all_models.py`

**Database Collections Used**:
- `GestureSample` - Read gesture data
- `GestureTrainingRun` - Write training metadata

---

### **Luồng 3: Kiểm Tra Model Status**

**User Flow**:
```
Frontend: GET /api/gestures/model-status
  ↓
Backend: authMiddleware.protect
  ↓
gestureTrainingController.getModelStatus()
  ↓
checkExistingModels()
  ↓
1. Check file existence:
   - MODELS_DIR/motion_svm_model.pkl
   - MODELS_DIR/motion_scaler.pkl
   - MODELS_DIR/static_dynamic_classifier.pkl
  ↓
2. If files exist:
   - fs.stat() để lấy size, mtime
  ↓
3. GestureSample.countDocuments() - Get dataset size
  ↓
4. Return:
   {
     hasPreTrainedModel: boolean,
     modelInfo: { exists, lastModified, size, files{} },
     datasetSize: number,
     recommendation: string
   }
```

---

### **Luồng 4: Luyện Tập (Practice Session)**

**User Flow**:
```
Frontend: POST /api/practice/start
Body: { gesture: 'next_slide', cameraIndex: 0 }
  ↓
Backend: authMiddleware.protect
  ↓
gesturePracticeController.startPracticeSession()
  ↓
1. Check nếu activeSession đã tồn tại
   - Nếu có → return 409 Conflict
  ↓
2. Prepare environment variables:
   PYTHONIOENCODING: 'utf-8'
   PRACTICE_GESTURE: 'next_slide'
  ↓
3. spawn(PYTHON_BIN, ['practice_session.py', '--gesture', 'next_slide', '--camera-index', '0'])
   - Working directory: PIPELINE_ROOT
  ↓
4. Setup event handlers:
   - stdout → push to sessionLogs array
   - stderr → push to sessionLogs array
   - error → set activeSession = null
   - close → set activeSession = null
  ↓
5. Store activeSession state:
   {
     process: child,
     gesture: 'next_slide',
     cameraIndex: 0,
     startTime: Date,
     logs: []
   }
  ↓
6. Return success response with session metadata
  ↓
---
  ↓
Frontend: GET /api/practice/status/:gestureId
  ↓
gesturePracticeController.getSessionStatus()
  ↓
Return current sessionLogs (up to 100 entries)
  ↓
---
  ↓
Frontend: POST /api/practice/stop
  ↓
gesturePracticeController.stopPracticeSession()
  ↓
1. Kill child process
2. Clear activeSession
3. Return success response
```

**Key Files**:
1. `src/routes/gestureRoutes.js` - Routes
2. `src/controllers/gesturePracticeController.js` - Main logic
3. `src/services/practicePythonService.js` - Python service wrapper
4. Python script: `hybrid_realtime_pipeline/practice_session.py`

---

### **Luồng 5: Request Customize Gesture (Admin)**

**User Flow**:

#### Step 1: Kiểm tra trạng thái gesture hiện tại
```
Frontend: GET /api/gestures/admin-gesture-status
  ↓
adminGestureRequestController.getGestureStatuses()
  ↓
1. Get adminId from JWT token
2. AdminGestureRequest.findOne({ adminId })
   - If not exists → AdminGestureRequest.createForAdmin()
     - Create với 10 default gestures (next_slide, previous_slide, home, ...)
     - Tất cả status = 'ready'
  ↓
3. Check for blocked/customed gestures
4. Return:
   {
     requests: [ { gestureId, gestureName, status } ],
     hasBlockedGestures: boolean,
     hasCustomedGestures: boolean,
     canCustom: boolean (true nếu không có blocked)
   }
```

#### Step 2: Bắt đầu customize
```
Frontend: POST /api/gestures/admin-gesture-request
Body: { gestureId: 'next_slide', gestureName: 'Next Slide' }
  ↓
adminGestureRequestController.createOrUpdateRequest()
  ↓
1. Get adminId từ JWT
2. Find AdminGestureRequest
3. Check nếu gesture đang 'customed' or 'blocked'
   - Nếu yes → return 409 (Conflict)
  ↓
4. Update gesture status = 'customed'
5. Save AdminGestureRequest
6. Return updated request
```

#### Step 3: Submit để approve
```
Frontend: POST /api/gestures/admin-gesture-submit
Body: { gestureIds: ['next_slide', 'previous_slide'] }
  ↓
adminGestureRequestController.submitForApproval()
  ↓
1. Get adminId từ JWT
2. Find AdminGestureRequest
3. For each gestureId:
   - Check if status = 'customed'
   - Update status = 'blocked' (waiting for approval)
  ↓
4. Save changes
5. Return updated request
```

#### Step 4: Superadmin approve
```
Frontend: POST /api/gestures/admin-gesture-approve
Body: { adminId, gestureIds: ['next_slide'] }
  ↓
adminGestureRequestController.approveRequests()
  ↓
1. Verify superadmin role
2. Find AdminGestureRequest by adminId
3. For each gestureId:
   - Update status = 'ready'
   - Set approvedAt = Date.now()
  ↓
4. Save changes
5. Send notification email (nếu có)
6. Return updated request
```

#### Step 5: Superadmin reject
```
Frontend: POST /api/gestures/admin-gesture-reject
Body: { adminId, gestureIds: ['next_slide'], reason: 'Invalid data' }
  ↓
adminGestureRequestController.rejectRequests()
  ↓
1. Verify superadmin role
2. Find AdminGestureRequest by adminId
3. For each gestureId:
   - Update status = 'ready'
   - Store reject reason
  ↓
4. Save changes
5. Send rejection email (nếu có)
6. Return updated request
```

**Files**:
1. `src/routes/gestureRoutes.js` - Routes
2. `src/controllers/adminGestureRequestController.js` - Main logic
3. `src/models/AdminGestureRequest.js` - Schema, static method createForAdmin()
4. `src/models/Admin.js` - Admin data

**Database Collections**:
- `AdminGestureRequest` - Store gesture requests
- `Admin` - Reference admin data

---

## 📦 Các Model Dữ Liệu

### 1. **GestureSample**
```javascript
{
  instance_id: Number,           // Sample ID
  pose_label: String,            // e.g., 'next_slide', 'home'
  gesture_type: String,          // 'static' or 'dynamic'
  
  // Hand finger states (0=closed, 1=extended)
  left_finger_state_0-4: Number,
  right_finger_state_0-4: Number,
  
  // Motion tracking (start, mid, end points)
  motion_x_start, motion_y_start: Number,
  motion_x_mid, motion_y_mid: Number,
  motion_x_end, motion_y_end: Number,
  
  // Motion vectors
  main_axis_x, main_axis_y: Number,
  delta_x, delta_y: Number,
  
  timestamps: { createdAt, updatedAt }
}
```

### 2. **GestureTrainingRun**
```javascript
{
  status: String,                // 'queued', 'running', 'completed', 'failed'
  datasetSize: Number,           // Total samples used
  poseCounts: [{                 // Samples per pose label
    pose_label: String,
    samples: Number
  }],
  gestureTypeBreakdown: {        // Static vs dynamic breakdown
    static: Number,
    dynamic: Number
  },
  
  log: [{                        // Training logs
    at: Date,
    level: String,             // 'info', 'error'
    message: String
  }],
  
  summary: {                     // Final results
    averageCvF1: Number,
    averageTestF1: Number,
    bestHyperparams: [{
      pose_label: String,
      best_kernel: String,
      best_C: Number,
      best_gamma: String,
      test_f1_score: Number
    }]
  },
  
  startedAt: Date,
  finishedAt: Date,
  exitCode: Number,
  
  artifactPaths: {              // Model file locations
    model: String,
    scaler: String,
    staticDynamicClassifier: String,
    summaryCsv: String
  },
  
  timestamps: { createdAt, updatedAt }
}
```

### 3. **AdminGestureRequest**
```javascript
{
  adminId: ObjectId,            // Reference to Admin
  
  gestures: [{                  // Array of gesture statuses
    gestureId: String,
    gestureName: String,
    status: String,             // 'ready', 'customed', 'blocked'
    customedAt: Date,
    blockedAt: Date,
    approvedAt: Date
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **CustomGestureRequest**
```javascript
// Model này lưu chi tiết request customize
{
  adminId: ObjectId,
  gestures: [String],           // Gesture IDs
  status: String,               // 'pending', 'accept', 'reject'
  
  artifactPaths: {
    compactCsv: String,
    balancedCsv: String,
    modelsDir: String,
    rawDataDir: String
  },
  
  rejectReason: String,
  lastRequestId: ObjectId,
  
  timestamps: { createdAt, updatedAt }
}
```

---

## 🔄 Flow Diagram

### Gesture Lifecycle
```
┌─────────────────────────────────────────────────────────────┐
│                   GESTURE MANAGEMENT FLOW                   │
└─────────────────────────────────────────────────────────────┘

1. INITIALIZATION
   └─ GestureSample collection đã được seed với dữ liệu
   └─ AdminGestureRequest được tạo khi admin lần đầu join

2. VIEW GESTURES
   Admin → GET /api/gestures
        → Filter by poseLabel, gestureType
        → Pagination
        → View statistics

3. PRACTICE GESTURES
   Admin → POST /api/practice/start
        → Python process: practice_session.py
        → Real-time webcam inference
        → POST /api/practice/stop

4. CUSTOMIZE GESTURES (chỉ admin)
   Admin → GET /api/gestures/admin-gesture-status
        → Check current status
        ↓
   Admin → POST /api/gestures/admin-gesture-request
        → Create customize request (status: 'customed')
        ↓
   Admin → Upload custom data
        ↓
   Admin → POST /api/gestures/admin-gesture-submit
        → Submit for approval (status: 'blocked')
        ↓
   Superadmin → GET /api/gestures/admin-gesture-requests
             → Review pending requests
             ↓
   Superadmin → POST /api/gestures/admin-gesture-approve
             → Approve customize (status: 'ready')
             OR
   Superadmin → POST /api/gestures/admin-gesture-reject
             → Reject (status: 'ready' + reason)

5. TRAINING MODEL (chỉ superadmin)
   Superadmin → POST /api/gestures/training
              → Export GestureSample → CSV
              → Run Python: train_motion_svm_all_models.py
              → Parse results
              → Save training metadata (GestureTrainingRun)
              → Save model artifacts

6. MODEL INFERENCE
   System → GET /api/gestures/model-info
         → Check model files exist
         → Get model metadata
         → Ready for real-time inference
```

---

## 🔐 Authorization Rules

| Endpoint | Guest | Admin | Superadmin | Notes |
|----------|-------|-------|-----------|-------|
| GET /gestures | ❌ | ✅ | ✅ | View samples |
| GET /stats | ❌ | ✅ | ✅ | Statistics |
| POST /training | ❌ | ❌ | ✅ | Train model |
| POST /practice/start | ❌ | ✅ | ✅ | Practice session |
| POST /admin-gesture-request | ❌ | ✅ | ✅ | Start customize |
| POST /admin-gesture-approve | ❌ | ❌ | ✅ | Approve customize |
| GET /customize/requests | ❌ | ❌ | ✅ | View all requests |

---

## 📁 File Structure Reference

```
backend/
├── server.js                              [ENTRY POINT]
├── src/
│   ├── config/
│   │   ├── db.js                          [MongoDB connection]
│   │   └── smtp.js                        [Email config]
│   │
│   ├── routes/
│   │   ├── gestureRoutes.js               [ALL gesture endpoints]
│   │   ├── practiceRoutes.js              [Practice session routes]
│   │   └── adminCustomGestureRoutes.js    [Admin custom routes]
│   │
│   ├── controllers/
│   │   ├── gestureController.js           [View, list, stats]
│   │   ├── gestureTrainingController.js   [Training logic]
│   │   ├── gestureInferenceController.js  [Model info, test]
│   │   ├── gesturePracticeController.js   [Practice session]
│   │   └── adminGestureRequestController.js [Request customize]
│   │
│   ├── models/
│   │   ├── GestureSample.js               [Training data schema]
│   │   ├── GestureTrainingRun.js          [Training metadata schema]
│   │   ├── AdminGestureRequest.js         [Gesture status per admin]
│   │   └── CustomGestureRequest.js        [Custom request details]
│   │
│   ├── middlewares/
│   │   └── authMiddleware.js              [JWT auth, authorization]
│   │
│   ├── services/
│   │   └── practicePythonService.js       [Python process wrapper]
│   │
│   └── utils/
│       ├── exportGesturesToCsv.js         [CSV export]
│       └── parseTrainingSummary.js        [Parse training results]
│
└── __tests__/                             [Test files]
```

---

## 🚀 Cách Bắt Đầu Phát Triển

### 1. **Nếu bạn muốn hiểu cách xem gesture samples**:
   - Bắt đầu: `src/routes/gestureRoutes.js` → Route: `GET /`
   - Tiếp: `src/controllers/gestureController.js` → Function: `listSamples()`
   - Cuối: `src/models/GestureSample.js` → Schema định nghĩa

### 2. **Nếu bạn muốn hiểu cách huấn luyện model**:
   - Bắt đầu: `src/routes/gestureRoutes.js` → Route: `POST /training`
   - Tiếp: `src/controllers/gestureTrainingController.js` → Function: `startTraining()`
   - Cuối: `hybrid_realtime_pipeline/train_motion_svm_all_models.py` (Python script)

### 3. **Nếu bạn muốn hiểu cách luyện tập gesture**:
   - Bắt đầu: `src/routes/gestureRoutes.js` → Route: `POST /practice/start`
   - Tiếp: `src/controllers/gesturePracticeController.js` → Function: `startPracticeSession()`
   - Cuối: `hybrid_realtime_pipeline/practice_session.py` (Python script)

### 4. **Nếu bạn muốn hiểu request customize gesture**:
   - Bắt đầu: `src/routes/gestureRoutes.js` → Routes: `/admin-gesture-*`
   - Tiếp: `src/controllers/adminGestureRequestController.js`
   - Cuối: `src/models/AdminGestureRequest.js` → Schema và state management

---

## 💾 Database Queries Reference

### Lấy tất cả gesture samples của một gesture type
```javascript
db.gesturesamples.find({ gesture_type: 'static' }).count()
```

### Thống kê samples per gesture
```javascript
db.gesturesamples.aggregate([
  { $group: { _id: '$pose_label', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Lấy admin gesture request status
```javascript
db.admingesterequests.findOne({ adminId: ObjectId('...') })
```

### Lấy training run logs
```javascript
db.gesturetrainingruns.findOne({ _id: ObjectId('...') })
.project({ log: 1, summary: 1 })
```

---

## 🔗 External Dependencies

### Python Side
- `train_motion_svm_all_models.py` - Training script
- `practice_session.py` - Real-time inference
- Output: model files, CSV results, logs

### Node.js Side
- `express` - Web framework
- `mongoose` - MongoDB ORM
- `child_process.spawn` - Execute Python scripts
- `fs/promises` - File system operations

---

Hy vọng tài liệu này giúp bạn hiểu rõ luồng code của tính năng Gesture trong backend! 🎯
