import { useState, useEffect } from 'react';
import { useSettings, usePin, useDestinations, usePlacesSearch } from '../hooks/useApi';

export function Settings() {
  const { settings, loading, error, updateSettings } = useSettings();
  const { unlocked, verifyPin, checkRequired } = usePin();
  const { destinations, createDestination, updateDestination, deleteDestination, refresh: refreshDestinations } = useDestinations();
  const { places, loading: searchLoading, error: searchError, searchPlaces, clearResults } = usePlacesSearch();

  const [pinRequired, setPinRequired] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [newDestTitle, setNewDestTitle] = useState('');
  const [newDestDistance, setNewDestDistance] = useState('');
  const [addingDest, setAddingDest] = useState(false);

  const [editingDest, setEditingDest] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDrivingDist, setEditDrivingDist] = useState('');
  const [editBikingDist, setEditBikingDist] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [defaultDistance, setDefaultDistance] = useState('');
  const [mpg, setMpg] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [placesApiKey, setPlacesApiKey] = useState('');
  const [logPin, setLogPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [addingPlace, setAddingPlace] = useState<{ name: string; drivingDistance: number; bikingDistance: number } | null>(null);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    checkRequired().then((required) => setPinRequired(required));
  }, [checkRequired]);

  useEffect(() => {
    if (settings) {
      setDefaultDistance(settings.default_distance);
      setMpg(settings.mpg);
    }
  }, [settings]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);
    const valid = await verifyPin(pinInput);
    if (!valid) {
      setPinError(true);
    }
  };

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
      if (placesApiKey) {
        updates.google_places_api_key = placesApiKey;
      }
      await updateSettings(updates);
      setApiKey('');
      setPlacesApiKey('');
      setLogPin('');
      setSuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestTitle.trim() || !newDestDistance) return;
    setAddingDest(true);
    try {
      await createDestination(newDestTitle.trim(), parseFloat(newDestDistance));
      setNewDestTitle('');
      setNewDestDistance('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add destination');
    } finally {
      setAddingDest(false);
    }
  };

  const handleDeleteDestination = async (id: number) => {
    if (!confirm('Delete this destination?')) return;
    try {
      await deleteDestination(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete destination');
    }
  };

  const handleEditDestination = (dest: { id: number; title: string; distance: number; biking_distance: number | null }) => {
    setEditingDest(dest.id);
    setEditTitle(dest.title);
    setEditDrivingDist(String(dest.distance));
    setEditBikingDist(dest.biking_distance ? String(dest.biking_distance) : '');
  };

  const handleSaveEdit = async () => {
    if (!editingDest || !editTitle.trim() || !editDrivingDist) return;
    setSavingEdit(true);
    try {
      await updateDestination(
        editingDest,
        editTitle.trim(),
        parseFloat(editDrivingDist),
        editBikingDist ? parseFloat(editBikingDist) : undefined
      );
      setEditingDest(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update destination');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingDest(null);
  };

  if (pinRequired === null) {
    return <div className="card">Loading...</div>;
  }

  if (pinRequired && !unlocked) {
    return (
      <div className="card">
        <h2>Enter PIN</h2>
        {pinError && <div className="error">Incorrect PIN</div>}
        <form onSubmit={handlePinSubmit}>
          <div className="form-group">
            <label htmlFor="settings-pin">PIN</label>
            <input
              type="password"
              id="settings-pin"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN to access"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <div className="card">Loading settings...</div>;
  if (error) return <div className="card error">{error}</div>;

  const hasApiKey = settings?.eia_api_key && settings.eia_api_key.length > 0;
  const hasPlacesApiKey = settings?.google_places_api_key && settings.google_places_api_key.length > 0;
  const hasPin = settings?.log_pin && settings.log_pin.length > 0;

  const handlePlaceSearch = async () => {
    if (!placeSearchQuery.trim()) return;

    setLocationError(null);

    if (!userLocation) {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          searchPlaces(placeSearchQuery, loc.lat, loc.lng);
        },
        (err) => {
          setLocationError(`Location error: ${err.message}`);
        }
      );
    } else {
      searchPlaces(placeSearchQuery, userLocation.lat, userLocation.lng);
    }
  };

  const handleAddPlace = (place: { name: string; drivingDistance: number; bikingDistance: number }) => {
    setAddingPlace(place);
    setCustomName(place.name);
  };

  const handleSavePlace = async () => {
    if (!addingPlace || !customName.trim()) return;
    try {
      await createDestination(customName.trim(), addingPlace.drivingDistance, addingPlace.bikingDistance);
      await refreshDestinations();
      setAddingPlace(null);
      setCustomName('');
      clearResults();
      setPlaceSearchQuery('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save destination');
    }
  };

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
          <label htmlFor="placesApiKey">
            Google Places API Key {hasPlacesApiKey && <span style={{ color: '#2e7d32' }}>(configured)</span>}
          </label>
          <input
            type="password"
            id="placesApiKey"
            value={placesApiKey}
            onChange={e => setPlacesApiKey(e.target.value)}
            placeholder={hasPlacesApiKey ? 'Leave blank to keep current' : 'Enter your Google Places API key'}
          />
          <small>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
              Get an API key from Google Cloud Console
            </a>
            {' '}(enable Places API)
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

      <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />

      <h3>Destinations</h3>
      <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
        Add common destinations to quickly select when logging rides.
      </p>

      {destinations.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {destinations.map(dest => (
            <div
              key={dest.id}
              style={{
                padding: '10px',
                background: '#f9f9f9',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            >
              {editingDest === dest.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Name"
                    style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: '#666' }}>🚗 Driving (mi)</label>
                      <input
                        type="number"
                        value={editDrivingDist}
                        onChange={e => setEditDrivingDist(e.target.value)}
                        step="0.1"
                        style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: '#666' }}>🚴 Biking (mi)</label>
                      <input
                        type="number"
                        value={editBikingDist}
                        onChange={e => setEditBikingDist(e.target.value)}
                        step="0.1"
                        style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>{dest.title}</strong>
                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                      🚗 {dest.distance} mi {dest.biking_distance && `| 🚴 ${dest.biking_distance} mi`}
                    </span>
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                      onClick={() => handleEditDestination(dest)}
                      title="Edit destination"
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteDestination(dest.id)}
                      title="Delete destination"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasPlacesApiKey && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>Search for a place</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={placeSearchQuery}
              onChange={e => setPlaceSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handlePlaceSearch())}
              placeholder="Search (e.g., Lowes, Target...)"
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePlaceSearch}
              disabled={searchLoading || !placeSearchQuery.trim()}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {locationError && <div className="error" style={{ marginBottom: '10px' }}>{locationError}</div>}
          {searchError && <div className="error" style={{ marginBottom: '10px' }}>{searchError}</div>}

          {places.length > 0 && !addingPlace && (
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto' }}>
              {places.map((place, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderBottom: idx < places.length - 1 ? '1px solid #eee' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong>{place.name}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>{place.address}</div>
                    <div style={{ fontSize: '12px', color: '#2e7d32' }}>
                      🚗 {place.drivingDistance} mi | 🚴 {place.bikingDistance} mi
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    onClick={() => handleAddPlace(place)}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {addingPlace && (
            <div style={{ padding: '15px', background: '#f9f9f9', borderRadius: '4px' }}>
              <p style={{ marginBottom: '10px' }}>
                Adding: <strong>{addingPlace.name}</strong>
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                  (🚗 {addingPlace.drivingDistance} mi | 🚴 {addingPlace.bikingDistance} mi)
                </span>
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Save as..."
                  style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  autoFocus
                />
                <button type="button" className="btn btn-primary" onClick={handleSavePlace}>
                  Save
                </button>
                <button type="button" className="btn" onClick={() => setAddingPlace(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>Or add manually</h4>
      <form onSubmit={handleAddDestination} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={newDestTitle}
          onChange={e => setNewDestTitle(e.target.value)}
          placeholder="Destination name"
          style={{ flex: '2', minWidth: '150px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        />
        <input
          type="number"
          value={newDestDistance}
          onChange={e => setNewDestDistance(e.target.value)}
          placeholder="Distance (mi)"
          step="0.1"
          style={{ flex: '1', minWidth: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={addingDest}>
          {addingDest ? 'Adding...' : 'Add'}
        </button>
      </form>
    </div>
  );
}
