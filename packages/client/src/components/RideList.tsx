import { useState } from 'react';
import { useRides, usePin, Ride } from '../hooks/useApi';

interface Props {
  onRefreshStats: () => void;
}

export function RideList({ onRefreshStats }: Props) {
  const { rides, loading, error, updateRide, deleteRide } = useRides();
  const { unlocked, verifyPin, checkRequired } = usePin();
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    distance: '',
    gas_price: '',
    weather: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete'; ride: Ride } | null>(null);

  const requirePin = async (action: { type: 'edit' | 'delete'; ride: Ride }) => {
    const required = await checkRequired();
    if (required && !unlocked) {
      setPendingAction(action);
      setShowPinPrompt(true);
      setPinInput('');
      setPinError(false);
      return false;
    }
    return true;
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);
    const valid = await verifyPin(pinInput);
    if (valid) {
      setShowPinPrompt(false);
      if (pendingAction?.type === 'edit') {
        doEdit(pendingAction.ride);
      } else if (pendingAction?.type === 'delete') {
        doDelete(pendingAction.ride.id);
      }
      setPendingAction(null);
    } else {
      setPinError(true);
    }
  };

  const doEdit = (ride: Ride) => {
    setEditingRide(ride);
    setEditForm({
      date: ride.date,
      distance: String(ride.distance),
      gas_price: String(ride.gas_price),
      weather: ride.weather || '',
      notes: ride.notes || '',
    });
  };

  const handleEdit = async (ride: Ride) => {
    if (await requirePin({ type: 'edit', ride })) {
      doEdit(ride);
    }
  };

  const handleSave = async () => {
    if (!editingRide) return;
    setSaving(true);
    try {
      await updateRide(editingRide.id, {
        date: editForm.date,
        distance: parseFloat(editForm.distance),
        gas_price: parseFloat(editForm.gas_price),
        weather: editForm.weather || null,
        notes: editForm.notes || null,
      });
      setEditingRide(null);
      onRefreshStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: number) => {
    if (!confirm('Delete this ride?')) return;
    try {
      await deleteRide(id);
      onRefreshStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleDelete = async (ride: Ride) => {
    if (await requirePin({ type: 'delete', ride })) {
      doDelete(ride.id);
    }
  };

  if (loading) return <div className="card">Loading rides...</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <>
      <div className="card">
        <h2>Ride History</h2>
        {rides.length === 0 ? (
          <div className="empty-state">
            <p>No rides logged yet. Log your first bike commute!</p>
          </div>
        ) : (
          <table className="ride-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Distance</th>
                <th>Gas Price</th>
                <th>Saved</th>
                <th>Weather</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rides.map(ride => (
                <tr key={ride.id}>
                  <td data-label="Date">{new Date(ride.date + 'T00:00:00').toLocaleDateString()}</td>
                  <td data-label="Distance">{ride.distance} mi</td>
                  <td data-label="Gas Price">${ride.gas_price.toFixed(2)}</td>
                  <td data-label="Saved"><strong>${ride.savings.toFixed(2)}</strong></td>
                  <td data-label="Weather">{ride.weather || '-'}</td>
                  <td data-label="Notes">{ride.notes || '-'}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(ride)}
                      title="Edit ride"
                    >
                      ✎
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(ride)}
                      title="Delete ride"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingRide && (
        <div className="modal-overlay" onClick={() => setEditingRide(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Ride</h3>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={editForm.date}
                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Distance (miles)</label>
              <input
                type="number"
                step="0.1"
                value={editForm.distance}
                onChange={e => setEditForm({ ...editForm, distance: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Gas Price ($/gallon)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.gas_price}
                onChange={e => setEditForm({ ...editForm, gas_price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Weather</label>
              <select
                value={editForm.weather}
                onChange={e => setEditForm({ ...editForm, weather: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="Sunny">Sunny</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Overcast">Overcast</option>
                <option value="Light Rain">Light Rain</option>
                <option value="Rainy">Rainy</option>
                <option value="Windy">Windy</option>
                <option value="Cold">Cold</option>
                <option value="Hot">Hot</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setEditingRide(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPinPrompt && (
        <div className="modal-overlay" onClick={() => setShowPinPrompt(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Enter PIN</h3>
            {pinError && <div className="error">Incorrect PIN</div>}
            <form onSubmit={handlePinSubmit}>
              <div className="form-group">
                <label>PIN</label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="Enter PIN"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowPinPrompt(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
