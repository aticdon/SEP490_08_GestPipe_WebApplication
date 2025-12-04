const express = require('express');
const router = express.Router();
const Version = require('../models/Version');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { PythonShell } = require('python-shell');
const { exec } = require('child_process');
const path = require('path');

// Get all available gesture sets from Drive
router.get('/available', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    // Alternative approach using child_process.exec
    const { exec } = require('child_process');
    const scriptPath = path.resolve(__dirname, '../../services/gesture_set_api.py');
    const command = `python "${scriptPath}" list_gesture_sets`;
    
    let isResponseSent = false;

    const timeout = setTimeout(() => {
      if (!isResponseSent) {
        isResponseSent = true;
        console.log('[ERROR] Python script timeout after 30 seconds');
        return res.status(500).json({ 
          success: false, 
          message: 'Request timeout - Drive operation took too long'
        });
      }
    }, 30000);

    exec(command, { cwd: path.resolve(__dirname, '../..') }, async (err, stdout, stderr) => {
      clearTimeout(timeout);
      
      if (isResponseSent) return;
      if (err) {
        console.error('[ERROR] Python script error:', err);
        isResponseSent = true;
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching gesture sets from Drive',
          error: err.message 
        });
      }

      try {
        
        // Parse JSON from stdout
        let gesturesets = [];
        if (stdout && stdout.trim()) {
          gesturesets = JSON.parse(stdout.trim());
        }
        
        // Get current active gesture set from database
        const activeVersion = await Version.findOne({ 
          gestureSetType: 'gestureset', 
          isActiveGestureSet: true 
        });

        isResponseSent = true;
        res.json({
          success: true,
          data: {
            availableGestureSets: gesturesets,
            currentActiveSet: activeVersion ? {
              id: activeVersion._id,
              name: activeVersion.gestureSetName,
              gestureSetId: activeVersion.gestureSetId,
              version: activeVersion.name,
              publishedAt: activeVersion.created_at
            } : null
          }
        });
        
      } catch (parseErr) {
        console.error('[ERROR] Error parsing Python results:', parseErr);
        if (!isResponseSent) {
          isResponseSent = true;
          res.status(500).json({ 
            success: false, 
            message: 'Error parsing gesture sets data',
            error: parseErr.message 
          });
        }
      }
    });

  } catch (error) {
    console.error('[ERROR] Error in /available route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Publish a gesture set (create version + move to ActiveSet)
router.post('/publish', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { gestureSetId, gestureSetName, description } = req.body;
    const adminId = req.admin.id;

    if (!gestureSetId || !gestureSetName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: gestureSetId and gestureSetName' 
      });
    }

    // Step 1: Move folders on Drive using child_process.exec
    const scriptPath = path.resolve(__dirname, '../../services/gesture_set_api.py');
    const command = `python "${scriptPath}" publish_gesture_set "${gestureSetId}" "${gestureSetName}"`;

    let isResponseSent = false;

    // Add timeout
    const timeout = setTimeout(() => {
      if (!isResponseSent) {
        isResponseSent = true;
        console.log('[ERROR] Python publish script timeout after 30 seconds');
        return res.status(500).json({ 
          success: false, 
          message: 'Request timeout - Drive publish operation took too long'
        });
      }
    }, 30000);

    exec(command, { cwd: path.resolve(__dirname, '../..') }, async (err, stdout, stderr) => {
      clearTimeout(timeout);
      
      if (isResponseSent) return; // Response already sent by timeout
      if (err) {
        console.error('[ERROR] Python publish script error:', err);
        isResponseSent = true;
        return res.status(500).json({ 
          success: false, 
          message: 'Error publishing gesture set on Drive',
          error: err.message 
        });
      }

      try {
        
        // Parse JSON from stdout
        let publishResult = {};
        if (stdout && stdout.trim()) {
          publishResult = JSON.parse(stdout.trim());
        }
        
        if (!publishResult.success) {
          isResponseSent = true;
          return res.status(500).json({
            success: false,
            message: 'Failed to publish gesture set on Drive',
            error: publishResult.error
          });
        }

        // Step 2: Update database - set old active version to inactive
        await Version.updateMany(
          { 
            gestureSetType: 'gestureset', 
            isActiveGestureSet: true 
          },
          { 
            isActiveGestureSet: false,
            status: 'inactive'
          }
        );

        // Step 3: Create new version record
        const versionName = `v1.0.${Date.now().toString().slice(-6)}`;
        
        const newVersion = new Version({
          name: versionName,
          release_name: `Gesture Set: ${gestureSetName}`,
          description: description || `Published gesture set: ${gestureSetName}`,
          release_date: new Date(),
          status: 'active',
          accuracy: 92,
          gestureSetId: gestureSetId,
          gestureSetName: gestureSetName,
          gestureSetType: 'gestureset',
          driveFolder: `/ActiveSet/${gestureSetName}/`,
          isActiveGestureSet: true,
          gestureCount: publishResult.gesture_count || 0,
          admin_id: adminId
        });

        await newVersion.save();

        // Success - gesture set published
        isResponseSent = true;
        res.json({
          success: true,
          message: `Gesture set "${gestureSetName}" published successfully`,
          data: {
            version: newVersion,
            publishResult: publishResult
          }
        });

      } catch (parseErr) {
        console.error('[ERROR] Error processing publish result:', parseErr);
        if (!isResponseSent) {
          isResponseSent = true;
          res.status(500).json({ 
            success: false, 
            message: 'Error processing gesture set publication',
            error: parseErr.message 
          });
        }
      }
    });

  } catch (error) {
    console.error('[ERROR] Error in /publish route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get gesture set publication history
router.get('/history', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const versions = await Version.find({ 
      gestureSetType: 'gestureset' 
    })
    .populate('admin_id', 'username email')
    .sort({ created_at: -1 });

    res.json({
      success: true,
      data: versions
    });

  } catch (error) {
    console.error('[ERROR] Error fetching gesture set history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching gesture set history',
      error: error.message 
    });
  }
});

module.exports = router;