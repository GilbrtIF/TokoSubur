const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`Tokosubur API berjalan pada port ${port}`);
});