#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function formatReportSingle(reportPath) {
  const fullPath = path.join(__dirname, '..', reportPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.yellow}⚠️  No se encontró reporte en ${reportPath}${colors.reset}`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    let totalScenarios = 0;
    let passedScenarios = 0;
    let failedScenarios = 0;
    let undefinedScenarios = 0;
    let totalSteps = 0;
    let passedSteps = 0;
    let failedSteps = 0;
    let undefinedSteps = 0;
    const failedDetails = [];
    const undefinedDetails = [];
    let scenarioName = '';

    data.forEach(feature => {
      feature.elements.forEach(scenario => {
        totalScenarios++;
        scenarioName = scenario.name;
        let scenarioPassed = true;
        let scenarioUndefined = false;
        
        scenario.steps.forEach(step => {
          totalSteps++;
          if (step.result.status === 'passed') {
            passedSteps++;
          } else if (step.result.status === 'failed') {
            failedSteps++;
            scenarioPassed = false;
            failedDetails.push({
              step: step.text,
              error: step.result.message
            });
          } else if (step.result.status === 'undefined') {
            undefinedSteps++;
            scenarioUndefined = true;
            scenarioPassed = false;
            undefinedDetails.push({
              step: step.text
            });
          }
        });

        if (scenarioPassed && !scenarioUndefined) {
          passedScenarios++;
        } else if (scenarioUndefined) {
          undefinedScenarios++;
        } else {
          failedScenarios++;
        }
      });
    });

    // Mostrar reporte
    console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║                  RESULTADO DEL CASO DE PRUEBA                         ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.bright}📋 Escenario:${colors.reset} ${scenarioName}\n`);

    if (passedScenarios === 1 && failedScenarios === 0 && undefinedScenarios === 0) {
      console.log(`${colors.green}${colors.bright}✅ ESCENARIO PASADO${colors.reset}\n`);
      console.log(`   ${colors.green}✓${colors.reset} Total de pasos: ${colors.bright}${totalSteps}${colors.reset}`);
      console.log(`   ${colors.green}✓${colors.reset} Pasos pasados: ${colors.bright}${passedSteps}${colors.reset}`);
      console.log(`   ${colors.green}✓${colors.reset} Pasos fallidos: ${colors.bright}0${colors.reset}`);
    } else if (undefinedScenarios === 1) {
      console.log(`${colors.yellow}${colors.bright}⚠️  ESCENARIO CON PASOS INDEFINIDOS${colors.reset}\n`);
      console.log(`   ${colors.yellow}⚠${colors.reset} Total de pasos: ${colors.bright}${totalSteps}${colors.reset}`);
      console.log(`   ${colors.green}✓${colors.reset} Pasos pasados: ${colors.bright}${passedSteps}${colors.reset}`);
      console.log(`   ${colors.yellow}⚠${colors.reset} Pasos indefinidos: ${colors.bright}${undefinedSteps}${colors.reset}`);
    } else if (failedScenarios === 1) {
      console.log(`${colors.red}${colors.bright}❌ ESCENARIO FALLIDO${colors.reset}\n`);
      console.log(`   ${colors.red}✗${colors.reset} Total de pasos: ${colors.bright}${totalSteps}${colors.reset}`);
      console.log(`   ${colors.green}✓${colors.reset} Pasos pasados: ${colors.bright}${passedSteps}${colors.reset}`);
      console.log(`   ${colors.red}✗${colors.reset} Pasos fallidos: ${colors.bright}${failedSteps}${colors.reset}`);
    }

    // Mostrar detalles de pasos indefinidos
    if (undefinedDetails.length > 0) {
      console.log(`\n${colors.bright}${colors.yellow}═══════════════════════════════════════════════════════════════════${colors.reset}`);
      console.log(`${colors.bright}${colors.yellow}PASOS SIN DEFINIR:${colors.reset}\n`);
      
      undefinedDetails.forEach((detail, index) => {
        console.log(`${colors.yellow}${index + 1}. Paso: ${colors.bright}${detail.step}${colors.reset}`);
        console.log(`   ${colors.yellow}${colors.bright}Estado:${colors.reset} Necesita definición en cucumberSteps.ts`);
        console.log(`   ${colors.yellow}Solución:${colors.reset} Agrega este paso en src/Steps/cucumberSteps.ts`);
        console.log('');
      });
    }

    // Mostrar detalles de pasos fallidos
    if (failedDetails.length > 0) {
      console.log(`\n${colors.bright}${colors.red}═══════════════════════════════════════════════════════════════════${colors.reset}`);
      console.log(`${colors.bright}${colors.red}DETALLES DE PASOS FALLIDOS:${colors.reset}\n`);
      
      failedDetails.forEach((detail, index) => {
        console.log(`${colors.red}${index + 1}. Paso: ${colors.bright}${detail.step}${colors.reset}`);
        console.log(`   ${colors.red}${colors.bright}Error:${colors.reset} ${detail.error}`);
        console.log('');
      });
    }

    console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Error al procesar el reporte: ${error.message}${colors.reset}`);
  }
}

// Obtener la ruta del reporte desde argumentos
const reportPath = process.argv[2];
if (!reportPath) {
  console.error(`${colors.red}Error: Se requiere la ruta del reporte como argumento${colors.reset}`);
  process.exit(1);
}

formatReportSingle(reportPath);
