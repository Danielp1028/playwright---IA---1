#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function printHeader() {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║         INICIANDO EJECUCIÓN DE TODOS LOS TESTS DE LOGIN                 ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
}

function runAllTests() {
  printHeader();
  
  const cwd = path.join(__dirname, '..');
  
  // Ejecutar todos los tests Cucumber
  exec('npm run test:cucumber', { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    console.log(stdout);
    if (stderr && !stderr.includes('Unknown formatter')) {
      console.error(stderr);
    }

    // Después ejecutar los tests Playwright
    console.log(`\n${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════════${colors.reset}\n`);
    console.log(`${colors.bright}Ejecutando tests Playwright...${colors.reset}\n`);
    
    exec('npx playwright test tests/login --reporter=list', { cwd: path.join(__dirname, '../..'), maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      console.log(stdout);
      if (stderr) {
        console.error(stderr);
      }
      
      printFinalSummary();
    });
  });
}

function printFinalSummary() {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                    RESUMEN FINAL DE EJECUCIÓN                          ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.green}${colors.bright}📊 Reportes disponibles:${colors.reset}`);
  console.log(`   📁 Tests Cucumber: test-results/cucumber-report.json`);
  console.log(`   📁 Tests Playwright: test-results/playwright-report.json`);
  console.log(`   📁 Reporte HTML Playwright: playwright-report/index.html`);
  
  console.log(`\n${colors.bright}${colors.yellow}💡 Para ver el reporte HTML abre:${colors.reset}`);
  console.log(`   ${colors.blue}playwright-report/index.html${colors.reset}\n`);
}

// Ejecutar
runAllTests();
