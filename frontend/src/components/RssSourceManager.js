import React, { useState, useEffect } from 'react';
import api from '../services/api';

const RssSourceManager = ({ token }) => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', category: 'general' });
  const [addLoading, setAddLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'economy', label: 'Economy' },
    { value: 'world', label: 'World' }
  ];

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSources();
      setSources(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setMessage(null);

    try {
      await api.addSource(newSource);
      setMessage('Source added successfully');
      setNewSource({ name: '', url: '', category: 'general' });
      setShowAddForm(false);
      await fetchSources();
    } catch (err) {
      setMessage(err.message || 'Failed to add source');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteSource = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('Are you sure you want to delete this source?')) return;

    try {
      await api.deleteSource(id);
      setMessage('Source deleted');
      fetchSources();
    } catch (err) {
      setMessage(err.message || 'Failed to delete source');
    }
  };

  const handleTestSource = async (url) => {
    try {
      const result = await api.testSource(url);
      if (result.data?.success) {
        alert('Source test successful! ' + (result.data.data?.item_count || 0) + ' items found.');
      } else {
        alert('Source test failed. Check URL or format.');
      }
    } catch (err) {
      alert('Test error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchSources} className="btn btn-secondary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="rss-source-manager">
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-bold">RSS Sources</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            {showAddForm ? 'Cancel' : '+ Add Source'}
          </button>
        </div>
        <div className="card-body">
          {message && (
            <div className={`p-3 rounded mb-4 ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-bold mb-4">Add New RSS Source</h3>
              <form onSubmit={handleAddSource} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Source Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Bloomberg Technology"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">RSS URL</label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://example.com/rss"
                    value={newSource.url}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be an RSS feed URL. Ex: https://feeds.bbci.co.uk/news/rss.xml
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Category</label>
                  <select
                    className="input"
                    value={newSource.category}
                    onChange={(e) => setNewSource({ ...newSource, category: e.target.value })}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={addLoading}>
                    {addLoading ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {sources.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No RSS sources added yet.
              </p>
            ) : (
              sources.map(source => (
                <div
                  key={source.id}
                  className="flex justify-between items-center p-4 bg-gray-100 rounded"
                >
                  <div className="flex-1">
                    <div className="font-bold text-lg">{source.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {source.url}
                    </div>
                    <div className="text-sm">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                        {source.category}
                      </span>
                      <span className="ml-2">
                        {source.is_active ? '✅ Active' : '⏸️ Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestSource(source.url)}
                      className="btn btn-secondary text-sm"
                      title="Test"
                    >
                      🧪 Test
                    </button>
                    {token && (
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="btn bg-red-500 text-white hover:bg-red-600 text-sm"
                        title="Delete"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RssSourceManager;
