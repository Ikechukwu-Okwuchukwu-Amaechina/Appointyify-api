const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./database');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', require('./routes/auth'));

app.get('/', (req, res) => res.send('Hello Appointly'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
