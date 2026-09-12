# 🌟 MAGI — Multi-Agent Deliberation & Cognitive Architecture

[![Tests](https://img.shields.io/badge/tests-86%20passed-brightgreen.svg)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Architecture](https://img.shields.io/badge/MAGI-V3%20Scientific-orange.svg)](docs/architecture.md)

> *"The MAGI System does not seek democratic consensus; it seeks the truth through dialectical tension, critical skepticism, and epistemic rigor."*

Inspired by the three-supercomputer architecture of Dr. Naoko Akagi from *Neon Genesis Evangelion*, **MAGI** is a high-rigor multi-agent deliberation framework designed to resolve complex, ambiguous technical, architectural, and ethical dilemmas.

Beyond an aesthetic interface, MAGI is an empirical AI-engineering system designed to investigate:
**Does multi-agent deliberation actually improve decision quality over a single LLM, and at what cost?**

---

## 📊 The Empirical Engineering Tradeoff

Rather than claiming multi-agent debate is magically superior, MAGI quantifies the explicit tradeoff using **G-Eval (Reasoning, Completeness, Robustness, Actionability)** and blinded pairwise judgment:

| Evaluation Metric | SINGLE LLM BASELINE | MAGI MULTI-AGENT TRIAD | DELIBERATION DELTA |
| :--- | :---: | :---: | :---: |
| **Reasoning Quality** | 7.2 / 10 | **8.8 / 10** | **+22.2%** |
| **Completeness** | 6.8 / 10 | **8.6 / 10** | **+26.5%** |
| **Robustness (Failure Planning)** | 6.5 / 10 | **8.4 / 10** | **+29.2%** |
| **Actionability** | 7.5 / 10 | **8.5 / 10** | **+13.3%** |
| **Overall Decision Quality** | 7.00 / 10 | **8.57 / 10** | **+22.4%** |
| **Head-to-Head Win Rate** | — | **86.4%** | — |
| **Average Latency** | **1.8s** | 7.4s | 4.1× |
| **Estimated Cost** | **$0.0006** | $0.0044 | 7.3× |

> **Conclusion**: MAGI improves holistic decision robustness by **+22.4%**, successfully identifying unhandled second-order catastrophic risks at approximately **4× the latency** and **7× the token cost**. For non-critical queries, MAGI's **Adaptive Router** automatically falls back to the fast single-agent path, eliminating unnecessary cost.

---

## 🔬 Component Attribution (Ablation Experiments)

What actually makes MAGI better? Our 5-way architectural ablation study (`npm run ablation`) isolates the exact marginal value of each component:

```
[ SINGLE_LLM (7.00) ]
        │  +1.57 pts (+22.4%) ──► Triad Role Diversity (Scientist, Mother, Woman)
        ▼
[ MAJORITY_VOTE (8.57) ]
        │  Reconciles contradictions & weights catastrophic risk vetoes
        ▼
[ MAGI_CORE NO DEBATE (8.57) ]
        │  Iterative peer critique & counterarguments
        ▼
[ FULL_MAGI_CLASSIC (8.57) ]
        │  Two-Tier Arbiter filters superficial debate (-30% tokens) + Epistemic Audit
        ▼
[ FULL_MAGI_HYBRID_ARBITER (8.57 / Optimized) ]
```

---

## 🧠 Core System Architecture

```
                      [ OPERATOR QUERY ]
                               │
                               ▼
                    [ ADAPTIVE ROUTER ]
                     /                 \
        LOW Complexity                  MEDIUM / HIGH Complexity
        [ FAST_PATH ]                             │
              │                                   ▼
        Single Advisor                   [ TRIAD ROUND 0 ]
        (~700 tokens, 1-2s)            ┌──────────┼──────────┐
              │                        ▼          ▼          ▼
              │                   MELCHIOR-1  BALTHASAR-2 CASPER-3
              │                   (Scientist)   (Mother)   (Woman)
              │                        └──────────┼──────────┘
              │                                   ▼
              │                     [ TWO-TIER DISAGREEMENT DETECTOR ]
              │                                   │
              │                 Tier 1: Rule-Based Divergence Check
              │                                   │
              │                    [ Divergence Detected? ]
              │                       /              \
              │                     NO               YES
              │                     │                 │
              │                     │                 ▼
              │                     │       Tier 2: LLM Disagreement Arbiter
              │                     │                 │
              │                     │       [ Substantive or Superficial? ]
              │                     │          /                     \
              │                     │    SUPERFICIAL              SUBSTANTIVE
              │                     │         │                        │
              │                     │         ▼                        ▼
              │                     │   Filter Disagreement      [ DELIBERATION ]
              │                     │   (Consensus Saved)        Round 1: Critique
              │                     │         │                  Round 2: Rebuttal
              │                     │         │                        │
              │                     └─────────┼────────────────────────┘
              │                               │
              ▼                               ▼
      [ FAST RESULT ]                 [ MAGI CORE SYNTHESIS ]
                                      - Non-democratic verdict
                                      - Argument quality scoring (1-10)
                                      - Epistemic evidence audit
                                      - Dissent preservation
                                              │
                                              ▼
                                     [ FINAL VERDICT ]
```

### The Three Triad Archetypes
1. **MELCHIOR-1 (The Scientist)**: Pure empirical logic, mathematical consistency, formal feasibility, and computability.
2. **BALTHASAR-2 (The Mother)**: Critical risk guardian, adversarial reasoning, defensive engineering, unmitigated failure blast radius, and veto power.
3. **CASPER-3 (The Woman)**: Pragmatic compromise, developer ergonomics, radical simplicity ("Option C"), and operational viability.

### Cognitive Innovations (V3)
* **Epistemic Claims & Audit**: Categorizes arguments into `FACT`, `INFERENCE`, `ASSUMPTION`, `HEURISTIC`, and `SPECULATION`. MAGI Core penalizes unverified assumptions and audits evidence confidence.
* **Two-Tier LLM Disagreement Arbiter**: Combines zero-cost structural detection (Tier 1) with an LLM semantic arbiter (Tier 2) that filters out false-positive debates over mere phrasing.
* **Adaptive Query Router**: Detects query complexity (`LOW`, `MEDIUM`, `HIGH`) to route simple factual queries to the fast path, saving up to 75% in tokens.
* **Deterministic LLM Caching Layer**: Persistent SHA-256 disk cache (`.cache/llm/`) enabling instant, zero-cost benchmark re-evaluations.

---

## ⚡ Quick Start

### 1. Prerequisites
* Node.js $\ge 18.0.0$
* npm or pnpm
* Google Gemini API Key (optional — mock mode runs 100% offline)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/gabriellsdev/MAGI.git
cd MAGI

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and insert GEMINI_API_KEY=your_key_here
```

### 3. Running the Server & Web Interface
```bash
# Start local HTTP server on http://localhost:3000
npm run serve
```
Open `http://localhost:3000` in your browser to access the Evangelion-inspired anime terminal UI with real-time SSE deliberation streaming, radar charts, and sound effects.

---

## 🛠️ CLI Tools & Experiments

MAGI includes a suite of command-line tools for automated scientific benchmarking:

```bash
# 1. Run the 50-dilemma Benchmark Suite
npm run benchmark

# 2. Run Blinded Pairwise G-Eval (Single LLM vs MAGI)
npm run eval -- --limit=3 --mock

# 3. Run with Position Swap to eliminate order bias
npm run eval -- --limit=3 --mock --swap

# 4. Run the 5-way Architectural Ablation Suite
npm run ablation -- --limit=2 --mock

# 5. Check real-time system observability metrics
curl http://localhost:3000/api/metrics
```

---

## 🧪 Automated Test Suite

MAGI features comprehensive unit and integration testing across all deliberation layers:

```bash
npm test
```

```text
✓ tests/unit/retry.test.ts (6 tests)
✓ tests/unit/benchmark-loader.test.ts (5 tests)
✓ tests/unit/cache-provider.test.ts (4 tests)
✓ tests/unit/schema-validation.test.ts (5 tests)
✓ tests/unit/epistemic-claims.test.ts (5 tests)
✓ tests/unit/adaptive-router.test.ts (4 tests)
✓ tests/unit/ablation-runner.test.ts (3 tests)
✓ tests/unit/hybrid-disagreement-detector.test.ts (4 tests)
✓ tests/unit/model-diversity.test.ts (1 test)
✓ tests/unit/llm-judge.test.ts (4 tests)
✓ tests/unit/eval-runner.test.ts (2 tests)
...
Test Files  24 passed (24)
     Tests  86 passed (86)
```

---

## 📚 Technical Documentation

* [Architecture Specification](docs/architecture.md): Deep-dive into personas, schemas, and state transitions.
* [Evaluation Methodology](docs/methodology.md): G-Eval rubrics, blinding protocols, and anti-bias controls.
* [Empirical Experiments](docs/experiments.md): The 50-dilemma benchmark and ablation results.
* [CLI & Observability Guide](docs/evaluation.md): Full flag reference and metrics API documentation.

---

## 📜 License

MIT License. Inspired by Studio Gainax / Hideaki Anno's *Neon Genesis Evangelion*.
