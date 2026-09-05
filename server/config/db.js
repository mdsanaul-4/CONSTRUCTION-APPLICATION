import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  isConnected = true;

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('MongoDB disconnected');
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  isConnected = false;
}
