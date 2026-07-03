// Thin entrypoint — the express app lives in app.js so tests can import it
// without binding a port.
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio API running on port ${PORT}`);
});
