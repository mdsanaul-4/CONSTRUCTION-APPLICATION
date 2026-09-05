
import dns from "dns";

dns.setServers(['1.1.1.1', '8.8.8.8']);

import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Construction Labour Manager API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
