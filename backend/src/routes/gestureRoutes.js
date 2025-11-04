const express = require('express');
const router = express.Router();

const gestureController = require('../controllers/gestureController');
const gestureTrainingController = require('../controllers/gestureTrainingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(
  authMiddleware.protect,
  authMiddleware.authorize('superadmin')
);

router.get('/', gestureController.listSamples);
router.get('/labels', gestureController.listLabels);
router.get('/stats', gestureController.stats);

const gestureInferenceController = require('../controllers/gestureInferenceController');
const gesturePracticeController = require('../controllers/gesturePracticeController');

router.get('/model-status', gestureTrainingController.getModelStatus);
router.get('/model-info', gestureInferenceController.getModelInfo);
router.get('/model-test', gestureInferenceController.testModel);

// Practice session routes  
router.post('/practice/start', gesturePracticeController.startPracticeSession);
router.post('/practice/stop', gesturePracticeController.stopPracticeSession);
router.get('/practice/status', gesturePracticeController.getSessionStatus);
router.get('/practice/logs', gesturePracticeController.getSessionLogs);

router.post('/training', gestureTrainingController.startTraining);
router.get('/training', gestureTrainingController.listRuns);
router.get('/training/:id', gestureTrainingController.getRun);
router.delete('/training/:id', gestureTrainingController.cancelTraining);

module.exports = router;
