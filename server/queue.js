const { load, save } = require('./store');

let state = load();

function addPatient(name) {
  const token = `Q${String(state.tokenCounter).padStart(3, '0')}`;
  state.tokenCounter += 1;
  state.patients.push({ token, name: name.trim(), status: 'waiting' });
  save(state);
  return token;
}

function callNext() {
  // Mark current serving patient as done
  const serving = state.patients.find(p => p.status === 'serving');
  if (serving) serving.status = 'done';

  // Find next waiting patient
  const next = state.patients.find(p => p.status === 'waiting');
  if (next) {
    next.status = 'serving';
    save(state);
    return next.token;
  }

  save(state);
  return null; // queue is empty
}

function setAvgTime(minutes) {
  const mins = parseInt(minutes, 10);
  if (isNaN(mins) || mins < 1 || mins > 120) return false;
  state.avgConsultationTime = mins;
  save(state);
  return true;
}

function lookupToken(token) {
  const patient = state.patients.find(
    p => p.token === token.toUpperCase().trim()
  );

  if (!patient) return { found: false };

  if (patient.status === 'done') {
    return { found: true, status: 'done', position: 0, waitMinutes: 0 };
  }

  if (patient.status === 'serving') {
    return { found: true, status: 'serving', position: 0, waitMinutes: 0 };
  }

  // Count waiting patients ahead of this token
  const waitingList = state.patients.filter(p => p.status === 'waiting');
  const myIndex = waitingList.findIndex(p => p.token === token.toUpperCase().trim());
  const tokensAhead = myIndex; // 0-indexed = exact count ahead

  // If someone is being served right now, assume half their time is remaining
  const hasServing = state.patients.some(p => p.status === 'serving');
  const servingBonus = hasServing
    ? Math.ceil(state.avgConsultationTime / 2)
    : 0;

  const waitMinutes = tokensAhead * state.avgConsultationTime + servingBonus;

  return {
    found: true,
    status: 'waiting',
    position: myIndex + 1,
    tokensAhead,
    waitMinutes
  };
}

function getPublicState() {
  const serving = state.patients.find(p => p.status === 'serving');
  const waitingList = state.patients.filter(p => p.status === 'waiting');

  return {
    currentToken: serving ? serving.token : null,
    currentName: serving ? serving.name : null,
    waitingCount: waitingList.length,
    avgConsultationTime: state.avgConsultationTime,
    patients: state.patients,
    nextTokens: waitingList.slice(0, 3).map(p => ({ token: p.token, name: p.name }))
  };
}

function resetQueue() {
  state = {
    patients: [],
    avgConsultationTime: state.avgConsultationTime,
    tokenCounter: 1
  };
  save(state);
}

module.exports = { addPatient, callNext, setAvgTime, lookupToken, getPublicState, resetQueue };