import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { spawn } from 'child_process';
import { assertEquals, assertTrue, assertNotNull, isDisplayed } from './seleniumHelpers.js';

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) return true;
    } catch {
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

async function runSeleniumTests() {
  console.log('🚀 Starting Vite dev server for Selenium E2E tests...');
  const devServer = spawn('npx', ['vite', '--port', String(PORT)], {
    stdio: 'inherit',
    shell: true,
  });

  let driver = null;

  try {
    await waitForServer(BASE_URL);
    console.log(`✅ Dev server ready at ${BASE_URL}`);

    console.log('🌐 Launching Headless Firefox browser...');
    const options = new firefox.Options();
    options.addArguments('-headless');

    driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .build();

    console.log('\n--- Test 1: Basic Navigation & Visible Elements ---');
    await driver.get(BASE_URL);

    const heading = await driver.findElement(By.className('login-title'));
    assertNotNull(heading, 'AquaStock heading element exists');
    await isDisplayed(heading, 'AquaStock heading is displayed');
    const headingText = await heading.getText();
    assertEquals(headingText, 'AquaStock', 'Title text equals AquaStock');

    const emailInput = await driver.findElement(By.id('email'));
    assertNotNull(emailInput, 'Email field exists');
    await isDisplayed(emailInput, 'Email field is displayed');

    const passwordInput = await driver.findElement(By.id('password'));
    assertNotNull(passwordInput, 'Password field exists');
    await isDisplayed(passwordInput, 'Password field is displayed');

    const submitBtn = await driver.findElement(By.id('login-submit'));
    assertNotNull(submitBtn, 'Submit button exists');
    await isDisplayed(submitBtn, 'Submit button is displayed');
    console.log('PASSED: Basic Navigation & Visible Elements');

    console.log('\n--- Test 2: Form Failure Handling ---');
    await emailInput.clear();
    await emailInput.sendKeys('invalid-user@aquastock.com');
    await passwordInput.clear();
    await passwordInput.sendKeys('wrongpassword');
    await submitBtn.click();

    // Wait for alert banner to appear
    const alertBox = await driver.wait(
      until.elementLocated(By.className('alert-error')),
      5000,
      'Error alert box should appear on failed login'
    );

    assertNotNull(alertBox, 'Error alert box element exists');
    await isDisplayed(alertBox, 'Error alert box is displayed');
    const alertText = await alertBox.getText();
    assertTrue(alertText.length > 0, 'Error alert text should not be empty');
    console.log(`PASSED: Form Failure Handling (Alert text: "${alertText.trim()}")`);

    console.log('\n--- Test 3: Form Interaction & Input State ---');
    await emailInput.clear();
    await emailInput.sendKeys('admin@aquastock.com');
    const typedEmail = await emailInput.getAttribute('value');
    assertEquals(typedEmail, 'admin@aquastock.com', 'Typed email matches input value');

    await passwordInput.clear();
    await passwordInput.sendKeys('admin123');
    const typedPassword = await passwordInput.getAttribute('value');
    assertEquals(typedPassword, 'admin123', 'Typed password matches input value');
    console.log('PASSED: Form Interaction & Input State');

    console.log('\n🎉 ALL SELENIUM E2E TESTS PASSED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('\n❌ Selenium E2E Test Failed:', error);
    process.exitCode = 1;
  } finally {
    if (driver) {
      console.log('🧹 Closing Firefox browser session...');
      await driver.quit();
    }
    if (devServer) {
      console.log('🛑 Stopping Vite dev server...');
      devServer.kill('SIGTERM');
    }
  }
}

runSeleniumTests();
