# PHASE 3 — ML VALUATION AUDIT & EVALUATION COMPLETION (EVIDENCE-ONLY)
## Technical Audit Addendum & Empirical Benchmark Review

---

### REPRODUCIBILITY & AUDIT PROVENANCE HEADER

```yaml
audit_metadata:
  repository: "real_estate_ai (b:/B/dirir/Realstate)"
  git_commit: "6e54cff6cfd1a6cb380f1332cee33087f24f1474"
  git_status_short: "M app/(public)/price-prediction/page.tsx, M app/api/ai-chat/route.ts, M app/api/price-prediction/route.ts, M app/api/user/recommendations/route.ts, M components/AIChatbot.tsx, M lib/chat-grounding-engine.ts, M lib/recommendation-engine.ts, M package.json, M prisma/schema.prisma"
  audit_date_time: "2026-10-04T12:08:21Z"
  execution_environment: "Windows 11 / Node.js v24.19.0 / tsx / MySQL 8.0"
  google_ai_api_key_present: false
  model_artifact_path: "lib/ai/valuation/model-artifact.json"
  model_artifact_sha256: "b005c8a9d263428b25fb6e7c4a2a65664c7b489cfc14e9b0e14868f14e3dc4ae"
  model_artifact_last_modified: "2026-10-04T11:30:00.150Z"
  exact_verification_commands:
    - "npx.cmd tsx verification/ml_valuation_audit.ts"
    - "npx.cmd tsx verification/test_api_endpoints.ts"
    - "npx.cmd tsx verification/test_chatbot_valuation.ts"
    - "npm.cmd test"
```

---

## SECTION 0 — STATUS LEGEND

In accordance with audit specifications, all findings and claim assessments use strictly:
- **`VERIFIED`**: Directly corroborated by code line references, deterministic SQL rows, and raw terminal transcripts.
- **`PARTIAL`**: Mechanism exists and executes, but scope, coverage, or assumptions are constrained or imperfect.
- **`MISLEADING`**: The quantitative figure or statement is technically reproducible under a specific quirk, but conceals critical unfavorable metrics or conflates concepts (e.g. asking price vs transaction value; optimistic test selection).
- **`BROKEN`**: Code or logic produces mathematically erroneous, inconsistent, or invalid output under specified conditions.
- **`ABSENT`**: The claimed integration, feature, or measurement does not exist in the codebase.
- **`NOT VERIFIED`**: Beyond empirical verification within the existing environment or dataset.
- **`NOT COMPUTED`**: Required evaluation metric omitted from prior reports.

---

## SECTION A — COMPLETE THE METRIC SET

The original audit specifications defined three evaluation targets. Below is the complete metric reconciliation:

| Metric | Target Threshold | Reported in Phase 3? | Audited Test Metric ($n=6$) | Target Status |
| :--- | :---: | :---: | :---: | :---: |
| **MAE** | $< \$5,000$ | Yes — $\$39,574.45$ | **$\$39,574.45$** | **TARGET NOT MET** (7.9× higher than target) |
| **RMSE** | None stated | Yes — $\$54,387.85$ | **$\$54,387.85$** | Unfavorable counterpart to MAE |
| **MAPE** | $< 8.5\%$ | **Missing** | **$29.15\%$** | **TARGET NOT MET** (3.4× higher than target) |
| **$R^2$** | $> 0.82$ | **Missing in Summary** | **$-1.382$** | **TARGET NOT MET** (Negative value) |

### A1. Metric Computation Code & Raw Terminal Output

**Code Reference (`lib/ai/valuation/metrics.ts:11-58`)**:
```typescript
export function calculateRegressionMetrics(actual: number[], predicted: number[]): EvaluationMetrics {
  const n = actual.length;
  let absErrorSum = 0, sqErrorSum = 0, pctErrorSum = 0, actualSum = 0;
  for (let i = 0; i < n; i++) {
    const y = actual[i];
    const yHat = predicted[i];
    const diff = y - yHat;
    absErrorSum += Math.abs(diff);
    sqErrorSum += diff * diff;
    actualSum += y;
    if (y > 0) pctErrorSum += Math.abs(diff / y);
  }
  const meanActual = actualSum / n;
  let totalSqSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = actual[i] - meanActual;
    totalSqSum += diff * diff;
  }
  const mae = absErrorSum / n;
  const rmse = Math.sqrt(sqErrorSum / n);
  const r2 = totalSqSum > 0 ? 1 - sqErrorSum / totalSqSum : 0;
  const mape = (pctErrorSum / n) * 100;
  return { mae: Math.round(mae * 100) / 100, rmse: Math.round(rmse * 100) / 100, r2: Math.round(r2 * 1000) / 1000, mape: Math.round(mape * 100) / 100, sampleCount: n };
}
```

**Raw Terminal Transcript (`verification/audit_output_utf8.txt:104-106`)**:
```text
Ridge Test Predictions: [ 73667, 68375, 61068, 67721, 61198, 60524 ]
Ridge SSE: $17748228598.27
Ridge R² arithmetic: 1 - (17748228598.27 / 7450000000.00) = -1.3823
Reported Ridge Metrics: MAE=$39574.45, RMSE=$54387.85, MAPE=29.15%, R²=-1.382
```

### A2. $R^2$ Arithmetic Check

- **Test target prices ($n=6$)**: `[75000, 70000, 65000, 145000, 140000, 135000]`
- **Test mean ($\bar{y}_{\text{test}}$)**: $\$105,000.00$
- **Target sample variance ($s^2_{\text{test}}$)**: $\$1,490,000,000.00$
- **Target standard deviation ($\sigma_{\text{test}}$)**: $\$38,600.52$
- **Total Sum of Squares ($\text{SST}$)**:
  $$\text{SST} = \sum_{i=1}^6 (y_i - \bar{y}_{\text{test}})^2 = (75\text{k}-105\text{k})^2 + (70\text{k}-105\text{k})^2 + (65\text{k}-105\text{k})^2 + (145\text{k}-105\text{k})^2 + (140\text{k}-105\text{k})^2 + (135\text{k}-105\text{k})^2 = \$7,450,000,000.00$$
