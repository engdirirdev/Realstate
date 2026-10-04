/**
 * CLI Training & Evaluation Script for AI Valuation Engine
 * Usage: npx tsx scripts/train-valuation-model.ts
 */

import { runTrainingPipeline } from "../lib/ai/valuation/trainer";

async function main() {
  console.log("=================================================");
  console.log("  AI VALUATION & ML PRICE MODEL TRAINING PIPELINE");
  console.log("=================================================\n");

  try {
    const report = await runTrainingPipeline();
    console.log("✓ Training Pipeline Executed Successfully!\n");
    console.log("Dataset Summary:");
    console.log(`  - Total Approved Records: ${report.datasetSize}`);
    console.log(`  - Train Split Size:       ${report.trainSize}`);
    console.log(`  - Val Split Size:         ${report.valSize}`);
    console.log(`  - Test Split Size:        ${report.testSize}\n`);

    console.log("Baseline Evaluation on Held-Out Test Set:");
    console.log(`  - Global Median Baseline:       MAE=$${report.baselines.globalMedian.mae.toLocaleString()}, RMSE=$${report.baselines.globalMedian.rmse.toLocaleString()}, R²=${report.baselines.globalMedian.r2}`);
    console.log(`  - Location/Type Median Baseline: MAE=$${report.baselines.locationTypeMedian.mae.toLocaleString()}, RMSE=$${report.baselines.locationTypeMedian.rmse.toLocaleString()}, R²=${report.baselines.locationTypeMedian.r2}`);
    console.log(`  - Price/m² Baseline:            MAE=$${report.baselines.pricePerArea.mae.toLocaleString()}, RMSE=$${report.baselines.pricePerArea.rmse.toLocaleString()}, R²=${report.baselines.pricePerArea.r2}\n`);

    console.log("Candidate ML Models Performance on Held-Out Test Set:");
    for (const c of report.candidateModels) {
      console.log(`  * ${c.name.padEnd(18)} : MAE=$${c.testMetrics.mae.toLocaleString().padEnd(8)} RMSE=$${c.testMetrics.rmse.toLocaleString().padEnd(8)} R²=${c.testMetrics.r2.toString().padEnd(6)} (Train R²=${c.trainMetrics.r2})`);
    }

    console.log(`\nWinning Selected Model: ${report.selectedModel}`);
    console.log(`Readiness Verdict:     ${report.readinessVerdict}`);
    console.log(`Artifact Serialized:   ${report.artifactPath}`);
  } catch (err: any) {
    console.error("Training error:", err);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
