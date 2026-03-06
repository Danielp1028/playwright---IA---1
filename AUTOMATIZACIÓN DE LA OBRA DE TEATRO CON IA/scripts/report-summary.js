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

function formatReport() {
  const reportPath = path.join(__dirname, '../test-results/cucumber-report.json');
  
  if (!fs.existsSync(reportPath)) {
    console.log(`${colors.yellow}⚠️  No se encontró reporte. Ejecuta los tests primero.${colors.reset}`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
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

    data.forEach(feature => {
      feature.elements.forEach(scenario => {
        totalScenarios++;
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
              feature: feature.name,
              scenario: scenario.name,
              step: step.text,
              error: step.result.message
            });
          } else if (step.result.status === 'undefined') {
            undefinedSteps++;
            scenarioUndefined = true;
            scenarioPassed = false;
            undefinedDetails.push({
              feature: feature.name,
              scenario: scenario.name,
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
    console.log(`${colors.bright}${colors.cyan}║          REPORTE DE EJECUCIÓN DE TESTS DE CUCUMBER                    ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.bright}📊 RESUMEN GENERAL:${colors.reset}`);
    console.log(`   Total de escenarios: ${colors.bright}${totalScenarios}${colors.reset}`);
    console.log(`   ✅ Escenarios pasados: ${colors.green}${colors.bright}${passedScenarios}${colors.reset}`);
    console.log(`   ❌ Escenarios fallidos: ${colors.red}${colors.bright}${failedScenarios}${colors.reset}`);
    if (undefinedScenarios > 0) {
      console.log(`   ⚠️  Escenarios indefinidos: ${colors.yellow}${colors.bright}${undefinedScenarios}${colors.reset}`);
    }
    console.log(`\n   Total de pasos: ${colors.bright}${totalSteps}${colors.reset}`);
    console.log(`   ✅ Pasos pasados: ${colors.green}${colors.bright}${passedSteps}${colors.reset}`);
    console.log(`   ❌ Pasos fallidos: ${colors.red}${colors.bright}${failedSteps}${colors.reset}`);
    if (undefinedSteps > 0) {
      console.log(`   ⚠️  Pasos indefinidos: ${colors.yellow}${colors.bright}${undefinedSteps}${colors.reset}`);
    }

    // Mostrar detalles de pasos indefinidos
    if (undefinedDetails.length > 0) {
      console.log(`\n${colors.bright}${colors.yellow}═══════════════════════════════════════════════════════════════════${colors.reset}`);
      console.log(`${colors.bright}${colors.yellow}PASOS SIN DEFINIR (UNDEFINED):${colors.reset}\n`);
      
      undefinedDetails.forEach((detail, index) => {
        console.log(`${colors.yellow}${index + 1}. ${colors.bright}${detail.scenario}${colors.reset}`);
        console.log(`   ${colors.yellow}Paso:${colors.reset} ${detail.step}`);
        console.log(`   ${colors.yellow}Estado:${colors.reset} Necesita definición en cucumberSteps.ts`);
        console.log('');
      });
    }

    // Mostrar detalles de fallos
    if (failedDetails.length > 0) {
      console.log(`\n${colors.bright}${colors.red}═══════════════════════════════════════════════════════════════════${colors.reset}`);
      console.log(`${colors.bright}${colors.red}DETALLES DE FALLOS:${colors.reset}\n`);
      
      failedDetails.forEach((detail, index) => {
        console.log(`${colors.red}${index + 1}. ${colors.bright}${detail.scenario}${colors.reset}`);
        console.log(`   ${colors.yellow}Característica:${colors.reset} ${detail.feature}`);
        console.log(`   ${colors.yellow}Paso fallido:${colors.reset} ${detail.step}`);
        console.log(`   ${colors.red}${colors.bright}Error:${colors.reset} ${detail.error}`);
        console.log('');
      });
    } else if (undefinedDetails.length === 0) {
      console.log(`\n${colors.bright}${colors.green}🎉 ¡Todos los tests pasaron correctamente!${colors.reset}\n`);
    }

    // Resumen final
    const porcentajePasadas = totalScenarios > 0 ? ((passedScenarios / totalScenarios) * 100).toFixed(2) : 0;
    console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}Tasa de éxito: ${colors.green}${porcentajePasadas}%${colors.reset} (${passedScenarios}/${totalScenarios} escenarios)\n`);

  } catch (error) {
    console.error(`${colors.red}Error al procesar el reporte: ${error.message}${colors.reset}`);
  }
}

// Crear directorio si no existe
const testResultsDir = path.join(__dirname, '../test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

formatReport();
