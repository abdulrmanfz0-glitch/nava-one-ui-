/**
 * Git Operations Dashboard Component
 *
 * Provides a UI for managing Git operations via the Nava Ops API:
 * - View branches across repositories
 * - Execute workflows (fetch, pull, sync)
 * - Merge branches
 * - View operation reports
 * - Configure notifications
 */

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitMerge,
  RefreshCw,
  Settings,
  Bell,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Loader
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function GitOperations() {
  const [activeTab, setActiveTab] = useState('branches');
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const [config, setConfig] = useState(null);

  // Configuration state
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    repositories: [{
      path: '',
      name: '',
      branches: [{ name: 'main', remote: 'origin' }]
    }]
  });

  // Notification configuration
  const [notificationConfig, setNotificationConfig] = useState({
    console_enabled: true,
    slack_enabled: false,
    email_enabled: false,
    slack_webhook_url: '',
    email_smtp_host: '',
    email_smtp_port: 587,
    email_from: '',
    email_to: []
  });

  // Merge state
  const [mergeForm, setMergeForm] = useState({
    repository_path: '',
    source_branch: '',
    target_branch: '',
    strategy: 'merge'
  });

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();

      if (data.orchestrator_configured) {
        fetchBranches();
        fetchConfig();
      }
    } catch (err) {
      // API health check failed silently
    }
  };

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/branches`);
      if (!response.ok) throw new Error('Failed to fetch branches');

      const data = await response.json();
      setRepositories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (err) {
      // Failed to fetch config silently
    }
  };

  const submitConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...configForm,
          parallel_operations: true,
          max_workers: 4,
          retry_attempts: 3
        })
      });

      if (!response.ok) throw new Error('Failed to configure orchestrator');

      const data = await response.json();
      alert(`Configuration successful! ${data.repositories} repositories configured.`);
      setShowConfig(false);
      fetchBranches();
      fetchConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (operations) => {
    setWorkflowRunning(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      });

      if (!response.ok) throw new Error('Failed to execute workflow');

      const data = await response.json();
      setLastReport(data);
      alert(`Workflow completed! Success rate: ${data.summary.success_rate.toFixed(1)}%`);
      fetchBranches(); // Refresh branch data
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkflowRunning(false);
    }
  };

  const syncAll = async () => {
    setWorkflowRunning(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/workflow/sync`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to sync');

      const data = await response.json();
      alert(`Sync completed! Success rate: ${data.summary.success_rate.toFixed(1)}%`);
      fetchBranches();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkflowRunning(false);
    }
  };

  const executeMerge = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergeForm)
      });

      if (!response.ok) throw new Error('Failed to merge');

      const data = await response.json();

      if (data.status === 'conflict') {
        alert(`Merge conflict detected!\n\n${data.conflicts}`);
      } else {
        alert(`Merge successful!\n${data.message}`);
        setMergeForm({
          repository_path: '',
          source_branch: '',
          target_branch: '',
          strategy: 'merge'
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const configureNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationConfig)
      });

      if (!response.ok) throw new Error('Failed to configure notifications');

      alert('Notifications configured successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <GitBranch className="text-purple-600" />
                Nava Ops - Git Operations Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage multi-branch Git operations across repositories
              </p>
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Settings size={20} />
              Configure
            </button>
          </div>

          {/* Configuration Status */}
          {config && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                <CheckCircle className="inline mr-2" size={16} />
                Orchestrator configured: {config.repositories?.length || 0} repositories
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <XCircle className="inline mr-2" size={16} />
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Configuration Panel */}
        {showConfig && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Orchestrator Configuration</h2>

            {configForm.repositories.map((repo, idx) => (
              <div key={idx} className="mb-4 p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Repository {idx + 1}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Repository Path (e.g., /path/to/repo)"
                    value={repo.path}
                    onChange={(e) => {
                      const newRepos = [...configForm.repositories];
                      newRepos[idx].path = e.target.value;
                      setConfigForm({ ...configForm, repositories: newRepos });
                    }}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Repository Name"
                    value={repo.name}
                    onChange={(e) => {
                      const newRepos = [...configForm.repositories];
                      newRepos[idx].name = e.target.value;
                      setConfigForm({ ...configForm, repositories: newRepos });
                    }}
                    className="border rounded px-3 py-2"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-2">Branches:</label>
                  {repo.branches.map((branch, branchIdx) => (
                    <div key={branchIdx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Branch name"
                        value={branch.name}
                        onChange={(e) => {
                          const newRepos = [...configForm.repositories];
                          newRepos[idx].branches[branchIdx].name = e.target.value;
                          setConfigForm({ ...configForm, repositories: newRepos });
                        }}
                        className="border rounded px-3 py-2 flex-1"
                      />
                      <input
                        type="text"
                        placeholder="Remote"
                        value={branch.remote}
                        onChange={(e) => {
                          const newRepos = [...configForm.repositories];
                          newRepos[idx].branches[branchIdx].remote = e.target.value;
                          setConfigForm({ ...configForm, repositories: newRepos });
                        }}
                        className="border rounded px-3 py-2 w-32"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newRepos = [...configForm.repositories];
                      newRepos[idx].branches.push({ name: '', remote: 'origin' });
                      setConfigForm({ ...configForm, repositories: newRepos });
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    + Add Branch
                  </button>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={() => setConfigForm({
                  repositories: [...configForm.repositories, { path: '', name: '', branches: [{ name: 'main', remote: 'origin' }] }]
                })}
                className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
              >
                Add Repository
              </button>
              <button
                onClick={submitConfig}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            {[
              { id: 'branches', label: 'Branches', icon: GitBranch },
              { id: 'workflows', label: 'Workflows', icon: Play },
              { id: 'merge', label: 'Merge', icon: GitMerge },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'notifications', label: 'Notifications', icon: Bell }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Branches Tab */}
            {activeTab === 'branches' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Repository Branches</h2>
                  <button
                    onClick={fetchBranches}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <Loader className="animate-spin mx-auto text-purple-600" size={32} />
                  </div>
                ) : repositories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No repositories configured. Click "Configure" to get started.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {repositories.map((repo, idx) => (
                      <div key={idx} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">{repo.repository}</h3>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <GitBranch size={16} />
                                Current: <code className="bg-white px-2 py-1 rounded">{repo.current_branch}</code>
                              </span>
                              {repo.has_uncommitted_changes && (
                                <span className="text-orange-600 flex items-center gap-1">
                                  <Clock size={16} />
                                  Uncommitted changes
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Branch</th>
                                <th className="text-left py-2">Last Commit</th>
                                <th className="text-left py-2">Author</th>
                                <th className="text-left py-2">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {repo.branches.map((branch, branchIdx) => (
                                <tr key={branchIdx} className={`border-b ${branch.is_current ? 'bg-purple-50' : ''}`}>
                                  <td className="py-2">
                                    <code className="bg-gray-100 px-2 py-1 rounded">
                                      {branch.name}
                                      {branch.is_current && <span className="ml-2 text-purple-600">*</span>}
                                    </code>
                                  </td>
                                  <td className="py-2">
                                    <code className="text-sm">{branch.last_commit || '-'}</code>
                                  </td>
                                  <td className="py-2 text-sm">{branch.last_commit_author || '-'}</td>
                                  <td className="py-2 text-sm">{branch.last_commit_date ? new Date(branch.last_commit_date).toLocaleString() : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Workflows Tab */}
            {activeTab === 'workflows' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Execute Workflows</h2>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => executeWorkflow(['fetch'])}
                    disabled={workflowRunning || !config}
                    className="p-6 border-2 border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition disabled:opacity-50"
                  >
                    <Download className="mx-auto mb-2 text-purple-600" size={32} />
                    <h3 className="font-bold">Fetch All</h3>
                    <p className="text-sm text-gray-600 mt-1">Fetch latest changes from remotes</p>
                  </button>

                  <button
                    onClick={() => executeWorkflow(['pull'])}
                    disabled={workflowRunning || !config}
                    className="p-6 border-2 border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition disabled:opacity-50"
                  >
                    <RefreshCw className="mx-auto mb-2 text-purple-600" size={32} />
                    <h3 className="font-bold">Pull All</h3>
                    <p className="text-sm text-gray-600 mt-1">Pull changes into local branches</p>
                  </button>

                  <button
                    onClick={syncAll}
                    disabled={workflowRunning || !config}
                    className="p-6 border-2 border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition disabled:opacity-50 col-span-2"
                  >
                    <CheckCircle className="mx-auto mb-2 text-purple-600" size={32} />
                    <h3 className="font-bold">Sync All (Fetch + Pull)</h3>
                    <p className="text-sm text-gray-600 mt-1">Complete synchronization of all branches</p>
                  </button>
                </div>

                {lastReport && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold mb-2">Last Workflow Report</h3>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Operations:</span>
                        <span className="ml-2 font-bold">{lastReport.summary.total_operations}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Successful:</span>
                        <span className="ml-2 font-bold text-green-600">{lastReport.summary.successful_operations}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Failed:</span>
                        <span className="ml-2 font-bold text-red-600">{lastReport.summary.failed_operations}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="ml-2 font-bold">{lastReport.summary.success_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {workflowRunning && (
                  <div className="mt-6 text-center">
                    <Loader className="animate-spin mx-auto text-purple-600" size={32} />
                    <p className="mt-2 text-gray-600">Executing workflow...</p>
                  </div>
                )}
              </div>
            )}

            {/* Merge Tab */}
            {activeTab === 'merge' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Merge Branches</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Repository Path</label>
                    <input
                      type="text"
                      value={mergeForm.repository_path}
                      onChange={(e) => setMergeForm({ ...mergeForm, repository_path: e.target.value })}
                      placeholder="/path/to/repository"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Source Branch</label>
                      <input
                        type="text"
                        value={mergeForm.source_branch}
                        onChange={(e) => setMergeForm({ ...mergeForm, source_branch: e.target.value })}
                        placeholder="feature-branch"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Target Branch</label>
                      <input
                        type="text"
                        value={mergeForm.target_branch}
                        onChange={(e) => setMergeForm({ ...mergeForm, target_branch: e.target.value })}
                        placeholder="main"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Merge Strategy</label>
                    <select
                      value={mergeForm.strategy}
                      onChange={(e) => setMergeForm({ ...mergeForm, strategy: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="merge">Merge (creates merge commit)</option>
                      <option value="rebase">Rebase (linear history)</option>
                      <option value="squash">Squash (single commit)</option>
                    </select>
                  </div>

                  <button
                    onClick={executeMerge}
                    disabled={loading || !mergeForm.repository_path || !mergeForm.source_branch || !mergeForm.target_branch}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                  >
                    <GitMerge className="inline mr-2" size={20} />
                    Execute Merge
                  </button>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Operation Reports</h2>
                <p className="text-gray-600">
                  Reports are generated after executing workflows. Check the API server's reports directory for generated files.
                </p>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Reports are available in JSON, Markdown, and HTML formats at the configured output directory.
                  </p>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Notification Configuration</h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationConfig.console_enabled}
                      onChange={(e) => setNotificationConfig({ ...notificationConfig, console_enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label>Console Notifications</label>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={notificationConfig.slack_enabled}
                        onChange={(e) => setNotificationConfig({ ...notificationConfig, slack_enabled: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label className="font-medium">Slack Notifications</label>
                    </div>
                    {notificationConfig.slack_enabled && (
                      <input
                        type="text"
                        value={notificationConfig.slack_webhook_url}
                        onChange={(e) => setNotificationConfig({ ...notificationConfig, slack_webhook_url: e.target.value })}
                        placeholder="https://hooks.slack.com/services/..."
                        className="w-full border rounded px-3 py-2 ml-7"
                      />
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={notificationConfig.email_enabled}
                        onChange={(e) => setNotificationConfig({ ...notificationConfig, email_enabled: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label className="font-medium">Email Notifications</label>
                    </div>
                    {notificationConfig.email_enabled && (
                      <div className="ml-7 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={notificationConfig.email_smtp_host}
                            onChange={(e) => setNotificationConfig({ ...notificationConfig, email_smtp_host: e.target.value })}
                            placeholder="smtp.gmail.com"
                            className="border rounded px-3 py-2"
                          />
                          <input
                            type="number"
                            value={notificationConfig.email_smtp_port}
                            onChange={(e) => setNotificationConfig({ ...notificationConfig, email_smtp_port: parseInt(e.target.value) })}
                            placeholder="587"
                            className="border rounded px-3 py-2"
                          />
                        </div>
                        <input
                          type="email"
                          value={notificationConfig.email_from}
                          onChange={(e) => setNotificationConfig({ ...notificationConfig, email_from: e.target.value })}
                          placeholder="From email address"
                          className="w-full border rounded px-3 py-2"
                        />
                        <input
                          type="text"
                          value={notificationConfig.email_to.join(', ')}
                          onChange={(e) => setNotificationConfig({ ...notificationConfig, email_to: e.target.value.split(',').map(s => s.trim()) })}
                          placeholder="To email addresses (comma-separated)"
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={configureNotifications}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium mt-4"
                  >
                    Save Notification Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
