const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS only for development purposes
const cors = require('cors');
app.use(cors());

app.use("/api", require('./router'));

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})