- **Sum of Squared Errors ($\text{SSE}_{\text{Ridge}}$)**: $\$17,748,228,598.27$
- **$R^2$ Calculation**:
  $$R^2 = 1 - \frac{\text{SSE}}{\text{SST}} = 1 - \frac{17,748,228,598.27}{7,450,000,000.00} = 1 - 2.38231 = \mathbf{-1.3823}$$

> [!CAUTION]
> **A negative $R^2$ means the model performs worse than predicting the test-set mean.**
> Specifically, predicting the constant test-set mean ($\$105,000$) yields a squared error of $\$7.45\text{B}$, whereas the Ridge model produces an error of $\$17.75\text{B}$—more than 2.3 times worse than a naive horizontal line at the sample mean.

### A3. Constant-Predictor Baseline (Train Mean)

- **Training set mean price ($\bar{y}_{\text{train}}$)**: $\$57,105.26$ ($n=19$)
- **Constant prediction on test set**: $\hat{y}_i = \$57,105.26$ for all $i \in \{1 \dots 6\}$
- **Performance Metrics**:
  - $\text{MAE} = \$47,894.74$
  - $\text{RMSE} = \$59,460.68$
  - $\text{MAPE} = 38.66\%$
  - $R^2 = 1 - \frac{21,207,894,736.84}{7,450,000,000.00} = \mathbf{-1.8474}$

**Comparison Line**:
> **Ridge is better than predicting the training mean by $\$8,320.29$ in MAE (17.4% reduction) and $\$5,072.83$ in RMSE (8.5% reduction), but both predictors exhibit severely negative $R^2$ on this split.**

---

## SECTION B — EVALUATION PROTOCOL & STATISTICAL NOISE

### B1. Selection Bias Disclosure

In `lib/ai/valuation/trainer.ts:203`:
```typescript
// Select best model on validation + test RMSE
candidates.sort((a, b) => a.testMetrics.rmse - b.testMetrics.rmse);
const winner = candidates[0];
```

> [!WARNING]
> **The test set was used directly during model selection to choose Ridge Regression over Decision Trees, Random Forest, and GBDT.**
> Because candidate models were sorted and selected on `testMetrics.rmse`, the reported test metrics are optimistically biased.
> **Status: OPTIMISTIC — test set reused for selection.**

### B2. All Four Algorithms on Test Set ($n=6$)

Every candidate was evaluated on the identical holdout test set ($n=6$):

| Candidate Algorithm | Architecture / Hyperparameters | Test MAE (USD) | Test RMSE (USD) | Test MAPE (%) | Test $R^2$ | Train $R^2$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Ridge Regression** | Tikhonov L2 regularized ($\lambda = 1.0$) | **$\$39,574.45$** | **$\$54,387.85$** | **$29.15\%$** | **$-1.382$** | $0.988$ |
| **Decision Tree** | Variance greedy split ($\text{depth}=4$) | $\$42,833.33$ | $\$57,426.76$ | $32.82\%$ | $-1.656$ | $0.937$ |
| **Random Forest** | Bagged ensemble ($M=15, \text{depth}=4$) | $\$44,792.50$ | $\$57,093.45$ | $35.61\%$ | $-1.625$ | $0.770$ |
| **Gradient Boosting** | Sequential residual shrinkage ($M=15, \eta=0.1$) | $\$46,028.67$ | $\$58,877.44$ | $36.41\%$ | $-1.792$ | $0.889$ |

### B3. All Three Baselines on Test Set ($n=6$)

| Baseline Model | Rule Definition | Test MAE (USD) | Test RMSE (USD) | Test MAPE (%) | Test $R^2$ |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Global Median** | $\hat{y} = \text{median}(y_{\text{train}}) = \$55,000$ | $\$50,000.00$ | $\$61,169.16$ | $40.92\%$ | $-2.013$ |
| **Location/Type Median** | $\hat{y} = \text{median}(y_{\text{train}} \mid \text{city}, \text{type})$ | $\$50,000.00$ | $\$61,169.16$ | $40.92\%$ | $-2.013$ |
| **Price per m²** | $\hat{y} = \text{area} \times \text{median}(\text{price}/\text{area})_{\text{train}} = \$326.09/\text{m}^2$ | $\$52,862.32$ | $\$63,037.92$ | $48.44\%$ | $-2.200$ |

*Note on Location/Type Median*: Because 100% of properties in the test set belong to categories (`OFFICE` and `VILLA`) absent from the training set, the group median fell back entirely to the Global Median, producing identical metrics.

### B4. Paired Per-Sample Error Comparison ($n=6$)

**Raw Data Transcript (`verification/audit_output_utf8.txt:128-135`)**:

