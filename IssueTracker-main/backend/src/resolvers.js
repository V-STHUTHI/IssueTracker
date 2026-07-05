import { PubSub } from 'graphql-subscriptions';
import { db } from './db.js';

const pubsub = new PubSub();

const ISSUE_ADDED = 'ISSUE_ADDED';
const ISSUE_UPDATED = 'ISSUE_UPDATED';
const ISSUE_DELETED = 'ISSUE_DELETED';

export const resolvers = {
  Query: {
    issues: async (_, { status, priority, search }) => {
      return await db.getIssues({ status, priority, search });
    },
    issue: async (_, { id }) => {
      return await db.getIssueById(id);
    },
  },
  Mutation: {
    createIssue: async (_, args) => {
      const newIssue = await db.createIssue(args);
      pubsub.publish(ISSUE_ADDED, { issueAdded: newIssue });
      return newIssue;
    },
    updateIssue: async (_, { id, ...updates }) => {
      const updatedIssue = await db.updateIssue(id, updates);
      if (updatedIssue) {
        pubsub.publish(ISSUE_UPDATED, { issueUpdated: updatedIssue });
      }
      return updatedIssue;
    },
    deleteIssue: async (_, { id }) => {
      const deleted = await db.deleteIssue(id);
      if (deleted) {
        pubsub.publish(ISSUE_DELETED, { issueDeleted: id });
      }
      return deleted;
    },
  },
  Subscription: {
    issueAdded: {
      subscribe: () => pubsub.asyncIterator([ISSUE_ADDED]),
    },
    issueUpdated: {
      subscribe: () => pubsub.asyncIterator([ISSUE_UPDATED]),
    },
    issueDeleted: {
      subscribe: () => pubsub.asyncIterator([ISSUE_DELETED]),
    },
  },
};
