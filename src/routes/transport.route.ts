import { Router } from 'express';
import { getAllTransports, getTransportsByTripId, createTransport, updateTransport, deleteTransport } from '../controllers/transport.controller.js';

const router = Router();

// GET: Lấy tất cả phương tiện vận chuyển
router.get('/getAllTransports', getAllTransports);

// GET: Lấy phương tiện vận chuyển theo tripId
router.get('/getTransports', getTransportsByTripId);

// POST: Tạo phương tiện vận chuyển mới
router.post('/createTransport', createTransport);

// PUT: Cập nhật phương tiện vận chuyển theo id
router.put('/updateTransport/:id', updateTransport);

// DELETE: Xóa phương tiện vận chuyển theo id
router.delete('/deleteTransport/:id', deleteTransport);

export default router;