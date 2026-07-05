import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Issue } from './models/Issue.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/issuetracker';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Connected to MongoDB successfully.');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

export const db = {
  getIssues: async ({ status, priority, search }) => {
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { assignee: regex },
      ];
    }

    return await Issue.find(filter).sort({ updated: -1 });
  },

  getIssueById: async (id) => {
    try {
      return await Issue.findById(id);
    } catch (err) {
      return null;
    }
  },

  createIssue: async ({ title, description, status, priority, assignee }) => {
    const newIssue = new Issue({
      title,
      description,
      status: status || 'OPEN',
      priority: priority || 'MEDIUM',
      assignee,
    });
    return await newIssue.save();
  },

  updateIssue: async (id, updates) => {
    try {
      return await Issue.findByIdAndUpdate(id, updates, { new: true });
    } catch (err) {
      return null;
    }
  },

  deleteIssue: async (id) => {
    try {
      const result = await Issue.findByIdAndDelete(id);
      return !!result;
    } catch (err) {
      return false;
    }
  },
};
