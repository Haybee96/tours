const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! 💥️ Shutting down application..........');
  process.exit(1);
});

// Read the config file
dotenv.config({ path: './config.env' });

const app = require('./app');

// Connect to the database with mongoose by replacing database passord from the config file
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connect to database with mongoose
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'));

// Set the port of your localhost
const port = process.env.PORT || 8000;

// Listen to the port
const server = app.listen(port, () => {
  console.log(
    `App running on ${process.env.NODE_ENV} mode on port ${port}......`
  );
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLER REJECTION! 💥️ Shutting down application..........');
  server.close(() => {
    process.exit(1);
  });
});
