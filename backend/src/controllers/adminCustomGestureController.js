const AdminCustomGesture = require('../models/AdminCustomGesture');
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

    // Update status thành 'accept'
    request.status = 'accept';
    request.rejectReason = '';
    await request.save();

    // Có thể thêm logic xử lý data ở đây (giống như prepare_user_data.py)

    return res.json({
      success: true,
      message: 'Request approved successfully.',
      data: request,
    });
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