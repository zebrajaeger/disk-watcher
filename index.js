#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const nodemailer = require('nodemailer');
const path = require('path');
const { exec } = require('child_process');
const cron = require('node-cron');
const dayjs = require('dayjs');
const yargs = require('yargs');

const argv = yargs
  .option('config', {
    alias: 'c',
    describe: 'Path to config file',
    type: 'string',
    default: path.join(process.cwd(), 'config.json'),
  })
  .option('logfile', {
    alias: 'l',
    describe: 'Path to log file',
    type: 'string',
    default: path.join(process.cwd(), 'disk-monitor.log'),
  })
  .help()
  .alias('help', 'h')
  .argv;

const configPath = argv.config;
const logFilePath = argv.logfile;

if (!fs.existsSync(configPath)) {
  log('Config file not found. Please create a config.json file.', 'ERROR');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Default mail configuration
const defaultMailConfig = {
  host: 'localhost',
  port: 25,
  security: false,
  username: '',
  password: ''
};

const mailConfig = { ...defaultMailConfig, ...config.mail };

// Mail transporter setup
const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  secure: mailConfig.security,
  auth: mailConfig.username && mailConfig.password ? {
    user: mailConfig.username,
    pass: mailConfig.password,
  } : undefined,
});

// Logging function with timestamp and priority
function log(message, priority = 'INFO') {
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `[${timestamp}] [${priority}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFilePath, logMessage + '\n');
}

// Function to send an email
async function sendEmail(subject, message) {
  const mailOptions = {
    from: mailConfig.from,
    to: mailConfig.to,
    subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    log(`Alert sent: ${subject}`, 'INFO');
  } catch (error) {
    log(`Failed to send email: ${error.message}`, 'ERROR');
  }
}

// Function to check disk usage
function checkDisk(laufwerk) {
  return new Promise((resolve, reject) => {
    exec(`df -k --output=pcent,avail ${laufwerk}`, (err, stdout, stderr) => {
      if (err || stderr) {
        return reject(`Error checking disk: ${err || stderr}`);
      }

      const lines = stdout.trim().split('\n');
      if (lines.length < 2) {
        return reject(`Unexpected df output: ${stdout}`);
      }

      const [percentUsed, freeSpaceKb] = lines[1].trim().split(/\s+/);
      const used = parseInt(percentUsed.replace('%', ''), 10);
      const freeSpace = parseInt(freeSpaceKb, 10) * 1024; // Convert KB to bytes

      resolve({ used, freeSpace });
    });
  });
}

// Main monitoring function
function startMonitoring() {
  config.laufwerke.forEach((laufwerkConfig) => {
    const { laufwerkspfad, maxFuellgrad, minFreierSpeicher, cronIntervall, alarmIntervall } = laufwerkConfig;

    let lastAlertTime = null;

    cron.schedule(cronIntervall, async () => {
      try {
        const { used, freeSpace } = await checkDisk(laufwerkspfad);

        const minFreeBytes = parseSizeToBytes(minFreierSpeicher);
        if (used > maxFuellgrad || freeSpace < minFreeBytes) {
          const now = dayjs();
          if (!lastAlertTime || now.diff(lastAlertTime, 'millisecond') >= dayjs.duration(alarmIntervall).asMilliseconds()) {
            const subject = `Disk Alert: ${laufwerkspfad}`;
            const message = `Disk ${laufwerkspfad} exceeds limits:\n\n` +
              `Max Fill Level: ${maxFuellgrad}%\nCurrent Fill Level: ${used}%\n` +
              `Min Free Space: ${minFreierSpeicher}\nCurrent Free Space: ${(freeSpace / (1024 ** 3)).toFixed(2)} GB`;

            await sendEmail(subject, message);
            lastAlertTime = now;
          }
        }
      } catch (error) {
        log(`Error monitoring ${laufwerkspfad}: ${error}`, 'ERROR');
      }
    });
  });
}

// Function to parse size strings like "10GB", "500MB" to bytes
function parseSizeToBytes(size) {
  const units = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  const match = size.match(/(\d+)(KB|MB|GB|TB)/i);
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }
  const [, value, unit] = match;
  return parseInt(value, 10) * (units[unit.toUpperCase()] || 0);
}

// Start monitoring
log('Starting disk monitoring...', 'INFO');
startMonitoring();
