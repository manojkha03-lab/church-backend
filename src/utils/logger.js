const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const getTimestamp = () => new Date().toISOString();

exports.info = (message, data = {}) => {
  const log = `[${getTimestamp()}] INFO: ${message}`;
  console.log(log, data);
  appendToFile('info.log', log, data);
};

exports.error = (message, error = {}) => {
  const log = `[${getTimestamp()}] ERROR: ${message}`;
  console.error(log, error);
  appendToFile('error.log', log, error);
};

exports.warn = (message, data = {}) => {
  const log = `[${getTimestamp()}] WARN: ${message}`;
  console.warn(log, data);
  appendToFile('warn.log', log, data);
};

exports.requestLog = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`;
    console.log(log);
    appendToFile('requests.log', log);
  });
  next();
};

const appendToFile = (filename, message, data = {}) => {
  const filepath = path.join(logsDir, filename);
  const content = data && Object.keys(data).length > 0 
    ? `${message} ${JSON.stringify(data)}\n`
    : `${message}\n`;
  
  fs.appendFile(filepath, content, (err) => {
    if (err) console.error(`Failed to write to ${filename}:`, err);
  });
};