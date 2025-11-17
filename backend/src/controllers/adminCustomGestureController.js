const AdminCustomGesture = require('../models/AdminCustomGesture');
const AdminGestureRequest = require('../models/AdminGestureRequest');
const Admin = require('../models/Admin');

// Submit for approval - tạo record mới hoặc update existing
exports.submitForApproval = async (req, res) => {
  console.log('[submitForApproval] Request received');
  console.log('[submitForApproval] User from middleware:', req.admin);
  console.log('[submitForApproval] Request body:', req.body);

  try {
    const { adminId, gestures } = req.body;
    console.log('[submitForApproval] Extracted data:', { adminId, gestures });

    if (!adminId) {
      console.log('[submitForApproval] Missing adminId');
      return res.status(400).json({ message: 'adminId is required.' });
    }

    if (!Array.isArray(gestures) || gestures.length === 0) {
      console.log('[submitForApproval] Invalid gestures:', gestures);
      return res.status(400).json({ message: 'gestures array is required and cannot be empty.' });
    }

    // Tạo hoặc update record
    const customGesture = await AdminCustomGesture.findOneAndUpdate(
      { adminId },
      {
        gestures,
        status: 'pending',
        rejectReason: '',
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    ).populate('adminId', 'fullName email role');

    // Update gesture_request_status của admin thành 'disabled'
    await Admin.findByIdAndUpdate(adminId, { gesture_request_status: 'disabled' });

    return res.status(200).json({
      message: 'Đã gửi yêu cầu phê duyệt thành công.',
      data: customGesture,
      gesture_request_status: 'disabled',
    });
  } catch (error) {
    console.error('[submitForApproval] Error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all pending requests cho superadmin
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await AdminCustomGesture.find({ status: 'pending' })
      .populate('adminId', 'fullName email role')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[getPendingRequests] Found requests:', requests.length);

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('[getPendingRequests] Error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all requests (tất cả status) cho superadmin
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await AdminCustomGesture.find(filter)
      .populate('adminId', 'fullName email role')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('[getAllRequests] Error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve request
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: 'adminId is required.' });
    }

    const request = await AdminCustomGesture.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve request with status ${request.status}` });
    }

    // Update status to accept
    request.status = 'accept';
    await request.save();

    try {
      // Import required modules
      const path = require('path');
      const fs = require('fs/promises');
      const AdminGestureSamples = require('../models/AdminGestureSamples');
      const { runPythonScript } = require('../utils/pythonRunner');

      // Use PIPELINE_ROOT from env or resolve relative path
      const PIPELINE_ROOT = process.env.PIPELINE_ROOT || path.resolve(__dirname, '../../../..', 'hybrid_realtime_pipeline');
      console.log('[approveRequest] process.env.PIPELINE_ROOT:', process.env.PIPELINE_ROOT);
      console.log('[approveRequest] PIPELINE_ROOT:', PIPELINE_ROOT);
      const PIPELINE_CODE_DIR = path.join(PIPELINE_ROOT, 'code');
      console.log('[approveRequest] PIPELINE_CODE_DIR:', PIPELINE_CODE_DIR);

      const buildArtifactPaths = (adminId) => {
        const userDir = path.join(PIPELINE_CODE_DIR, `user_${adminId}`);
        return {
          modelsDir: path.join(userDir, 'models'),
          trainingResultsDir: path.join(userDir, 'training_results'),
          rawDataDir: path.join(userDir, 'raw_data')
        };
      };

      const saveGestureSamples = async (adminId, modelPath) => {
        try {
          const userDir = path.join(PIPELINE_CODE_DIR, `user_${adminId}`);
          const trainingResultsDir = path.join(userDir, 'training_results');
          const gestureCompactPath = path.join(trainingResultsDir, 'gesture_data_compact.csv');

          console.log(`[saveGestureSamples] Reading gesture_compact from: ${gestureCompactPath}`);

          const fileContent = await fs.readFile(gestureCompactPath, 'utf-8');
          const lines = fileContent.trim().split('\n');

          if (lines.length < 2) {
            throw new Error('Gesture compact file is empty or invalid');
          }

          // Parse header to understand column structure
          const headers = lines[0].split(',');
          const dataLines = lines.slice(1);

          // Delete existing samples for this admin
          await AdminGestureSamples.deleteMany({ adminId });

          const samples = [];

          for (const line of dataLines) {
            const values = line.split(',').map(val => val.trim());

            if (values.length !== headers.length) {
              console.warn(`[saveGestureSamples] Skipping invalid line: ${line}`);
              continue;
            }

            const sample = {
              adminId,
              modelPath
            };

            // Map CSV columns to schema fields
            headers.forEach((header, index) => {
              const value = values[index];
              const numValue = parseFloat(value);

              switch (header) {
                case 'instance_id':
                  sample.instance_id = numValue;
                  break;
                case 'pose_label':
                  sample.pose_label = value;
                  break;
                case 'gesture_type':
                  sample.gesture_type = value;
                  break;
                case 'left_finger_state_0':
                case 'left_finger_state_1':
                case 'left_finger_state_2':
                case 'left_finger_state_3':
                case 'left_finger_state_4':
                case 'right_finger_state_0':
                case 'right_finger_state_1':
                case 'right_finger_state_2':
                case 'right_finger_state_3':
                case 'right_finger_state_4':
                case 'motion_x_start':
                case 'motion_y_start':
                case 'motion_x_mid':
                case 'motion_y_mid':
                case 'motion_x_end':
                case 'motion_y_end':
                case 'main_axis_x':
                case 'main_axis_y':
                case 'delta_x':
                case 'delta_y':
                  sample[header] = isNaN(numValue) ? null : numValue;
                  break;
                default:
                  // Skip unknown columns
                  break;
              }
            });

            samples.push(sample);
          }

          if (samples.length > 0) {
            await AdminGestureSamples.insertMany(samples);
            console.log(`[saveGestureSamples] Saved ${samples.length} gesture samples for admin ${adminId}`);
          } else {
            console.warn(`[saveGestureSamples] No valid samples found in gesture_compact.csv`);
          }

        } catch (error) {
          console.error(`[saveGestureSamples] Error saving gesture samples:`, error);
          throw error;
        }
      };

      const purgeRawData = async (adminId) => {
        const rawDataDir = path.join(PIPELINE_CODE_DIR, `user_${adminId}`, 'raw_data');
        try {
          await fs.rm(rawDataDir, { recursive: true, force: true });
          console.log(`[purgeRawData] Cleaned up raw data directory: ${rawDataDir}`);
        } catch (error) {
          console.warn(`[purgeRawData] Failed to clean up ${rawDataDir}:`, error.message);
        }
      };

      // Run Python pipeline
      const userFolder = `user_${adminId}`;
      await runPythonScript('prepare_user_data.py', ['--user-id', adminId], PIPELINE_CODE_DIR);

      const artifactPaths = buildArtifactPaths(adminId);

      // Save gesture samples to AdminGestureSamples collection
      await saveGestureSamples(adminId, artifactPaths.modelsDir);

      // Update request with success
      request.status = 'accept';
      request.artifactPaths = artifactPaths;
      request.rejectReason = '';
      await request.save();

      // Clean up raw data
      await purgeRawData(adminId);

      return res.json({
        success: true,
        message: 'Request approved and data prepared.',
        data: request,
        artifacts: artifactPaths,
      });
    } catch (pipelineError) {
      console.error('[approveRequest] Pipeline failed', pipelineError);
      
      // Update request with failure
      request.status = 'reject';
      request.rejectReason = pipelineError.message;
      await request.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to process customization request.',
        error: pipelineError.message,
        python_stdout: pipelineError.stdout,
        python_stderr: pipelineError.stderr,
      });
    }
  } catch (error) {
    console.error('[approveRequest] Error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject request
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectReason = 'Rejected by superadmin' } = req.body;

    const request = await AdminCustomGesture.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Cannot reject request with status ${request.status}` });
    }

    // Update status thành 'reject' và lý do
    request.status = 'reject';
    request.rejectReason = rejectReason;
    await request.save();

    return res.json({
      success: true,
      message: 'Request rejected successfully.',
      data: request,
    });
  } catch (error) {
    console.error('[rejectRequest] Error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get status của admin hiện tại
exports.getAdminStatus = async (req, res) => {
  try {
    const adminId = req.admin.id;

    const customGesture = await AdminCustomGesture.findOne({ adminId })
      .populate('adminId', 'fullName email role')
      .lean();

    return res.json({
      success: true,
      data: customGesture,
    });
  } catch (error) {
    console.error('[getAdminStatus] Error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};