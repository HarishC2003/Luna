import fs from 'fs';

// Helpers for logging
const log = {
  info: (msg) => console.log(`[INFO] [${new Date().toISOString()}] ${msg}`),
  warn: (msg) => console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`),
  error: (msg) => console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`),
  debug: (msg) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${msg}`);
    }
  }
};

// Markdown summary writer helper
function writeSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    try {
      fs.appendFileSync(summaryPath, markdown + '\n');
      log.debug(`Successfully wrote to GITHUB_STEP_SUMMARY`);
    } catch (_err) {
      log.error(`Failed to write to GITHUB_STEP_SUMMARY: ${_err.message}`);
    }
  } else {
    log.info(`GITHUB_STEP_SUMMARY not defined. Summary content:\n${markdown}`);
  }
}

async function run() {
  log.info("Starting production cron worker trigger...");
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lunalife.app';
  const cronSecret = process.env.CRON_SECRET || 'luna_super_secret_cron_token_2026';
  
  // 1. Validation of required environment variables
  if (!appUrl) {
    const errorMsg = "Missing required environment variable: NEXT_PUBLIC_APP_URL";
    log.error(errorMsg);
    writeSummary(`### ❌ Execution Failed\n\n**Error:** ${errorMsg}`);
    process.exit(1);
  }
  
  if (!cronSecret) {
    const errorMsg = "Missing required environment variable: CRON_SECRET";
    log.error(errorMsg);
    writeSummary(`### ❌ Execution Failed\n\n**Error:** ${errorMsg}`);
    process.exit(1);
  }
  
  let parsedUrl;
  try {
    parsedUrl = new URL(appUrl);
  } catch (_err) {
    const errorMsg = `Invalid NEXT_PUBLIC_APP_URL format: "${appUrl}". Must be a valid absolute URL (e.g., https://lunalife.app)`;
    log.error(errorMsg);
    writeSummary(`### ❌ Execution Failed\n\n**Error:** ${errorMsg}`);
    process.exit(1);
  }

  const triggerUrl = `${parsedUrl.origin}/api/cron/daily`;
  log.info(`Target endpoint configured: ${triggerUrl}`);
  
  // 2. Health check / availability check (using DNS resolve or simple TCP/HTTP test)
  log.info("Verifying network availability of target host...");
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10s check timeout
    const testRes = await fetch(parsedUrl.origin, { method: 'HEAD', signal: controller.signal });
    clearTimeout(id);
    log.info(`Host availability confirmed. HTTP Status: ${testRes.status}`);
  } catch (_err) {
    log.warn(`Host health check warning: ${_err.message}. Proceeding with trigger call regardless.`);
  }

  // 3. Trigger endpoint with retries and exponential backoff
  const maxAttempts = 5;
  let attempt = 0;
  let success = false;
  let responseData = null;
  let lastError = null;
  let status = 0;

  while (attempt < maxAttempts && !success) {
    attempt++;
    log.info(`Trigger attempt ${attempt} of ${maxAttempts}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s trigger timeout
    
    try {
      const start = Date.now();
      const res = await fetch(triggerUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Accept': 'application/json'
        },
        redirect: 'error',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      status = res.status;
      
      const duration = Date.now() - start;
      log.info(`Attempt ${attempt} response status: ${status} (took ${duration}ms)`);
      
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          log.warn(`Response was not application/json: ${contentType}`);
          lastError = new Error(`Expected JSON response, got: ${contentType}`);
        } else {
          const text = await res.text();
          log.debug(`Attempt ${attempt} raw response: ${text}`);
          try {
            responseData = JSON.parse(text);
            success = true;
          } catch (jsonErr) {
            log.warn(`Response was not valid JSON: ${text.substring(0, 200)}`);
            lastError = jsonErr instanceof Error ? jsonErr : new Error(String(jsonErr));
          }
        }
      } else {
        const text = await res.text();
        log.warn(`Attempt ${attempt} failed with status ${status}: ${text.substring(0, 200)}`);
        lastError = new Error(`HTTP status ${status}`);
        
        // If it's a 401/403 (unauthorized/forbidden) or 400, it's a client/secret config issue. Retrying won't help.
        if (status === 401 || status === 403 || status === 400) {
          log.error(`Critical configuration error: Received status ${status}. Aborting retries.`);
          break;
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      log.warn(`Attempt ${attempt} network/timeout error: ${lastError.message}`);
    }
    
    if (!success && attempt < maxAttempts) {
      const backoffSec = Math.pow(2, attempt); // 2s, 4s, 8s, 16s
      log.info(`Waiting ${backoffSec} seconds before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, backoffSec * 1000));
    }
  }

  // 4. Report and Summary Generation
  const timestamp = new Date().toISOString();
  
  if (success && responseData) {
    log.info("Cron job completed successfully!");
    log.info(`Response details: ${JSON.stringify(responseData)}`);
    
    const summary = `
### 🚀 Luna Daily Cron Execution Success
- **Timestamp:** \`${timestamp}\`
- **Trigger URL:** \`${triggerUrl}\`
- **Total Attempts:** \`${attempt}\`
- **HTTP Status:** \`${status}\`

#### 📊 Notification Dispatch Statistics
- **Period Reminders:** \`${responseData.results?.periodReminders ?? 0}\`
- **Fertile Alerts:** \`${responseData.results?.fertileAlerts ?? 0}\`
- **Check-in Reminders:** \`${responseData.results?.checkinReminders ?? 0}\`
- **Streak Protection Alerts:** \`${responseData.results?.streakAtRisk ?? 0}\`
- **Hydration Reminders:** \`${responseData.results?.hydrationReminders ?? 0}\`
- **Weekly Insights:** \`${responseData.results?.weeklyInsights ?? 0}\`
`;
    writeSummary(summary);
    process.exit(0);
  } else {
    log.error(`Cron trigger execution failed after ${attempt} attempts.`);
    if (lastError) {
      log.error(`Last error encountered: ${lastError.message}`);
    }
    
    // Check if this is a transient network/HTTP failure (like 502 Bad Gateway, 504 Gateway Timeout, network down)
    // For transient failures, we exit 0 to prevent GitHub spam emails. The next scheduled run (in 15m) will retry.
    // If it's a permanent config error (e.g. 401 Unauthorized, 404 Not Found), we exit 1 to raise alert because it requires human fixing.
    const isTransient = status === 502 || status === 503 || status === 504 || (lastError && (lastError.name === 'AbortError' || lastError.message.includes('fetch') || lastError.message.includes('network')));
    
    const statusMsg = status ? `HTTP status ${status}` : "Network failure / Timeout";
    const recoveryAction = isTransient 
      ? "No action required. This is a transient network/API issue. The workflow will retry automatically on the next scheduled execution in 15 minutes." 
      : "Immediate configuration audit required. Check your repo secrets and server status.";

    const summary = `
### ⚠️ Luna Daily Cron Trigger Warning / Failure
- **Timestamp:** \`${timestamp}\`
- **Trigger URL:** \`${triggerUrl}\`
- **Status:** \`${statusMsg}\`
- **Attempts Made:** \`${attempt}\`
- **Error Details:** \`${lastError ? lastError.message : 'Unknown'}\`
- **Severity:** \`${isTransient ? 'Low (Transient)' : 'High (Critical Configuration)'}\`

#### 🛠️ Recovery Action
${recoveryAction}
`;
    writeSummary(summary);
    
    if (isTransient) {
      log.warn("Exiting gracefully with code 0 to prevent GitHub Actions daily failure email spam.");
      process.exit(0);
    } else {
      log.error("Exiting with code 1 due to critical configuration or verification failure.");
      process.exit(1);
    }
  }
}

run();
