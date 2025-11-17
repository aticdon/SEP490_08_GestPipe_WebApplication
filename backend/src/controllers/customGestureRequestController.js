const Admin = require('../models/Admin');
const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');

const AdminCustomGesture = require('../models/AdminCustomGesture');
const CustomGestureRequest = require('../models/CustomGestureRequest');
const AdminGestureRequest = require('../models/AdminGestureRequest');
const AdminGestureSamples = require('../models/AdminGestureSamples');
const { runPythonScript } = require('../utils/pythonRunner');

const PIPELINE_CODE_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'hybrid_realtime_pipeline',
  'code'
);

const buildArtifactPaths = (adminId) => {
  const userDir = path.join(PIPELINE_CODE_DIR, `user_${adminId}`);
  return {
    modelsDir: path.join(userDir, 'models'),
    trainingResultsDir: path.join(userDir, 'training_results'),
    rawDataDir: path.join(userDir, 'raw_data')
  };
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

// Parse gesture_compact file and save to AdminGestureSamples
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

exports.submitCustomizationRequest = async (req, res) => {
  try {
    const { adminId, gestures = [] } = req.body;
    if (!adminId) {
      return res.status(400).json({ message: 'adminId is required.' });
    }

    const userDir = path.join(PIPELINE_CODE_DIR, `user_${adminId}`);
    const masterCsvPath = path.join(userDir, `gesture_data_custom_${adminId}.csv`);

    try {
      await fs.access(masterCsvPath);
    } catch (err) {
      return res.status(400).json({ message: 'No recorded samples were found for this admin.' });
    }

    const gestureList = Array.isArray(gestures) && gestures.length ? gestures : undefined;

    const requestDoc = await CustomGestureRequest.create({
      adminId,
      gestures: gestureList || ['custom_session'],
      status: 'pending',
    });

    await AdminCustomGesture.findOneAndUpdate(
      { adminId },
      {
        status: 'submitted',
        rejectionReason: '',
        lastRequestId: requestDoc._id,
        ...(gestureList ? { gestures: gestureList } : {}),
      },
      { upsert: true }
    );

    // Block all gestures for this admin when submitting request
    await AdminGestureRequest.findOneAndUpdate(
      { adminId },
      {
        $set: {
          'gestures.$[].status': 'blocked',
          'gestures.$[].blockedAt': new Date()
        }
      },
      { upsert: true }
    );

    // Update gesture_request_status to 'disabled' for this admin
    await Admin.findByIdAndUpdate(adminId, { gesture_request_status: 'disabled' });

    return res.status(200).json({
      message: 'Đã gửi yêu cầu tuỳ chỉnh. Vui lòng chờ SuperAdmin duyệt.',
      requestId: requestDoc._id,
      gesture_request_status: 'disabled',
    });
  } catch (error) {
    console.error('[submitCustomizationRequest] Error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.listRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await CustomGestureRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('adminId', 'fullName email role')
      .lean();
    res.json(requests);
  } catch (error) {
    console.error('[listRequests] Error', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAdminStatus = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const entry = await AdminCustomGesture.findOne({ adminId })
      .populate('lastRequestId')
      .lean();
    res.json(entry || null);
  } catch (error) {
    console.error('[getAdminStatus] Error', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  const { id } = req.params;
  const requestDoc = await CustomGestureRequest.findById(id);
  if (!requestDoc) {
    return res.status(404).json({ message: 'Request not found.' });
  }
  if (!['pending', 'failed'].includes(requestDoc.status)) {
    return res.status(400).json({ message: `Cannot approve request in status ${requestDoc.status}` });
  }

  requestDoc.status = 'processing';
  await requestDoc.save();

  try {
    const userFolder = `user_${requestDoc.adminId}`;
    await runPythonScript('prepare_user_data.py', ['--user-id', requestDoc.adminId], PIPELINE_CODE_DIR);

    const artifactPaths = buildArtifactPaths(requestDoc.adminId);

    // Save gesture samples to AdminGestureSamples collection
    await saveGestureSamples(requestDoc.adminId, artifactPaths.modelsDir);

    await CustomGestureRequest.findByIdAndUpdate(id, {
      status: 'approved',
      artifactPaths,
    });

    await AdminCustomGesture.findOneAndUpdate(
      { adminId: requestDoc.adminId },
      {
        status: 'approved',
        artifactPaths,
        rejectionReason: '',
        lastRequestId: requestDoc._id,
      }
    );

    await purgeRawData(requestDoc.adminId);

    // Re-enable gesture_request_status for this admin (they can request again in future)
    await Admin.findByIdAndUpdate(requestDoc.adminId, { gesture_request_status: 'enabled' });

    return res.json({ message: 'Request approved and data prepared.', artifacts: artifactPaths });
  } catch (error) {
    console.error('[approveRequest] Pipeline failed', error);
    await CustomGestureRequest.findByIdAndUpdate(id, {
      status: 'failed',
      rejectionReason: error.message,
    });
    await AdminCustomGesture.findOneAndUpdate(
      { adminId: requestDoc.adminId },
      {
        status: 'failed',
        rejectionReason: error.message,
      }
    );
    return res.status(500).json({
      message: 'Failed to process customization request.',
      error: error.message,
      python_stdout: error.stdout,
      python_stderr: error.stderr,
    });
  }
};

exports.rejectRequest = async (req, res) => {
  const { id } = req.params;
  const { reason = 'Rejected by superadmin' } = req.body;
  const requestDoc = await CustomGestureRequest.findById(id);
  if (!requestDoc) {
    return res.status(404).json({ message: 'Request not found.' });
  }
  if (!['pending', 'failed'].includes(requestDoc.status)) {
    return res.status(400).json({ message: `Cannot reject request in status ${requestDoc.status}` });
  }

  await CustomGestureRequest.findByIdAndUpdate(id, {
    status: 'rejected',
    rejectionReason: reason,
  });
  await AdminCustomGesture.findOneAndUpdate(
    { adminId: requestDoc.adminId },
    {
      status: 'rejected',
      rejectionReason: reason,
      lastRequestId: requestDoc._id,
    }
  );

  // Unblock all gestures for this admin when request is rejected
  await AdminGestureRequest.findOneAndUpdate(
    { adminId: requestDoc.adminId },
    {
      $set: {
        'gestures.$[].status': 'ready'
      },
      $unset: {
        'gestures.$[].blockedAt': 1
      }
    }
  );

  // Re-enable gesture_request_status for this admin
  await Admin.findByIdAndUpdate(requestDoc.adminId, { gesture_request_status: 'enabled' });

  return res.json({ message: 'Request rejected.' });
};

// Get AdminGestureSamples for a specific admin
exports.getAdminGestureSamples = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    const samples = await AdminGestureSamples.find({ adminId: mongoose.Types.ObjectId(adminId) })
      .sort({ pose_label: 1, instance_id: 1 })
      .lean();

    console.log(`[getAdminGestureSamples] Found ${samples.length} samples for admin ${adminId}`);

    res.json({
      success: true,
      data: samples,
      count: samples.length
    });

  } catch (error) {
    console.error('[getAdminGestureSamples] Error', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
