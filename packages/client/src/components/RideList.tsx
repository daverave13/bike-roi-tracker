import { useState } from 'react';
import { useRides, Ride } from '../hooks/useApi';

interface Props {
  onRefreshStats: () => void;
}

export function RideList({ onRefreshStats }: Props) {
  const { rides, loading, error, updateRide, deleteRide } = useRides();
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    distance: '',
    gas_price: '',
    weather: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleEdit = (ride: Ride) => {
    setEditingRide(ride);
    setEditForm({
      date: ride.date,
      distance: String(ride.distance),
      gas_price: String(ride.gas_price),
      weather: ride.weather || '',
      notes: ride.notes || '',
    });
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

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this ride?')) return;
    try {
      await deleteRide(id);
      onRefreshStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
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
          <table>
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
                  <td>{new Date(ride.date + 'T00:00:00').toLocaleDateString()}</td>
                  <td>{ride.distance} mi</td>
                  <td>${ride.gas_price.toFixed(2)}</td>
                  <td><strong>${ride.savings.toFixed(2)}</strong></td>
                  <td>{ride.weather || '-'}</td>
                  <td>{ride.notes || '-'}</td>
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
                      onClick={() => handleDelete(ride.id)}
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
    </>
  );
}
