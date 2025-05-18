import express from 'express';
import {
  createDeviceData,
  getLatestDeviceData,
  getAllDeviceData,
  getSimulationStatus,
  deleteDeviceData,
} from '../controllers/deviceDataController.js';

const router = express.Router();

// @route   POST /api/data
router.post('/', createDeviceData);

// @route   GET /api/data/latest
router.get('/latest', getLatestDeviceData);

// @route   GET /api/data/status
router.get('/status', getSimulationStatus);

// @route   GET /api/data
router.get('/', getAllDeviceData);

// @route   DELETE /api/data/:deviceId
router.delete('/:deviceId', deleteDeviceData);

export default router; 