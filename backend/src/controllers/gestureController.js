const GestureSample = require('../models/GestureSample');
const path = require('path');
const { PythonShell } = require('python-shell');

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

exports.listSamples = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 25), 200);
    const poseLabel = req.query.poseLabel;
    const gestureType = req.query.gestureType;

    const filter = {};
    if (poseLabel) {
      filter.pose_label = poseLabel;
    }
    if (gestureType && ['static', 'dynamic'].includes(gestureType)) {
      filter.gesture_type = gestureType;
    }

    const [items, total] = await Promise.all([
      GestureSample.find(filter)
        .sort({ pose_label: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      GestureSample.countDocuments(filter),
    ]);

    console.log('🔍 Gestures in DB:', total, items.map(i => i.pose_label));
    console.log('🔍 Items returned:', items.length);

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[gestureController.listSamples] Error:', error);
    res.status(500).json({ message: 'Failed to fetch gesture samples' });
  }
};

exports.listLabels = async (_req, res) => {
  try {
    const labels = await GestureSample.distinct('pose_label');
    res.json(labels);
  } catch (error) {
    console.error('[gestureController.listLabels] Error:', error);
    res.status(500).json({ message: 'Failed to fetch pose labels' });
  }
};

exports.stats = async (_req, res) => {
  try {
    const counts = await GestureSample.aggregate([
      {
        $group: {
          _id: '$pose_label',
          samples: { $sum: 1 },
        },
      },
      { $sort: { samples: -1 } },
    ]);

    const typeBreakdown = await GestureSample.aggregate([
      {
        $group: {
          _id: '$gesture_type',
          samples: { $sum: 1 },
        },
      },
    ]);

    const motionCenter = await GestureSample.aggregate([
      {
        $group: {
          _id: null,
          deltaXAvg: { $avg: '$delta_x' },
          deltaYAvg: { $avg: '$delta_y' },
        },
      },
    ]);

    res.json({
      counts: counts.map((row) => ({
        pose_label: row._id,
        samples: row.samples,
      })),
      types: typeBreakdown.reduce(
        (acc, row) => {
          if (row._id === 'static') {
            acc.static = row.samples;
          } else if (row._id === 'dynamic') {
            acc.dynamic = row.samples;
          }
          return acc;
        },
        { static: 0, dynamic: 0 }
      ),
      motionCenter: motionCenter[0] || { deltaXAvg: 0, deltaYAvg: 0 },
    });
  } catch (error) {
    console.error('[gestureController.stats] Error:', error);
    res.status(500).json({ message: 'Failed to compute gesture statistics' });
  }
};

exports.customizeGesture = async (req, res) => {
  return res.status(410).json({
    message: 'Legacy customization flow không còn hỗ trợ. Vui lòng sử dụng endpoint /api/gestures/customize/upload.',
  });
};

exports.predictGesture = async (req, res) => {
  try {
    const { left_fingers, right_fingers, motion_features, target_gesture, duration } = req.body;

    if (!left_fingers || !right_fingers || !motion_features || !target_gesture) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('🎯 Evaluating gesture:', target_gesture);
    console.log('📏 Left fingers:', left_fingers);
    console.log('📏 Right fingers:', right_fingers);
    console.log('📊 Motion features:', motion_features);

    // Prepare data for Python script
    const inputData = {
      left_fingers,
      right_fingers,
      motion_features,
      target_gesture,
      duration: duration || 1.0
    };

    // Path to Python script
    const scriptPath = path.resolve(__dirname, '../utils/gesture_prediction.py');
    console.log('🔍 Script path:', scriptPath);
    console.log('🔍 File exists:', require('fs').existsSync(scriptPath));

    // Run Python script
    const results = await new Promise((resolve, reject) => {
      const pyshell = new PythonShell(scriptPath, {
        mode: 'json',
        pythonPath: 'python',
        pythonOptions: ['-u'],
      });

      pyshell.send(inputData);

      pyshell.on('message', (message) => {
        resolve(message);
      });

      pyshell.on('error', (error) => {
        reject(error);
      });

      pyshell.end((err) => {
        if (err) reject(err);
      });
    });

    console.log('✅ Evaluation result:', results);
    res.json(results);
  } catch (error) {
    console.error('[gestureController.predictGesture] Error:', error);
    res.status(500).json({ message: 'Prediction failed', error: error.message });
  }
};
