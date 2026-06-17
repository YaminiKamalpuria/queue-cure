import { useState, useEffect } from 'react';
import { socket } from '../socket';

export default function Receptionist() {
  const [queueState, setQueueState] = useState(null);
  const [name, setName] = useState('');
  const [avgInput, setAvgInput] = useState('');
  const [connected, setConnected] = useState(socket.connected);
  const [msg, setMsg] = useState(null); // { type, text }
  const [lastToken, setLastToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('queue:state', (state) => setQueueState(state));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('queue:state');
    };
  }, []);

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  }

  function handleAddPatient(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    socket.emit('patient:add', { name: name.trim() }, (res) => {
      setLoading(false);
      if (res?.success) {
        setLastToken(res.token);
        flash('success', `Token ${res.token} assigned to ${name.trim()}`);
        setName('');
      } else {
        flash('error', res?.error || 'Failed to add patient');
      }
    });
  }

  function handleCallNext() {
    socket.emit('queue:next', null, (res) => {
      if (res?.token) {
        flash('success', `Now calling: ${res.token}`);
      } else {
        flash('info', 'Queue is empty — no more patients waiting.');
      }
    });
  }

  function handleSetAvgTime(e) {
    e.preventDefault();
    if (!avgInput) return;
    socket.emit('avgTime:set', { minutes: Number(avgInput) }, (res) => {
      if (res?.success) {
        flash('success', `Average consultation time set to ${avgInput} min`);
        setAvgInput('');
      } else {
        flash('error', res?.error || 'Invalid time');
      }
    });
  }

  function handleReset() {
    if (!window.confirm('Reset the entire queue? This cannot be undone.')) return;
    socket.emit('queue:reset', null, () => {
      flash('success', 'Queue has been reset.');
      setLastToken(null);
    });
  }

  const waitingPatients = queueState?.patients?.filter(p => p.status === 'waiting') || [];
  const donePatientsCount = queueState?.patients?.filter(p => p.status === 'done').length || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Receptionist Dashboard</h1>
        <span style={{ fontSize: '0.8rem', color: connected ? '#276749' : '#c53030', display: 'flex', alignItems: 'center' }}>
          <span className={`conn-dot ${connected ? 'online' : 'offline'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-num">{queueState?.waitingCount ?? '—'}</div>
          <div className="stat-lbl">Waiting</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{donePatientsCount}</div>
          <div className="stat-lbl">Served today</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{queueState?.avgConsultationTime ?? '—'}</div>
          <div className="stat-lbl">Avg min/patient</div>
        </div>
        <div className="stat-box" style={{ background: queueState?.currentToken ? '#c6f6d5' : '#e2e8f0' }}>
          <div className="stat-num" style={{ color: queueState?.currentToken ? '#276749' : '#a0aec0', fontSize: '1.8rem' }}>
            {queueState?.currentToken ?? 'None'}
          </div>
          <div className="stat-lbl">Now serving</div>
        </div>
      </div>

      {/* Add Patient */}
      <div className="card">
        <h2>Add Patient</h2>
        <form className="input-row" onSubmit={handleAddPatient}>
          <input
            type="text"
            placeholder="Patient name"
            value={name}
            maxLength={60}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Adding...' : 'Add & Assign Token'}
          </button>
        </form>
        {lastToken && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="token-label">Last token issued:</span>
            <span className="token-big" style={{ fontSize: '2rem' }}>{lastToken}</span>
          </div>
        )}
      </div>

      {/* Call Next + Set Avg Time */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 220 }}>
          <h2>Call Next Patient</h2>
          <button
            className="btn btn-success"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleCallNext}
            disabled={waitingPatients.length === 0}
          >
            ▶ Call Next
          </button>
          {waitingPatients.length === 0 && (
            <p style={{ marginTop: 10, fontSize: '0.8rem', color: '#718096' }}>No patients waiting.</p>
          )}
        </div>

        <div className="card" style={{ flex: 1, minWidth: 220 }}>
          <h2>Set Avg Consultation Time</h2>
          <form className="input-row" onSubmit={handleSetAvgTime}>
            <input
              type="number"
              placeholder="Minutes (1–120)"
              value={avgInput}
              min={1}
              max={120}
              onChange={e => setAvgInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={!avgInput}>
              Set
            </button>
          </form>
        </div>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`msg msg-${msg.type}`}>{msg.text}</div>
      )}

      {/* Queue Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ marginBottom: 0 }}>Current Queue</h2>
          <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={handleReset}>
            Reset Queue
          </button>
        </div>
        {!queueState?.patients?.length ? (
          <p style={{ color: '#718096', fontSize: '0.875rem' }}>Queue is empty.</p>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {queueState.patients.map(p => (
                <tr key={p.token}>
                  <td><strong>{p.token}</strong></td>
                  <td>{p.name}</td>
                  <td>
                    <span className={
                      p.status === 'serving' ? 'badge badge-green' :
                      p.status === 'waiting' ? 'badge badge-blue' :
                      'badge badge-gray'
                    }>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}