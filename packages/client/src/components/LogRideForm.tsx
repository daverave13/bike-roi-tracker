import { useState, useEffect } from "react";
import { useRides, useGasPrice, useSettings, usePin } from "../hooks/useApi";

interface Props {
  onSuccess: () => void;
}

function getLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function LogRideForm({ onSuccess }: Props) {
  const { createRide } = useRides();
  const {
    price,
    loading: priceLoading,
    error: priceError,
    fetchPrice,
  } = useGasPrice();
  const { settings } = useSettings();
  const { unlocked, verifyPin, checkRequired } = usePin();

  const [pinRequired, setPinRequired] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [date, setDate] = useState(getLocalDateString());
  const [distance, setDistance] = useState("");
  const [gasPrice, setGasPrice] = useState("");
  const [weather, setWeather] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkRequired().then((required) => setPinRequired(required));
  }, [checkRequired]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);
    const valid = await verifyPin(pinInput);
    if (!valid) {
      setPinError(true);
    }
  };

  const handleFetchPrice = async () => {
    const fetchedPrice = await fetchPrice(date);
    if (fetchedPrice && typeof fetchedPrice === "number") {
      setGasPrice(fetchedPrice.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      await createRide({
        date,
        distance: distance ? parseFloat(distance) : undefined,
        gas_price: gasPrice ? parseFloat(gasPrice) : undefined,
        weather: weather || undefined,
        notes: notes || undefined,
      });
      setSuccess(true);
      setDistance("");
      setGasPrice("");
      setWeather("");
      setNotes("");
      setDate(getLocalDateString());
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log ride");
    } finally {
      setSubmitting(false);
    }
  };

  // Show PIN prompt if required and not unlocked
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
            <label htmlFor="pin">PIN</label>
            <input
              type="password"
              id="pin"
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

  return (
    <div className="card">
      <h2>Log a Ride</h2>
      {success && <div className="success">Ride logged successfully!</div>}
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="distance">
            Distance (miles) - default: {settings?.default_distance || "26"}
          </label>
          <input
            type="number"
            id="distance"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder={settings?.default_distance || "26"}
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="gasPrice">
            Gas Price ($/gallon){" "}
            <button
              type="button"
              onClick={handleFetchPrice}
              disabled={priceLoading}
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                marginLeft: "10px",
              }}
            >
              {priceLoading ? "Fetching..." : `Fetch Price (${date})`}
            </button>
          </label>
          <input
            type="number"
            id="gasPrice"
            value={gasPrice}
            onChange={(e) => setGasPrice(e.target.value)}
            placeholder="Enter price or fetch current"
            step="0.01"
            required
          />
          {priceError && (
            <small style={{ color: "#d32f2f" }}>{priceError}</small>
          )}
          {typeof price === "number" && !gasPrice && (
            <small
              style={{
                color: "#2e7d32",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => setGasPrice(price.toFixed(2))}
            >
              Current price: ${price.toFixed(2)} - click to use
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="weather">Weather (optional)</label>
          <select
            id="weather"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
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
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="How was the ride?"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Logging..." : "Log Ride"}
        </button>
      </form>
    </div>
  );
}
