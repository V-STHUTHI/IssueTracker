import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';

// GraphQL Operations
const GET_ISSUES = gql`
  query GetIssues($status: Status, $priority: Priority, $search: String) {
    issues(status: $status, priority: $priority, search: $search) {
      id
      title
      description
      status
      priority
      assignee
      created
      updated
    }
  }
`;

const CREATE_ISSUE = gql`
  mutation CreateIssue($title: String!, $description: String, $status: Status, $priority: Priority, $assignee: String) {
    createIssue(title: $title, description: $description, status: $status, priority: $priority, assignee: $assignee) {
      id
      title
      status
    }
  }
`;

const UPDATE_ISSUE = gql`
  mutation UpdateIssue($id: ID!, $title: String, $description: String, $status: Status, $priority: Priority, $assignee: String) {
    updateIssue(id: $id, title: $title, description: $description, status: $status, priority: $priority, assignee: $assignee) {
      id
      status
      priority
      assignee
      updated
    }
  }
`;

const DELETE_ISSUE = gql`
  mutation DeleteIssue($id: ID!) {
    deleteIssue(id: $id)
  }
`;

// Real-time Subscriptions
const ISSUE_ADDED_SUB = gql`
  subscription OnIssueAdded {
    issueAdded {
      id
      title
    }
  }
`;

const ISSUE_UPDATED_SUB = gql`
  subscription OnIssueUpdated {
    issueUpdated {
      id
      status
      priority
    }
  }
`;

const ISSUE_DELETED_SUB = gql`
  subscription OnIssueDeleted {
    issueDeleted
  }
`;

function App() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // New Issue Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignee, setAssignee] = useState('');

  // Fetch GraphQL issues
  const { loading, error, data, refetch } = useQuery(GET_ISSUES, {
    variables: {
      search: search || null,
      status: statusFilter || null,
      priority: priorityFilter || null,
    },
  });

  // Setup Subscription Hooks to auto-trigger query refetches
  useSubscription(ISSUE_ADDED_SUB, {
    onData: () => {
      refetch();
    }
  });

  useSubscription(ISSUE_UPDATED_SUB, {
    onData: () => {
      refetch();
    }
  });

  useSubscription(ISSUE_DELETED_SUB, {
    onData: () => {
      refetch();
    }
  });

  // Mutations
  const [createIssue] = useMutation(CREATE_ISSUE);
  const [updateIssue] = useMutation(UPDATE_ISSUE);
  const [deleteIssue] = useMutation(DELETE_ISSUE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      await createIssue({
        variables: {
          title,
          description,
          status,
          priority,
          assignee,
        }
      });
      // Reset form
      setTitle('');
      setDescription('');
      setStatus('OPEN');
      setPriority('MEDIUM');
      setAssignee('');
      setShowModal(false);
    } catch (err) {
      console.error("Failed to create issue:", err);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateIssue({
        variables: { id, status: newStatus }
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdatePriority = async (id, newPriority) => {
    try {
      await updateIssue({
        variables: { id, priority: newPriority }
      });
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this issue?")) {
      try {
        await deleteIssue({
          variables: { id }
        });
      } catch (err) {
        console.error("Failed to delete issue:", err);
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="app-container">
      <header>
        <h1>
          <span style={{ color: '#6366F1' }}>✦</span> IssueTracker Dashboard
        </h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Issue
        </button>
      </header>

      {/* Filter and Search Section */}
      <section className="filters-container">
        <div className="form-group">
          <input
            type="text"
            placeholder="Search issues by title, description or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div className="form-group">
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </section>

      {/* Issues Listing */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading issues...</p>
      ) : error ? (
        <p style={{ textAlign: 'center', color: '#EF4444' }}>Error: {error.message}</p>
      ) : (
        <main className="issues-grid">
          {data.issues.length === 0 ? (
            <div className="empty-state">
              <h3>No Issues Found</h3>
              <p style={{ marginTop: '0.5rem' }}>Create a new issue or adjust your search filters.</p>
            </div>
          ) : (
            data.issues.map((issue) => (
              <article key={issue.id} className="issue-card">
                <div>
                  <div className="issue-header">
                    <span className={`badge badge-status-${issue.status}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                    <span className="priority-indicator">
                      <span className={`dot dot-${issue.priority}`} />
                      {issue.priority}
                    </span>
                  </div>
                  <h2 className="issue-title">{issue.title}</h2>
                  <p className="issue-desc">{issue.description || 'No description provided.'}</p>
                </div>

                <div className="issue-footer">
                  <div className="assignee">
                    <div className="assignee-avatar" title={issue.assignee || 'Unassigned'}>
                      {getInitials(issue.assignee)}
                    </div>
                    <span>{issue.assignee || 'Unassigned'}</span>
                  </div>

                  <div className="actions-menu">
                    <select
                      value={issue.status}
                      onChange={(e) => handleUpdateStatus(issue.id, e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>

                    <select
                      value={issue.priority}
                      onChange={(e) => handleUpdatePriority(issue.id, e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>

                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => handleDelete(issue.id)}
                      title="Delete Issue"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </main>
      )}

      {/* New Issue Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Issue</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter issue title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    placeholder="Describe the issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assignee</label>
                  <input
                    type="text"
                    placeholder="Assignee name..."
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
