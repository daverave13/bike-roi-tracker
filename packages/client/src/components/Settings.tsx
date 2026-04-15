import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useApi';

export function Settings() {
  const { settings, loading, error, updateSettings } = useSettings();

  const [defaultDistance, setDefaultDistance] = useState('');
  const [mpg, setMpg] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setDefaultDistance(settings.default_distance);
      setMpg(settings.mpg);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await updateSettings({
        default_distance: defaultDistance,
        mpg,
      });
      setSuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card">Loading settings...</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="card">
      <h2>Settings</h2>
      {success && <div className="success">Settings saved!</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="defaultDistance">Default Round Trip Distance (miles)</label>
          <input
            type="number"
            id="defaultDistance"
            value={defaultDistance}
            onChange={e => setDefaultDistance(e.target.value)}
            step="0.1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="mpg">Vehicle MPG</label>
          <input
            type="number"
            id="mpg"
            value={mpg}
            onChange={e => setMpg(e.target.value)}
            step="0.1"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
