const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./database');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

connectDB();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/businesses', require('./routes/business'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => res.send('Hello Appointly'));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
