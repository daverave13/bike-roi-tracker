import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useApi';

export function Settings() {
  const { settings, loading, error, updateSettings } = useSettings();

  const [defaultDistance, setDefaultDistance] = useState('');
  const [mpg, setMpg] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [logPin, setLogPin] = useState('');
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
      const updates: Record<string, string> = {
        default_distance: defaultDistance,
        mpg,
      };
      if (apiKey) {
        updates.eia_api_key = apiKey;
      }
      if (logPin) {
        updates.log_pin = logPin;
      }
      await updateSettings(updates);
      setApiKey('');
      setLogPin('');
      setSuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card">Loading settings...</div>;
  if (error) return <div className="card error">{error}</div>;

  const hasApiKey = settings?.eia_api_key && settings.eia_api_key.length > 0;
  const hasPin = settings?.log_pin && settings.log_pin.length > 0;

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

        <div className="form-group">
          <label htmlFor="apiKey">
            EIA API Key {hasApiKey && <span style={{ color: '#2e7d32' }}>(configured)</span>}
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={hasApiKey ? 'Leave blank to keep current' : 'Enter your EIA API key'}
          />
          <small>
            <a href="https://www.eia.gov/opendata/register.php" target="_blank" rel="noopener noreferrer">
              Get a free API key from EIA
            </a>
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="logPin">
            Log Ride PIN {hasPin && <span style={{ color: '#2e7d32' }}>(set)</span>}
          </label>
          <input
            type="password"
            id="logPin"
            value={logPin}
            onChange={e => setLogPin(e.target.value)}
            placeholder={hasPin ? 'Leave blank to keep current' : 'Set a PIN (optional)'}
          />
          <small>Protects the Log Ride page. Leave empty to disable protection.</small>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
