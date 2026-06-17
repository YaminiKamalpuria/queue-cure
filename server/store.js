const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, 'store.json');

const DEFAULT_STATE = {
  patients: [],
  avgConsultationTime: 10,
  tokenCounter: 1
};

function load() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Store read error:', err.message);
  }
  return { ...DEFAULT_STATE };
}

function save(state) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Store write error:', err.message);
  }
}

module.exports = { load, save };