| Test Row | Actual Price | Ridge Estimate | $|\text{Err}_{\text{Ridge}}|$ | Global Median | $|\text{Err}_{\text{GMed}}|$ | Loc/Type Median | $|\text{Err}_{\text{LTMed}}|$ | Price/m² Pred | $|\text{Err}_{\text{P/m²}}|$ | Paired Diff ($\Delta$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** (Berbera Office) | $\$75,000$ | $\$73,667$ | $\$1,333$ | $\$55,000$ | $\$20,000$ | $\$55,000$ | $\$20,000$ | $\$84,783$ | $\$9,783$ | $+\$18,667$ |
| **2** (Baydhabo Office) | $\$70,000$ | $\$68,375$ | $\$1,625$ | $\$55,000$ | $\$15,000$ | $\$55,000$ | $\$15,000$ | $\$104,348$ | $\$34,348$ | $+\$13,375$ |
| **3** (Garowe Office) | $\$65,000$ | $\$61,068$ | $\$3,932$ | $\$55,000$ | $\$10,000$ | $\$55,000$ | $\$10,000$ | $\$26,087$ | $\$38,913$ | $+\$6,068$ |
| **4** (Baydhabo Villa) | $\$145,000$ | $\$67,721$ | $\$77,279$ | $\$55,000$ | $\$90,000$ | $\$55,000$ | $\$90,000$ | $\$75,000$ | $\$70,000$ | $+\$12,721$ |
| **5** (Garowe Villa) | $\$140,000$ | $\$61,198$ | $\$78,802$ | $\$55,000$ | $\$85,000$ | $\$55,000$ | $\$85,000$ | $\$94,565$ | $\$45,435$ | $+\$6,198$ |
| **6** (Kismayo Villa) | $\$135,000$ | $\$60,524$ | $\$74,476$ | $\$55,000$ | $\$80,000$ | $\$55,000$ | $\$80,000$ | $\$16,304$ | $\$118,696$ | $+\$5,524$ |

- **Paired Differences ($\Delta_i = |\text{Err}_{\text{GMed}}| - |\text{Err}_{\text{Ridge}}|$)**: `[+$18,667, +$13,375, +$6,068, +$12,721, +$6,198, +$5,524]`
- **Mean paired difference (MAE gap)**: $\mathbf{\$10,425.55}$
- **Standard deviation of paired differences**: $\mathbf{\$5,343.42}$
- **Comparison Statement**:
  > **The observed MAE gap ($\$10,425.55$) is approximately 1.95× larger than the spread of the paired differences ($\text{std} = \$5,343.42$), and Ridge achieved a lower absolute error on all 6 out of 6 test rows.**

### B5. Leave-One-Out Cross-Validation (LOOCV) Across All $N=28$ Properties

To eliminate test-set partitioning artifacts, a full Leave-One-Out Cross-Validation was executed across all $N=28$ usable records. In each fold $k$, 27 records were used to fit the `StandardScaler` and train `RidgeRegressor` ($\lambda = 1.0$), while the $k$-th record was held out for evaluation.

**Raw Fold-by-Fold Results Transcript (`verification/audit_output_utf8.txt:140-168`)**:

| Fold | City | Property Type | Actual Price | Ridge Estimate | $|\text{Ridge Err}|$ | Ridge MAPE | Baseline Estimate | $|\text{Base Err}|$ | Base MAPE |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | Mogadishu | HOUSE | $\$65,000$ | $\$65,151$ | $\$151$ | $0.2\%$ | $\$60,000$ | $\$5,000$ | $7.7\%$ |
| **2** | Hargeisa | APARTMENT | $\$50,000$ | $\$49,617$ | $\$383$ | $0.8\%$ | $\$65,000$ | $\$15,000$ | $30.0\%$ |
| **3** | Garowe | LAND | $\$45,000$ | $\$46,805$ | $\$1,805$ | $4.0\%$ | $\$65,000$ | $\$20,000$ | $44.4\%$ |
| **4** | Baydhabo | COMMERCIAL | $\$70,000$ | $\$69,669$ | $\$331$ | $0.5\%$ | $\$60,000$ | $\$10,000$ | $14.3\%$ |
| **5** | Berbera | TOWNHOUSE | $\$75,000$ | $\$73,760$ | $\$1,240$ | $1.7\%$ | $\$60,000$ | $\$15,000$ | $20.0\%$ |
| **6** | Mogadishu | STUDIO | $\$45,000$ | $\$44,319$ | $\$681$ | $1.5\%$ | $\$65,000$ | $\$20,000$ | $44.4\%$ |
| **7** | Hargeisa | HOUSE | $\$70,000$ | $\$67,022$ | $\$2,978$ | $4.3\%$ | $\$60,000$ | $\$10,000$ | $14.3\%$ |
| **8** | Bosaso | APARTMENT | $\$55,000$ | $\$56,207$ | $\$1,207$ | $2.2\%$ | $\$65,000$ | $\$10,000$ | $18.2\%$ |
| **9** | Kismayo | VILLA | $\$135,000$ | $\$132,567$ | $\$2,433$ | $1.8\%$ | $\$60,000$ | $\$75,000$ | $55.6\%$ |
| **10** | Garowe | OFFICE | $\$65,000$ | $\$66,653$ | $\$1,653$ | $2.5\%$ | $\$60,000$ | $\$5,000$ | $7.7\%$ |
| **11** | Baydhabo | LAND | $\$50,000$ | $\$51,131$ | $\$1,131$ | $2.3\%$ | $\$65,000$ | $\$15,000$ | $30.0\%$ |
| **12** | Berbera | COMMERCIAL | $\$75,000$ | $\$72,621$ | $\$2,379$ | $3.2\%$ | $\$60,000$ | $\$15,000$ | $20.0\%$ |
| **13** | Mogadishu | TOWNHOUSE | $\$45,000$ | $\$46,652$ | $\$1,652$ | $3.7\%$ | $\$65,000$ | $\$20,000$ | $44.4\%$ |
| **14** | Hargeisa | STUDIO | $\$50,000$ | $\$49,808$ | $\$192$ | $0.4\%$ | $\$65,000$ | $\$15,000$ | $30.0\%$ |
| **15** | Bosaso | HOUSE | $\$75,000$ | $\$73,376$ | $\$1,624$ | $2.2\%$ | $\$60,000$ | $\$15,000$ | $20.0\%$ |
| **16** | Kismayo | APARTMENT | $\$60,000$ | $\$62,345$ | $\$2,345$ | $3.9\%$ | $\$65,000$ | $\$5,000$ | $8.3\%$ |
| **17** | Garowe | VILLA | $\$140,000$ | $\$136,481$ | $\$3,519$ | $2.5\%$ | $\$60,000$ | $\$80,000$ | $57.1\%$ |
| **18** | Baydhabo | OFFICE | $\$70,000$ | $\$72,559$ | $\$2,559$ | $3.7\%$ | $\$60,000$ | $\$10,000$ | $14.3\%$ |
| **19** | Berbera | LAND | $\$55,000$ | $\$54,827$ | $\$173$ | $0.3\%$ | $\$65,000$ | $\$10,000$ | $18.2\%$ |
| **20** | Mogadishu | COMMERCIAL | $\$45,000$ | $\$47,004$ | $\$2,004$ | $4.5\%$ | $\$65,000$ | $\$20,000$ | $44.4\%$ |
| **21** | Hargeisa | TOWNHOUSE | $\$50,000$ | $\$53,817$ | $\$3,817$ | $7.6\%$ | $\$65,000$ | $\$15,000$ | $30.0\%$ |
| **22** | Bosaso | STUDIO | $\$55,000$ | $\$56,227$ | $\$1,227$ | $2.2\%$ | $\$65,000$ | $\$10,000$ | $18.2\%$ |
| **23** | Kismayo | HOUSE | $\$80,000$ | $\$80,382$ | $\$382$ | $0.5\%$ | $\$60,000$ | $\$20,000$ | $25.0\%$ |
| **24** | Garowe | APARTMENT | $\$65,000$ | $\$63,931$ | $\$1,069$ | $1.6\%$ | $\$60,000$ | $\$5,000$ | $7.7\%$ |
| **25** | Baydhabo | VILLA | $\$145,000$ | $\$140,230$ | $\$4,770$ | $3.3\%$ | $\$60,000$ | $\$85,000$ | $58.6\%$ |
| **26** | Berbera | OFFICE | $\$75,000$ | $\$74,721$ | $\$279$ | $0.4\%$ | $\$60,000$ | $\$15,000$ | $20.0\%$ |
| **27** | Mogadishu | LAND | $\$25,000$ | $\$27,757$ | $\$2,757$ | $11.0\%$ | $\$65,000$ | $\$40,000$ | $160.0\%$ |
| **28** | Hargeisa | COMMERCIAL | $\$50,000$ | $\$52,970$ | $\$2,970$ | $5.9\%$ | $\$65,000$ | $\$15,000$ | $30.0\%$ |

#### LOOCV Aggregated Performance Summary ($N=28$)

| Metric | Ridge Regression (LOOCV) | Global Median Baseline (LOOCV) | Method / Formulation |
| :--- | :---: | :---: | :--- |
| **Mean MAE $\pm$ Std** | **$\$1,703.92 \pm \$1,227.10$** | $\$21,250.00 \pm \$21,884.59$ | Fold absolute error mean and sample standard deviation |
| **Mean RMSE** | **$\$2,086.94$** | $\$30,222.39$ | $\sqrt{\frac{1}{N}\sum (y_k - \hat{y}_k)^2}$ |
| **Mean MAPE** | **$2.81\%$** | $31.89\%$ | $\frac{1}{N}\sum \frac{\|y_k - \hat{y}_k\|}{y_k} \times 100\%$ |
| **Cross-Validated $R^2$** | **$+0.9945$** | $-0.1560$ | $R^2_{\text{cv}} = 1 - \frac{\sum (y_k - \hat{y}_k)^2}{\sum (y_k - \bar{y})^2}$ |

### B6. Statistical Significance

- **Pairs Tested**: $N = 28$
- **Directional Outperformance**: Ridge Regression won on **28 out of 28 folds (100.0%)**; Global Median Baseline won 0 folds.
- **Non-Parametric Wilcoxon Signed-Rank Test**:
  - Positive rank sum ($W^+$): $406$
  - Negative rank sum ($W^-$): $0$
  - Test statistic: $W = \min(W^+, W^-) = \mathbf{0}$
  - Critical threshold for $N=28$ at $\alpha = 0.001$ (two-tailed) is $W_{\text{crit}} = 68$.
  - Because $W = 0 < 68$, the difference is statistically significant at $p < 0.0001$.

### B7. Verdict Line

> **At the current data scale ($N=28$), the observed improvement over naive median baselines is statistically distinguishable from noise ($W=0, p < 0.0001$), but the reported metric magnitude ($\text{MAE} = \$39.5\text{k}$ on split vs $\$1.7\text{k}$ on LOOCV) is an artifact of partition-induced category starvation.**

---

## SECTION C — TARGET VARIABLE CHAIN OF CUSTODY

### C1. Query Used to Build Dataset

From `lib/ai/valuation/trainer.ts:56-74`:
```typescript
const properties = await prisma.property.findMany({
  where: { status: "APPROVED" },
  select: {
    id: true,
    title: true,
    price: true,
    city: true,
    type: true,
    bedrooms: true,
    bathrooms: true,
    area: true,
    parking: true,
    isFurnished: true,
    yearBuilt: true,
    createdAt: true,
    status: true,
  },
  orderBy: { createdAt: "asc" },
});
```
- **Target Column**: `price` (Float) on the `Property` table in MySQL (`prisma.property.price`).

### C2. Target Property: Asking Price vs Transaction Price

In `prisma/schema.prisma:41-45`:
```prisma
model Property {
  id          String        @id @default(cuid())
  title       String
  description String        @db.Text
  price       Float
  ...
```
There is no `sales`, `transactions`, `deeds`, or `closing_price` table anywhere in the schema. All 28 rows are active portal listings posted by property managers and owners.
- **Proof**: The target is strictly the **seller's initial asking price**.

### C3. What the Model Learns to Predict

> **A model trained on asking prices reproduces what sellers ask; it does not establish market value, cleared market transactions, or buyer-seller negotiated settlement prices.**

### C4. Full Training Set Table ($n=19$)

| ID | City | Property Type | Beds | Baths | Area (m²) | Asking Price (USD) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `cmus03vk50008hy5wqk1naxrv` | Mogadishu | HOUSE | 1 | 1 | 50 | $\$65,000$ |
| `cmus03vq70014hy5wkf4sqbko` | Hargeisa | HOUSE | 1 | 1 | 290 | $\$70,000$ |
| `cmus03vtx0020hy5wg41aisr2` | Bosaso | HOUSE | 1 | 1 | 230 | $\$75,000$ |
| `cmus03vlh000chy5wgnzu5esl` | Hargeisa | APARTMENT | 2 | 1 | 80 | $\$50,000$ |
| `cmus03vqo0018hy5wox1t0sl6` | Bosaso | APARTMENT | 2 | 1 | 320 | $\$55,000$ |
| `cmus03vuf0024hy5wy56cidix` | Kismayo | APARTMENT | 2 | 1 | 260 | $\$60,000$ |
| `cmus03vob000ohy5wa6oqhm7b` | Garowe | LAND | 1 | 1 | 170 | $\$45,000$ |
| `cmus03vs3001khy5wp6krwgk7` | Baydhabo | LAND | 1 | 1 | 110 | $\$50,000$ |
| `cmus03vvs002ghy5wg2rkpdu4` | Berbera | LAND | 1 | 1 | 50 | $\$55,000$ |
| `cmus03vos000shy5w7xb0yfpn` | Baydhabo | COMMERCIAL | 2 | 1 | 200 | $\$70,000$ |
| `cmus03vsk001ohy5why7qfzyb` | Berbera | COMMERCIAL | 2 | 1 | 140 | $\$75,000$ |
| `cmus03vw8002khy5w3hj9sksw` | Mogadishu | COMMERCIAL | 2 | 1 | 80 | $\$45,000$ |
| `cmus03vzt003ghy5wvhspsjxg` | Hargeisa | COMMERCIAL | 2 | 1 | 320 | $\$50,000$ |
| `cmus03vpa000why5wqt1t9y4f` | Berbera | TOWNHOUSE | 3 | 2 | 230 | $\$75,000$ |
| `cmus03vt0001shy5whjof9p2x` | Mogadishu | TOWNHOUSE | 3 | 2 | 170 | $\$45,000$ |
| `cmus03vwp002ohy5wgsole3wh` | Hargeisa | TOWNHOUSE | 3 | 2 | 110 | $\$50,000$ |
| `cmus03vpq0010hy5w25q4x0d4` | Mogadishu | STUDIO | 1 | 1 | 260 | $\$45,000$ |
| `cmus03vth001why5w0xjiirv2` | Hargeisa | STUDIO | 1 | 1 | 200 | $\$50,000$ |
| `cmus03vx6002shy5ws8011uo3` | Bosaso | STUDIO | 1 | 1 | 140 | $\$55,000$ |

### C5. Distinct Cities & Types in Train vs Test

- **Cities in Training Set ($n=19$)**: 7 (Mogadishu, Hargeisa, Bosaso, Kismayo, Garowe, Baydhabo, Berbera).
- **Cities in Test Set ($n=6$)**: 4 (Berbera, Baydhabo, Garowe, Kismayo) — all present in training.
- **Property Types in Training Set ($n=19$)**: 6 (`HOUSE`, `APARTMENT`, `LAND`, `COMMERCIAL`, `TOWNHOUSE`, `STUDIO`).
- **Property Types in Test Set ($n=6$)**: 2 (`OFFICE`, `VILLA`).
- **Unseen Categories**:
  - `OFFICE` (Rows 1–3 of test set): **0 occurrences in training split**. Marked as **`UNSEEN CATEGORY`**.
  - `VILLA` (Rows 4–6 of test set): **0 occurrences in training split**. Marked as **`UNSEEN CATEGORY`**.
  - *Consequence*: In `model-artifact.json`, coefficients for `type_villa` and `type_office` are exactly `0.0`. The model had zero training signal for these classes, explaining why Villa predictions missed by $\sim \$75,000$.

### C6. Date Range of Listings

From `verification/audit_output_utf8.txt:11-13`:
- **Earliest `createdAt`**: `2026-10-03T06:18:33.989Z`
- **Latest `createdAt`**: `2026-10-03T06:18:34.553Z`
- **Elapsed Seeding Time**: $564\text{ milliseconds}$
- **Statement**:
  > **All listings were created in a single seeding operation on one day; there is no temporal dimension to the data and no way to detect market drift.**

---

## SECTION D — PRICE POSITION LABELS: GO / NO-GO

The system computes price position labels defined as:
$$\text{askingPrice} \in [0.90 \times P_{\text{est}}, 1.10 \times P_{\text{est}}] \implies \text{FAIRLY\_PRICED}$$

### D1. Width of $\pm 10\%$ Band

- **Median Dataset Valuation**: $\$65,000$
- **Lower Band Boundary ($-10\%$)**: $\$65,000 \times 0.90 = \$58,500$
- **Upper Band Boundary ($+10\%$)**: $\$65,000 \times 1.10 = \$71,500$
- **Total Band Width**: $\$71,500 - \$58,500 = \mathbf{\$13,000}$ (or $\pm \$6,500$)

### D2. Band Width vs Model Error

| Metric | Dollar Value | Comparison |
| :--- | :---: | :--- |
| **Total $\pm 10\%$ Band Width** | **$\$13,000.00$** | $\pm \$6,500$ band margin |
| **Model Test MAE** | **$\$39,574.45$** | **3.0× larger than total band width** |
| **Model Test RMSE** | **$\$54,387.85$** | **4.2× larger than total band width** |

> **The band width ($\$13,000$) is 3.0 times smaller than the model's Mean Absolute Error ($\$39,574.45$).**

### D3. Invalidation of Price Position Label

> **The label carries no information about actual market position at the current model accuracy.**

#### Test Set Misclassification Computation ($n=6$)

| Test Row | Actual Asking Price | Model Estimate | Price Difference | Percentage Diff | Model Assigned Label | Ground-Truth Assessment | Misclassification? |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | $\$75,000$ | $\$73,667$ | $+\$1,333$ | $+1.8\%$ | `FAIRLY_PRICED` | `FAIRLY_PRICED` | No |
| **2** | $\$70,000$ | $\$68,375$ | $+\$1,625$ | $+2.4\%$ | `FAIRLY_PRICED` | `FAIRLY_PRICED` | No |
| **3** | $\$65,000$ | $\$61,068$ | $+\$3,932$ | $+6.4\%$ | `FAIRLY_PRICED` | `FAIRLY_PRICED` | No |
| **4** | $\$145,000$ | $\$67,721$ | $+\$77,279$ | $+114.1\%$ | `ABOVE_MARKET` | `FAIRLY_PRICED` | **YES (MISLABELED)** |
| **5** | $\$140,000$ | $\$61,198$ | $+\$78,802$ | $+128.8\%$ | `ABOVE_MARKET` | `FAIRLY_PRICED` | **YES (MISLABELED)** |
| **6** | $\$135,000$ | $\$60,524$ | $+\$74,476$ | $+123.1\%$ | `ABOVE_MARKET` | `FAIRLY_PRICED` | **YES (MISLABELED)** |

- **Misclassification Fraction**: **3 out of 6 properties ($50.0\%$)** are falsely tagged as `ABOVE_MARKET` strictly due to model underestimation on unseen categories.

### D4. Exposure Surface in Codebase

- `app/api/price-prediction/route.ts:79`: Emits `pricePosition: valResult.pricePosition` in API response payload.
- `app/api/ai/price-estimate/route.ts:109`: Emits `pricePosition` and `positionDetails` in API response payload.
- `lib/ai/valuation/valuation-service.ts:91-120`: Logic implementation of `classifyPricePosition`.
- *UI Note*: Currently, `app/(public)/price-prediction/page.tsx` does NOT render the `pricePosition` string in JSX.

### D5. Decision

- **Recommendation**: **Option 1: Hide the label until model error is below the band width.**
- **Justification**:
  > **Because the $\pm 10\%$ classification band ($\$13,000$) is 3.0 times narrower than the test MAE ($\$39,574.45$), user-facing price position labels reflect model noise rather than true market pricing and misclassify 50% of test properties.**

---

## SECTION E — MODEL SELECTION & SPLIT INTEGRITY

### E1. Seeding & Reproducibility

In `lib/ai/valuation/preprocessor.ts:156-160`:
```typescript
const sorted = [...uniqueRecords].sort((a, b) => {
  const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
  if (timeDiff !== 0) return timeDiff;
  return a.id.localeCompare(b.id);
});
```
- **Seed Value**: No pseudo-random generator or RNG seed is used.
- **Reproducibility**: **VERIFIED**. The sort is 100% deterministic based on timestamp and CUID strings, producing identical splits byte-for-byte on repeated runs.

### E2. Stratification Analysis

| Property Type | Total in DB ($N=28$) | Training Split ($n=19$) | Validation Split ($n=3$) | Test Split ($n=6$) | Split Quality |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **HOUSE** | 4 | 3 (75%) | 1 (25%) | 0 (0%) | Skewed |
| **APARTMENT** | 4 | 3 (75%) | 1 (25%) | 0 (0%) | Skewed |
| **LAND** | 4 | 3 (75%) | 1 (25%) | 0 (0%) | Skewed |
| **COMMERCIAL** | 4 | 4 (100%) | 0 (0%) | 0 (0%) | Absent from test |
| **TOWNHOUSE** | 3 | 3 (100%) | 0 (0%) | 0 (0%) | Absent from test |
| **STUDIO** | 3 | 3 (100%) | 0 (0%) | 0 (0%) | Absent from test |
| **VILLA** | 3 | **0 (0%)** | 0 (0%) | **3 (100%)** | **DEFECTIVE (100% in test)** |
| **OFFICE** | 3 | **0 (0%)** | 0 (0%) | **3 (100%)** | **DEFECTIVE (100% in test)** |

- **Mechanism**: In `preprocessor.ts:198-203`, the spillover loop `while (test.length < testCount) test.push(train.pop()!)` drained the last two categories (`VILLA` and `OFFICE`) out of `train` into `test`.

### E3. Validation Set ($n=3$) Usage

- The validation set ($n=3$) was evaluated in `trainer.ts:176`, but was **bypassed during model selection**. Line 203 sorted candidates strictly on `testMetrics.rmse`.
- **Verdict**: The validation set was not used for hyperparameter tuning; the test set was the effective selection target.

### E4. StandardScaler Isolation & Persistence

- **Isolation**: Verified in `lib/ai/valuation/preprocessor.ts:279-283`. Scaler is fit exclusively on `X_train_raw`.
- **Persistence**: Scaler mean and standard deviation are persisted in `lib/ai/valuation/model-artifact.json:66-115`.
- **Status**: **VERIFIED**.

### E5. Feature Schema

The model utilizes $p = 22$ features:
1. `area`: Numerical (clamped $[10, 2000]\text{ m²}$)
2. `bedrooms`: Numerical (clamped $[0, 20]$)
3. `bathrooms`: Numerical (clamped $[0, 15]$)
4. `parking`: Numerical (clamped $[0, 10]$)
5. `isFurnished`: Binary ($0.0$ or $1.0$)
6. `areaPerBedroom`: Derived ratio ($\text{area} / \max(1, \text{bedrooms})$)
7. `bathBedRatio`: Derived ratio ($\text{bathrooms} / \max(1, \text{bedrooms})$)
8–14. `city_*` (7): Mogadishu, Hargeisa, Garowe, Baydhabo, Berbera, Bosaso, Kismayo (One-Hot)
15–22. `type_*` (8): House, Apartment, Villa, Townhouse, Land, Commercial, Office, Studio (One-Hot)

### E6. Feature Count ($p$) vs Sample Count ($n$)

- **Parameters**: $p = 22$ features
- **Training observations**: $n = 19$
- **Stability Statement**:
  > **With $p = 22 \ge n = 19$, ordinary least squares regression has no unique solution; Ridge regularization ($\lambda = 1.0$) is mathematically necessary to invert the singular matrix, and individual coefficient weights are unstable and sensitive to minor data perturbations.**

### E7. Model Artifact Integrity

- **Artifact File**: `lib/ai/valuation/model-artifact.json`
- **File Hash (SHA-256)**: `b005c8a9d263428b25fb6e7c4a2a65664c7b489cfc14e9b0e14868f14e3dc4ae`
- **Last-Modified**: `2026-10-04T11:30:00.150Z`
- **Intercept**: `57105.26315789474`
- **Regularization Parameter**: $\lambda = 1.0$

---

## SECTION F — PRODUCTION PATH INTEGRITY

### F1. Source Audit: `app/api/price-prediction/route.ts`

- **Line 10**: `import { estimatePropertyPrice } from "@/lib/ai/valuation/valuation-service";`
- **Line 49**: `const valResult = await estimatePropertyPrice({ features: ... });`
- **Verdict**: The old inverse-distance weighted k-NN formula has been **completely eliminated** from this route.

### F2. Source Audit: `app/api/ai/price-estimate/route.ts`

- **Line 14**: `import { estimatePropertyPrice } from "@/lib/ai/valuation/valuation-service";`
- **Line 101**: `const result = await estimatePropertyPrice({ ... });`
- **Verdict**: Canonical AI endpoint routes to the identical TypeScript Ridge valuation engine.

### F3. Endpoint Equivalence Benchmark

Using fixed input: `Mogadishu, HOUSE, 3 beds, 2 baths, 150 sqm, parking=1, askingPrice=$70,000`:
- `POST /api/price-prediction`: predictedPrice = **`$63,962`**
- `POST /api/ai/price-estimate`: estimatedPrice = **`$63,962`**
- **Comparison State**: **`IDENTICAL`**
- **UI Display**: The frontend page `app/(public)/price-prediction/page.tsx:53` consumes `/api/price-prediction`.

### F4. Confidence Interval Math

In `lib/ai/valuation/valuation-service.ts:259-278`:
```typescript
let uncertaintyStd = artifact.residualStdError; // $1,268 from train residuals
const marginUSD = Math.round(Math.min(estimatedPrice * 0.35, uncertaintyStd * 1.645));
const lowerPrice = Math.max(10000, estimatedPrice - marginUSD);
const upperPrice = estimatedPrice + marginUSD;
```

> [!CAUTION]
> **The confidence interval is a heuristic band, not a genuine out-of-sample prediction interval.**
> It multiplies the overfitted **training set** residual standard error ($\sigma_{\text{train}} = \$1,268$) by $1.645$, yielding a narrow band of $\pm \$2,086$ ($\pm 3.3\%$) that severely underestimates true prediction uncertainty ($\text{MAE} \approx \$39.5\text{k}$) by a factor of 19×.

### F5. Old Formula Residue Search

Command: `git grep -n -E "0\.6|CityMultiplier|inverse" -- app/api lib`
- Result: Only 1 occurrence found in `lib/recommendation-engine.ts:113` (`totalScore += BEDROOM_WEIGHT * 0.6;`), which is legitimate recommendation scoring logic.
- **Verdict**: Zero heuristic price formula residue remains in live valuation paths.

### F6. TensorFlow.js Residue & Permitted Fix

- `package.json:46`: `"@tensorflow/tfjs": "^4.22.0"`
- `app/(public)/price-prediction/page.tsx:85` (Prior Text):
  `Enter property details to get an estimated market price using our TensorFlow.js ML model`
- **Finding**: The backend executes native TypeScript linear algebra, NOT TensorFlow.js.
- **Permitted Fix 1 Applied (`app/(public)/price-prediction/page.tsx:85`)**:
  ```diff
  - Enter property details to get an estimated market price using our TensorFlow.js ML model
  + Enter property details to get an estimated market price using our supervised regression ML model
  ```

### F7. Chatbot Valuation Integration

- Grep of `app/api/ai-chat/route.ts` and `lib/chat-grounding-engine.ts` for `estimatePropertyPrice` returns **0 matches**.
- Querying the chatbot with `"Can you value my property? It is a 3-bedroom house in Mogadishu with 150 sqm."` returned:
  ```json
  {
    "intent": "PROPERTY_SEARCH",
    "reply": "Found 1 matching property in our database in Mogadishu, type HOUSE..."
  }
  ```
- **Verdict**: The architectural diagram showing Phase 3 valuation feeding the chatbot represents **ASPIRATIONAL / PROPOSED** behavior, not implemented code.

---

## SECTION G — CLAIMS LEDGER

| # | Prior Phase 3 Claim | Audit Verdict | Corrected Statement / Evidence |
| :---: | :--- | :---: | :--- |
| **1** | *"MAE = $39,574.45, RMSE = $54,387.85"* | **VERIFIED (OPTIMISTIC)** | Accurately computed on holdout set ($n=6$), but test set was reused for model selection, introducing optimistic selection bias. |
| **2** | *"Beating the Global Median Baseline by over $10,400 in MAE"* | **VERIFIED** | On the 6 test properties, Ridge MAE is $\$39,574.45$ vs Global Median MAE of $\$50,000.00$ ($\Delta = \$10,425.55$). |
| **3** | *"Eliminated rule-based heuristics"* | **VERIFIED** | Old hardcoded city multipliers, base prices, and inverse-distance heuristics were completely removed from valuation execution. |
| **4** | *"Genuine, audited ML regression engine"* | **PARTIAL** | Pipeline implements genuine linear algebra and tree regressors, but $p=22 \ge n=19$ limits stability, and target is asking price, not market value. |
| **5** | *"Anti-leakage partitioning"* | **PARTIAL** | Identity overlap is zero ($\text{Train} \cap \text{Test} = \emptyset$), but category draining placed 100% of Villas and Offices into the test set, creating extreme class starvation. |
| **6** | *"Machine Learning Property Valuation"* as user-facing feature | **DOWNGRADE** | Engine provides **Listing Asking-Price Estimation**, not cleared transaction valuation. |
| **7** | *"Comparable Property Intelligence using physical and location metrics"* | **PARTIAL** | Ranks properties by physical distance heuristic (0–100 score). The scoring weights are an unmeasured heuristic, not calibrated against human appraisal benchmarks. |
| **8** | *"Platform provides price confidence intervals"* | **DOWNGRADE** | Current interval ($\pm 1.645 \times \sigma_{\text{train}}$) is an uncalibrated heuristic band based on training residuals ($\$1,268$), underestimating test error by 19×. |
| **9** | *"RESEARCH_EXPERIMENTAL readiness verdict"* | **KEEP** | Formally accurate and substantiated by small sample size ($N=28$) and high variance. |

---

## SECTION H — END-TO-END USER PATH

### H1. User-Facing Prediction Output

For a 3-bedroom, 2-bathroom, 150 m² House in Mogadishu:
- **Estimated Price**: $\$63,962$
- **Price Range**: $\$61,876$ – $\$66,048$
- **Displayed Confidence**: $85\%$
- **Market Position**: `FAIRLY_PRICED` (Asking: $\$70,000$, diff: $+9.4\%$)
- **Top Comparable**: `"Spacious Modern House in Mogadishu"` ($\$65,000$, similarity score $76\%$)

### H2. User Conclusion vs Audit Reality

- **What User Concludes**:
  > *"The AI model has determined with 85% confidence that my property's real market clearing value is $\$63,962 \pm \$2,086$, and that an asking price of $\$70,000$ represents fair market value."*
- **What Audit Evidence Supports**:
  > *"The model estimates what a seller in this portal might ask based on 19 historical asking prices, with an out-of-sample error spread of $\$39,574$ that dwarfs the displayed confidence band."*

### H3. Chatbot Valuation Interaction

When prompted to value a property, the chatbot bypasses the ML engine entirely, routes the query to `PROPERTY_SEARCH`, and returns listing search results rather than a valuation estimate.

---

## SECTION I — FIX QUEUE

| # | Priority Category | Defect Description | Evidence Ref | Impact if Unfixed | Effort | Phase 4 Blocker? |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: |
| **1** | **User Misinformation** | User copy claims "TensorFlow.js ML model" | Section F6 | Users misled regarding underlying ML architecture | 5 min | **RESOLVED (Permitted Fix 1)** |
| **2** | **Correctness / Trust** | Price position labels ($\pm 10\%$) narrower than model MAE | Section D3 | 50% false label rate on test set | 30 min | **YES (Must Hide in UI)** |
| **3** | **Correctness** | Confidence intervals computed on train residuals ($\$1.2\text{k}$) | Section F4 | Misleading precision; underestimates error by 19× | 1 hour | **YES** |
| **4** | **Data Integrity** | Category-starved 19/3/6 split drains all Villas/Offices to test | Section E2 | Extreme variance on test set metrics | 1 hour | No (LOOCV available) |
| **5** | **Architecture** | Chatbot lacks valuation grounding tool | Section F7 | Architecture diagram contradicts live system | 2 hours | No (Phase 4 scope) |
| **6** | **Performance** | `@tensorflow/tfjs` in `package.json` unused | Section F6 | Unnecessary dependency bloat (~15MB bundle risk) | 10 min | No |

---

## SECTION J — WHAT WAS NOT CHECKED

1. **Sample Size Limits ($N = 28$)**:
   - $N=28$ observations cannot support statistical conclusions regarding general real estate market valuation in Somalia.
2. **Required Data Volume for Target Accuracy**:
   - Achieving original targets ($\text{MAE} < \$5,000$, $\text{MAPE} < 8.5\%$, $R^2 > 0.82$) across 7 cities and 8 property types would plausibly require **a minimum of $1,500–5,000$ validated listings**.
3. **Transaction / Deed Records**:
   - Zero real closed transaction prices or deed registry records exist anywhere in the database; all data reflects seller asking prices.
4. **Human Appraisal Validation**:
   - No certified professional real estate appraiser or surveyor has evaluated or benchmarked the model's predictions against reality.

---

## PERMITTED FIX EVIDENCE (Permitted Fix 1)

- **Target File**: `app/(public)/price-prediction/page.tsx:85`
- **Defect**: Factually false user-facing copy stating the valuation model runs on TensorFlow.js.
- **Before**:
  ```tsx
  <p className="text-[#64748B] mt-2">
    Enter property details to get an estimated market price using our TensorFlow.js ML model
  </p>
  ```
- **After**:
  ```tsx
  <p className="text-[#64748B] mt-2">
    Enter property details to get an estimated market price using our supervised regression ML model
  </p>
  ```
- **Verification**: `npm test` passed 181/181; `git diff` confirms exact single-line text correction.
