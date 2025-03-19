const express = require('express');
const apiHandler = require('./api/index.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Use the same handler for all routes
app.all('*', apiHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
