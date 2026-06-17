import { useState } from 'react';
import { socket } from '../socket';

export default function TokenLookup({ avgTime }) {
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleLookup(e) {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    socket.emit('token:lookup', { token: token.trim().toUpperCase() }, (res) => {
      setLoading(false);
      setResult(res);
    });
  }

  return (
    <div className="card">
      <h2>Check Your Token</h2>
      <form className="input-row" onSubmit={handleLookup}>
        <input
          type="text"
          placeholder="Enter your token (e.g. Q001)"
          value={token}
          maxLength={6}
          onChange={e => setToken(e.target.value.toUpperCase())}
        />
        <button type="submit" className="btn btn-outline" disabled={loading || !token.trim()}>
          {loading ? 'Checking...' : 'Check Wait'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 14 }}>
          {!result.found ? (
            <div className="msg msg-error">Token not found. Please check your token number.</div>
          ) : result.status === 'done' ? (
            <div className="msg msg-success">✓ Your consultation is complete. Thank you!</div>
          ) : result.status === 'serving' ? (
            <div className="msg msg-success">🟢 You are currently being seen by the doctor!</div>
          ) : (
            <div className="msg msg-info">
              <strong>Position in queue: {result.position}</strong><br />
              Patients ahead of you: {result.tokensAhead}<br />
              Estimated wait: <strong>{result.waitMinutes} minutes</strong>
              {avgTime && <span style={{ color: '#4a5568', fontSize: '0.8rem' }}> (based on {avgTime} min avg per patient)</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}