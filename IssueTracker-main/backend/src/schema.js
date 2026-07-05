export const typeDefs = `#graphql
  enum Status {
    OPEN
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type Issue {
    id: ID!
    title: String!
    description: String
    status: Status!
    priority: Priority!
    assignee: String
    created: String!
    updated: String!
  }

  type Query {
    issues(status: Status, priority: Priority, search: String): [Issue!]!
    issue(id: ID!): Issue
  }

  type Mutation {
    createIssue(
      title: String!
      description: String
      status: Status
      priority: Priority
      assignee: String
    ): Issue!

    updateIssue(
      id: ID!
      title: String
      description: String
      status: Status
      priority: Priority
      assignee: String
    ): Issue

    deleteIssue(id: ID!): Boolean!
  }

  type Subscription {
    issueAdded: Issue!
    issueUpdated: Issue!
    issueDeleted: ID!
  }
`;
