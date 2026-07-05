import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    assignee: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: 'created', updatedAt: 'updated' },
  }
);

// Virtual field to return 'id' instead of '_id' for GraphQL
issueSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

issueSchema.set('toJSON', { virtuals: true });
issueSchema.set('toObject', { virtuals: true });

export const Issue = mongoose.model('Issue', issueSchema);
