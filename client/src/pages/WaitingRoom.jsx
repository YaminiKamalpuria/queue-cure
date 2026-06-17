import { useState, useEffect } from 'react';
import { socket } from '../socket';
import TokenLookup from '../components/TokenLookup';

export default function WaitingRoom() {
  const [queueState, setQueueState] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

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

  const estWait = queueState
    ? queueState.waitingCount * queueState.avgConsultationTime
    : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Patient Waiting Room</h1>
        <span style={{ fontSize: '0.8rem', color: connected ? '#276749' : '#c53030', display: 'flex', alignItems: 'center' }}>
          <span className={`conn-dot ${connected ? 'online' : 'offline'}`} />
          {connected ? 'Live' : 'Reconnecting...'}
        </span>
      </div>

      {/* Now Serving */}
      <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div className="token-label">Now Serving</div>
        {queueState?.currentToken ? (
          <>
            <div className="token-big">{queueState.currentToken}</div>
            <div style={{ marginTop: 8, color: '#4a5568', fontSize: '0.95rem' }}>
              {queueState.currentName}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '1.2rem', color: '#a0aec0', marginTop: 8 }}>
            Waiting to start
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-num">{queueState?.waitingCount ?? '—'}</div>
          <div className="stat-lbl">Patients Waiting</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{queueState?.avgConsultationTime ?? '—'}</div>
          <div className="stat-lbl">Avg Min / Patient</div>
        </div>
        <div className="stat-box" style={{ background: '#fffff0' }}>
          <div className="stat-num" style={{ color: '#b7791f' }}>{estWait}</div>
          <div className="stat-lbl">Est. Total Wait (min)</div>
        </div>
      </div>

      {/* Up Next */}
      {queueState?.nextTokens?.length > 0 && (
        <div className="card">
          <h2>Up Next</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {queueState.nextTokens.map((p, i) => (
              <div key={p.token} style={{
                background: i === 0 ? '#ebf4ff' : '#f7fafc',
                borderRadius: 8,
                padding: '12px 18px',
                border: `1px solid ${i === 0 ? '#90cdf4' : '#e2e8f0'}`,
                minWidth: 100,
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 700, color: '#2b6cb0', fontSize: '1.1rem' }}>{p.token}</div>
                <div style={{ fontSize: '0.78rem', color: '#718096', marginTop: 2 }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token Lookup */}
      <TokenLookup avgTime={queueState?.avgConsultationTime} />
    </div>
  );
}