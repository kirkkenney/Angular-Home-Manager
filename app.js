const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('./config/database');

// Connected to Mongo database and log success/failed status
mongoose.connect(config.database);
mongoose.connection.on('connected', () => {
    console.log(`Connected to database ${config.database}`)
})
mongoose.connection.on('error', (err) => {
    console.log(`Database connection error: ${err}`)
})

// Basic app config and init settings
const app = express();
const users = require('./routes/users');
const homeGroups = require('./routes/home-groups');
const port = 3000;
app.use(cors());

// register static content folder
app.use(express.static(path.join(__dirname, 'public')));

// register body-parser middleware
app.use(bodyParser.json());

// register passport middleware
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

// configure all Users routes to automatically redirect to ../users/<route>
app.use('/users', users);

app.use('/home-groups', homeGroups);

app.get('/', (req, res) => {
    res.send('Server live')
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
})