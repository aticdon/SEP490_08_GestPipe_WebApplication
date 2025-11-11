const path = require(''path'');
const fs = require(''fs/promises'');

const AdminCustomGesture = require('../models/AdminCustomGesture');

const PIPELINE_CODE_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'hybrid_realtime_pipeline',
  'code'
);

const CSV_COLUMNS = [
  'instance_id',
  'pose_label',
  'left_finger_state_0',
  'left_finger_state_1',
  'left_finger_state_2',
  'left_finger_state_3',
  'left_finger_state_4',
  'right_finger_state_0',
  'right_finger_state_1',
  'right_finger_state_2',
  'right_finger_state_3',
  'right_finger_state_4',
  'motion_x_start',
  'motion_y_start',
  'motion_x_mid',
  'motion_y_mid',
  'motion_x_end',
  'motion_y_end',
  'main_axis_x',
  'main_axis_y',
  'delta_x',
  'delta_y',
];

const sanitizeNumber = (value, defaultValue = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const sanitizeName = (value) => {
  if (!value) return 'unknown';
  return String(value).trim().toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
};

const ensureUserDirs = async (adminId, gestureSlug) => {
  const userDir = path.join(PIPELINE_CODE_DIR, `user_${adminId}`);
  const rawDir = path.join(userDir, 'raw_data');
  const gestureDir = path.join(rawDir, gestureSlug);
  await fs.mkdir(gestureDir, { recursive: true });
  return { userDir, rawDir, gestureDir };
};

const upsertAdminCustomGesture = async (adminId, gestureName) => {
  const update = {
    status: 'draft',
    rejectionReason: '',
    'artifactPaths.rawDataDir': path.join(`user_${adminId}`, 'raw_data'),
  };

  await AdminCustomGesture.findOneAndUpdate(
    { adminId },
    {
      $addToSet: { gestures: gestureName },
      $set: update,
    },
    { upsert: true, new: true }
  );
};

const samplesToCsvRows = (samples, gestureName) => {
  return samples.map((sample, idx) => {
    const poseLabel = sample.pose_label || gestureName;
    const left = sample.left_finger_state || sample.left_fingers || [];
    const right = sample.right_finger_state || sample.right_fingers || [];

    const getFinger = (arr, index) => {
      if (!Array.isArray(arr)) return 0;
      return Number(arr[index]) === 1 ? 1 : 0;
    };

    return [
      sanitizeNumber(sample.instance_id ?? idx + 1, idx + 1),
      poseLabel,
      getFinger(left, 0),
      getFinger(left, 1),
      getFinger(left, 2),
      getFinger(left, 3),
      getFinger(left, 4),
      getFinger(right, 0),
      getFinger(right, 1),
      getFinger(right, 2),
      getFinger(right, 3),
      getFinger(right, 4),
      sanitizeNumber(sample.motion_x_start ?? sample.motion?.start?.x),
      sanitizeNumber(sample.motion_y_start ?? sample.motion?.start?.y),
      sanitizeNumber(sample.motion_x_mid ?? sample.motion?.mid?.x),
      sanitizeNumber(sample.motion_y_mid ?? sample.motion?.mid?.y),
      sanitizeNumber(sample.motion_x_end ?? sample.motion?.end?.x),
      sanitizeNumber(sample.motion_y_end ?? sample.motion?.end?.y),
      sanitizeNumber(sample.main_axis_x ?? sample.motion?.main_axis_x ?? sample.mainAxisX),
      sanitizeNumber(sample.main_axis_y ?? sample.motion?.main_axis_y ?? sample.mainAxisY),
      sanitizeNumber(sample.delta_x ?? sample.motion?.delta_x ?? sample.deltaX),
      sanitizeNumber(sample.delta_y ?? sample.motion?.delta_y ?? sample.deltaY),
    ];
  });
};

const appendToMasterCsv = async (masterPath, rows) => {
  let nextInstanceId = 1;
  let fileExists = false;
  try {
    const existing = await fs.readFile(masterPath, 'utf-8');
    fileExists = true;
    const lines = existing.trim().split(/\r?\n/);
    if (lines.length > 1) {
      const last = lines[lines.length - 1].split(',')[0];
      nextInstanceId = Number(last) + 1;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  const normalizedRows = rows.map((row, idx) => {
    const clone = [...row];
    clone[0] = nextInstanceId + idx;
    return clone;
  });

  if (!fileExists) {
    const header = CSV_COLUMNS.join(',');
    const payload = normalizedRows.map((row) => row.join(',')).join('\n');
    await fs.writeFile(masterPath, `${header}\n${payload}`, { encoding: 'utf-8' });
  } else {
    const payload = normalizedRows.map((row) => row.join(',')).join('\n');
    await fs.writeFile(masterPath, `\n${payload}`, { encoding: 'utf-8', flag: 'a' });
  }
};

exports.uploadCustomGesture = async (req, res) => {
  try {
    const { adminId, gestureName, samples } = req.body;

    if (!adminId || !gestureName) {
      return res.status(400).json({ message: 'adminId và gestureName là b?t bu?c.' });
    }

    if (!Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({ message: 'Thi?u d? li?u samples.' });
    }

    console.log(
      `[uploadCustomGesture] admin=${adminId} gesture=${gestureName} samples=${samples.length}`
    );

    const normalizedGesture = gestureName.trim();
    const gestureSlug = sanitizeName(normalizedGesture);
    const csvRows = samplesToCsvRows(samples, normalizedGesture);
    const { userDir, gestureDir } = await ensureUserDirs(adminId, gestureSlug);

    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rawFilePath = path.join(
      gestureDir,
      `gesture_data_custom_${adminId}_${gestureSlug}_${timestamp}.csv`
    );
    await fs.writeFile(
      rawFilePath,
      [CSV_COLUMNS.join(','), ...csvRows.map((row) => row.join(','))].join('\n'),
      { encoding: 'utf-8' }
    );
    const rawFiles = await fs.readdir(gestureDir);
    console.log(
      `[uploadCustomGesture] Saved raw CSV -> ${rawFilePath}. Total files for ${gestureSlug}: ${rawFiles.length}`
    );

    const masterCsvPath = path.join(userDir, `gesture_data_custom_${adminId}.csv`);
    await appendToMasterCsv(masterCsvPath, csvRows);
    await upsertAdminCustomGesture(adminId, normalizedGesture);

    return res.status(200).json({
      message: 'Raw custom gesture data uploaded successfully (training skipped).',
      rawFile: rawFilePath,
      masterFile: masterCsvPath,
    });
  } catch (error) {
    console.error('[uploadCustomGesture] Error', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
