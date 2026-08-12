const { createClient } = require('@libsql/client/http');
const fs = require('fs');

const db = createClient({
  url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

const reportFile = 'sync_30min_test_report.txt';
fs.writeFileSync(reportFile, `=== 30-MINUTE LIVE SYNC MONITORING REPORT ===\nStarted at: ${new Date().toLocaleString()}\n\n`);

function logReport(msg) {
  const time = new Date().toLocaleTimeString();
  const entry = `[${time}] ${msg}\n`;
  console.log(entry.trim());
  fs.appendFileSync(reportFile, entry);
}

let checksCompleted = 0;
const totalChecks = 6; // 6 checks * 5 minutes = 30 minutes

async function checkSyncHealth() {
  checksCompleted++;
  logReport(`--- CHECK #${checksCompleted} of ${totalChecks} ---`);
  try {
    const statusRes = await db.execute('SELECT * FROM sync_status');
    for (const r of statusRes.rows) {
      logReport(`Instance ${r.id}: Status=${r.message} | LastSuccess=${r.last_success} | FailCount=${r.fail_count}`);
    }

    const logsRes = await db.execute('SELECT * FROM sync_logs ORDER BY id DESC LIMIT 4');
    logReport(`Latest 4 Logs:`);
    for (const l of logsRes.rows) {
      logReport(`  - ID:${l.id} | Event:${l.event} | Details:${l.details} | Time:${l.timestamp}`);
    }
  } catch (err) {
    logReport(`Error querying database: ${err.message}`);
  }

  if (checksCompleted >= totalChecks) {
    logReport(`\n=== 30-MINUTE MONITORING COMPLETE ===\nAll checks finished successfully.`);
    process.exit(0);
  }
}

// Initial check immediately
checkSyncHealth();

// Repeat every 5 minutes (300,000 ms)
setInterval(checkSyncHealth, 5 * 60 * 1000);
