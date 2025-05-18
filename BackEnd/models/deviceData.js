import mongoose from 'mongoose';

const deviceDataSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const DeviceData = mongoose.model('DeviceData', deviceDataSchema);

export default DeviceData; 