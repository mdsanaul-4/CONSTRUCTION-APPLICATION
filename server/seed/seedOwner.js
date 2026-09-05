import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';

async function seedOwner() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_COMPANY_NAME } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding.');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  const existingUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existingUser) {
    console.log(`A user with email ${ADMIN_EMAIL} already exists. Nothing to do.`);
    await disconnectDB();
    process.exit(0);
  }

  const company = await Company.create({
    name: ADMIN_COMPANY_NAME || 'My Construction Company',
  });

  const passwordHash = await User.hashPassword(ADMIN_PASSWORD);
  const owner = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    role: 'owner',
    companyId: company._id,
  });

  company.ownerId = owner._id;
  await company.save();

  await Settings.create({ companyId: company._id, companyName: company.name });

  console.log('Owner account created successfully:');
  console.log(`  Company: ${company.name}`);
  console.log(`  Email:   ${owner.email}`);
  console.log('You can now log in with this email and the password you set in .env.');

  await disconnectDB();
  process.exit(0);
}

seedOwner().catch(async (err) => {
  console.error('Seeding failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
