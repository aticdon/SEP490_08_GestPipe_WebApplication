const path = require(''path'');
const fs = require(''fs/promises'');

const AdminCustomGesture = require('../models/AdminCustomGesture');
const CustomGestureRequest = require('../models/CustomGestureRequest');
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

const purgeRawData = async (adminId) => {
  const userDir = path.join(PIPELINE_CODE_DIR, `user_${adminId}`);
  const rawDir = path.join(userDir, 'raw_data');
  const masterCsv = path.join(userDir, `gesture_data_custom_${adminId}.csv`);
  await fs.rm(rawDir, { recursive: true, force: true }).catch(() => null);
  await fs.rm(masterCsv, { force: true }).catch(() => null);
  await fs.mkdir(rawDir, { recursive: true }).catch(() => null);
};

const buildArtifactPaths = (adminId) => ({
  compactCsv: path.join(`user_${adminId}`, 'training_results', 'gesture_data_compact.csv'),
  balancedCsv: path.join(`user_${adminId}`, 'gesture_data_1000_balanced.csv'),
  modelsDir: path.join(`user_${adminId}`, 'models'),
});

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

    return res.status(200).json({
      message: 'Submitted for approval. Waiting for superadmin review.',
      requestId: requestDoc._id,
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
    await runPythonScript('prepare_user_data.py', [userFolder], PIPELINE_CODE_DIR);

    const artifactPaths = buildArtifactPaths(requestDoc.adminId);

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

  return res.json({ message: 'Request rejected.' });
};
