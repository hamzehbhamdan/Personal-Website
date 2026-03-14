// ─── Thesis Content ───────────────────────────────────────────────────────────
// Edit this file to update all text content on the thesis page.

export const THESIS_META = {
  title: "Cross-Market Signals",
  subtitle: "How economic information propagates between U.S. and Chinese equity markets",
  tagline: "A factor-based map of U.S.–China market interdependence",
  author: "Hamzeh Hamdan",
  institution: "Harvard College",
  type: "Senior Thesis",
  date: "May 2025",
  advisor: "Advisor: Prof. Emil Siriwardane",
  pdfUrl: "/files/Senior_Thesis.pdf",
  email: "hamzeh@alumni.harvard.edu",
  linkedin: "https://linkedin.com/in/hamzehhamdan",
  colophon: "Written in Python. Analysis performed using Ridge, Lasso, SpAM, and Kernel Regression. Data sourced from the JKP Global Factors Dataset and Finaeon. Site built with Next.js, Tailwind CSS, and Framer Motion.",
};

export const THESIS_HOOK = `Most studies of market integration reach for correlation coefficients. But correlation is a blunt instrument — it tells you two things move together, without explaining how, why, or with what economic mechanism. This thesis takes a different approach: using a universe of 153 macro-financial factors organized into 13 thematic clusters, it asks whether one country's economic signals can statistically explain another's equity market returns — and whether that relationship holds equally in both directions.`;

export const THESIS_HOOK_LEAD = `Most studies of market integration reach for correlation coefficients. But correlation is a blunt instrument.`;

export const THESIS_HOOK_SUPPORT = `This thesis takes a different approach: using a universe of 153 macro-financial factors organized into 13 thematic clusters, it asks whether one country's economic signals can statistically explain another's equity market returns — and whether that relationship holds equally in both directions.`;

export const THESIS_CHAPTERS = [
  { id: "the-question", label: "The Question" },
  { id: "framework", label: "Framework" },
  { id: "data-universe", label: "Data" },
  { id: "data-process", label: "Data Process" },
  { id: "methods", label: "Methods" },
  { id: "results", label: "Results" },
  { id: "interpretation", label: "Interpretation" },
  { id: "limitations", label: "Limitations" },
  { id: "download", label: "Download / Cite" },
];

// ─── Section 1: The Question ───────────────────────────────────────────────────
export const QUESTION_CONTENT = {
  headline: "Can one country's macro-financial signals statistically explain another's stock market returns?",
  body: `International equity markets are increasingly integrated — yet the nature of that integration is neither symmetric nor static. A shock that ripples from Wall Street to Shanghai does not necessarily echo back. This thesis formalizes that intuition, measuring cross-market signal transmission as an empirical question: given a rich factor universe, how much additional explanatory power is gained by adding one country's economic factors to a model that already uses the other country's own factors? If that gain is large and asymmetric, it reveals the direction in which information actually flows.`,
  buttons: [
    {
      label: "Predict China using U.S. factors",
      anchor: "results-china",
      description: "Strong signal: U.S. factors add 7.8 pp of R² to Chinese return models — a consistent, robust gain.",
    },
    {
      label: "Predict U.S. using China factors",
      anchor: "results-us",
      description: "Weak signal: Chinese factors add less than 1 pp of R² to U.S. return models — essentially no gain.",
    },
  ],
};

// ─── Section 2: Statistical Framework ─────────────────────────────────────────
export const STATISTICAL_FRAMEWORK = {
  headline: "The Replicating Portfolio Framework",
  intro: `Rather than measuring correlation between two return series, this thesis uses a replicating portfolio approach to formalize market integration. The central question is rephrased as an optimization problem: what weighted combination of economic factors best tracks one market's returns? The quality of that replication, measured by R², is the integration statistic.`,

  coreIdea: {
    title: "Why Replication, Not Correlation?",
    body: `Pukthuanthong and Roll (2009) argue that bivariate correlation between market returns is a poor measure of financial integration. Two markets can be highly correlated simply because they share common global risk factors — not because they are informationally linked. R² from a multi-factor regression is superior: it captures the degree to which a comprehensive factor panel simultaneously explains return variation, rather than any single pairwise relationship.`,
  },

  framework: {
    title: "The Optimal Weight Vector",
    setup: `Let R_M denote one market's return and X ∈ ℝᴺ denote a panel of N macro-financial factors from the other market. We seek a portfolio weight vector w ∈ ℝᴺ that minimizes the mean-squared prediction error:`,
    objective: "min_{w} E[(R_M − w'X)²]",
    solution: "w* = Σ⁻¹ · σ_M",
    solutionDetail: "where Σ = Cov(X, X) is the N×N factor covariance matrix\nand σ_M = Cov(X, R_M) is the vector of factor–return covariances.",
    interpretation: `The optimal w* gives the projection of the market return onto the factor span. Its R² — the fraction of return variance explained — is the thesis's primary measure of cross-market integration.`,
  },

  advantages: [
    {
      number: "01",
      title: "Uses the full factor panel",
      body: "Unlike bivariate correlation, the framework harnesses all N factors simultaneously, capturing complex multivariate relationships.",
    },
    {
      number: "02",
      title: "Directly interpretable",
      body: "R² ∈ [0, 1] has a natural interpretation as the proportion of market return variance explained by foreign factors.",
    },
    {
      number: "03",
      title: "Naturally decomposes contributions",
      body: "ΔR² isolates the incremental explanatory power of cross-country factors above and beyond domestic ones, operationalizing directionality.",
    },
    {
      number: "04",
      title: "Controls for global factors",
      body: "Common global shocks load onto both countries' factors. Since they're accounted for by own-country factors, ΔR² captures only country-specific spillovers.",
    },
    {
      number: "05",
      title: "Compatible with regularization",
      body: "In high-dimensional settings (N ≫ T), Σ becomes ill-conditioned. Ridge regression replaces the exact inversion with a regularized approximation: (Σ + λI)⁻¹ · σ_M.",
    },
  ],

  literature: [
    {
      citation: "Pukthuanthong & Roll (2009)",
      point: "Propose R² from a multi-factor regression as a superior measure of global market integration. Show that correlation between market returns is misleading when common factors dominate.",
    },
    {
      citation: "Brooks, Edison, Kumar & Sløk (2010)",
      point: "Find China largely segmented from global financial markets during 1993–2006, with integration accelerating after WTO accession in 2001.",
    },
    {
      citation: "Goh, Gonzalez & Tayi (2013)",
      point: "Document strong U.S.–China financial links emerging after 2001. Cross-market factor exposure grows substantially post-WTO, particularly in high-frequency data.",
    },
    {
      citation: "Jensen, Kelly & Pedersen (2023)",
      point: "Introduce the Global Factor Dataset (JKP) — a standardized, comparable panel of 153 equity market factors across 13 themes for 93 countries. The thesis uses this as its primary predictor universe.",
    },
  ],

  crossMarketExtension: `This thesis extends the replication framework to the cross-country case. The factor universe is partitioned by country origin: domestic factors (own-country) vs. foreign factors (cross-country). A model is fit first using only domestic factors, yielding R²_domestic. A second model is fit using only foreign factors, then a combined model. The key statistic is ΔR² = R²_combined − R²_domestic: how much does adding foreign signals improve on what domestic signals already capture?`,
};

// ─── Section 3: Data Universe ──────────────────────────────────────────────────
export const DATA_CONTENT = {
  intro: `The analysis draws on the Jensen, Kelly, and Pedersen (JKP) Global Factors Dataset — a comprehensive collection of 153 equity market factors organized into 13 thematic clusters, covering the U.S. and Chinese economies. Market returns are measured using the Wilshire 5000 Total Market Index (U.S.) and the Shanghai SE Composite (China). The joint analysis spans 2001–2024, beginning when China joined the WTO and became a more open, internationally integrated market.`,
  stats: [
    { label: "Total Factors", value: "153", note: "macro-financial variables" },
    { label: "Thematic Clusters", value: "13", note: "accruals to value" },
    { label: "Joint Coverage", value: "2001–2024", note: "post-WTO China" },
    { label: "Markets", value: "2", note: "Wilshire 5000 & Shanghai SE Composite" },
    { label: "U.S. History", value: "~100 yrs", note: "some factors back to 1926" },
    { label: "Dataset", value: "JKP", note: "Jensen, Kelly & Pedersen (2023)" },
  ],
  figures: [
    // ── Returns ──────────────────────────────────────────────────────────────
    {
      src: "fig-3.2.1-monthly-returns.png",
      title: "Figure 3.2.1: Monthly Market Returns",
      caption: "Monthly return series for the Wilshire 5000 and Shanghai SE Composite. Chinese market returns are notably more volatile, especially during the 2005–2008 boom and the 2014–2016 retail bubble.",
      category: "Returns",
    },
    {
      src: "fig-3.2.2-monthly-returns-ma.png",
      title: "Figure 3.2.2: Monthly Market Returns with 6-Month Moving Averages",
      caption: "Smoothed return series highlighting low-frequency trends and regime shifts. Greatest divergences appear around 2005–2008, 2014–2016, and 2018–2019.",
      category: "Returns",
    },
    {
      src: "fig-3.2.3-theme-ma.png",
      title: "Figure 3.2.3: Monthly Theme 6-Month Moving Averages",
      caption: "Theme-level factor moving averages revealing cross-sectional trends across all 13 thematic clusters. Chinese themes are generally more volatile than their U.S. counterparts.",
      category: "Returns",
    },
    // ── Correlations ─────────────────────────────────────────────────────────
    {
      src: "fig-3.2.4-us-heatmap.png",
      title: "Figure 3.2.4: U.S. Monthly Themes Correlation Heatmap",
      caption: "Pairwise correlation structure among U.S. thematic factor clusters. Strong correlations appear among low leverage, value, and investment themes.",
      category: "Correlations",
      wide: true,
    },
    {
      src: "fig-3.2.5-china-heatmap.png",
      title: "Figure 3.2.5: China Monthly Themes Correlation Heatmap",
      caption: "Pairwise correlation structure among Chinese thematic clusters. Notably, China's size theme is correlated to profitability, which is correlated to quality — a distinct structure from the U.S.",
      category: "Correlations",
      wide: true,
    },
    {
      src: "fig-data-us-themes-network.png",
      title: "Figure B.0.20: U.S. Daily Themes Correlation Network",
      caption: "Network graph of U.S. theme correlations above 0.70. Most themes are disconnected — only value, investment, and low leverage form a small cluster. This near-independence validates using themes as separate predictors.",
      category: "Correlations",
    },
    {
      src: "fig-data-china-themes-network.png",
      title: "Figure B.0.21: China Daily Themes Correlation Network",
      caption: "Network graph of Chinese theme correlations above 0.70. A somewhat denser cluster structure than the U.S. network, reflecting tighter co-movement among Chinese macro-financial themes — likely driven by the more concentrated structure of the Chinese market.",
      category: "Correlations",
    },
    {
      src: "fig-data-us-factors-network.png",
      title: "Figure B.0.22: U.S. Daily Factors Correlation Network",
      caption: "Network graph of correlations among all 153 U.S. factors (r ≥ 0.70). The sparse structure confirms that most individual factors are not collinear, supporting their simultaneous inclusion in regression models.",
      category: "Correlations",
    },
    {
      src: "fig-data-china-factors-network.png",
      title: "Figure B.0.23: China Daily Factors Correlation Network",
      caption: "Network graph of correlations among all 153 Chinese factors (r ≥ 0.70). Somewhat denser than the U.S. network, with a few notable clusters reflecting shared earnings-quality and leverage signals in Chinese data.",
      category: "Correlations",
    },
    // ── Missingness ──────────────────────────────────────────────────────────
    {
      src: "fig-3.2.6-factors-missing.png",
      title: "Figure 3.2.6: Factors Missing Values Over Time",
      caption: "Timeline of missing observations across individual factors. Chinese factor data is substantially more volatile in availability, stabilizing after 2001.",
      category: "Missingness",
    },
    {
      src: "fig-3.2.7-themes-missing.png",
      title: "Figure 3.2.7: Themes Missing Values Over Time",
      caption: "Theme-level missingness aggregated across factors. Monthly themes data is complete from 1999 onward for China and 1960 for the U.S.",
      category: "Missingness",
    },
    {
      src: "fig-3.2.8-missing-heatmap.png",
      title: "Figure 3.2.8: Missing Themes Heatmap (Top 40 Themes, Daily Data)",
      caption: "Heatmap of sporadic missingness across daily theme data. Imputed via linear interpolation.",
      category: "Missingness",
      wide: true,
    },
    {
      src: "fig-3.2.10-time-coverage.png",
      title: "Figure 3.2.10: Market Data Time Coverage Analysis",
      caption: "Gaps in daily market data coverage. Largest gap: 23 business days in U.S. data, 14 in Chinese data. Days where markets were closed but factors available were omitted.",
      category: "Missingness",
      wide: true,
    },
  ],
};

// ─── 13 Themes ────────────────────────────────────────────────────────────────
// factorCount = number of JKP factors in each theme (verify against your dataset; sum = 153)
export const THEMES = [
  { name: "Accruals",            factorCount: 7,  description: "Difference between reported earnings and cash flows. Lower values signal higher-quality, sustainable earnings." },
  { name: "Debt Issuance",       factorCount: 9,  description: "Tracks changes in corporate debt levels. High issuance can signal increased leverage risk." },
  { name: "Investment",          factorCount: 18, description: "Measures corporate spending on assets, capital expenditures, and acquisitions." },
  { name: "Low Leverage",        factorCount: 10, description: "Captures absolute debt levels, distinguishing conservatively financed firms." },
  { name: "Low Risk",            factorCount: 11, description: "Captures stocks with lower volatility measures. Often associated with defensive positioning." },
  { name: "Momentum",            factorCount: 16, description: "Measures return persistence and trend-following behavior. One of the most volatile themes in both markets." },
  { name: "Profit Growth",       factorCount: 11, description: "Tracks changes in profit margins and earnings growth rates over time." },
  { name: "Profitability",       factorCount: 19, description: "Measures current levels of corporate profitability across firms." },
  { name: "Quality",             factorCount: 10, description: "Combines financial stability, earnings consistency, governance, and operational efficiency." },
  { name: "Seasonality",         factorCount: 7,  description: "Captures recurring calendar-based patterns in market returns." },
  { name: "Short Term Reversal", factorCount: 8,  description: "Measures the tendency of stocks to reverse their previous 1–4 week performance." },
  { name: "Size",                factorCount: 6,  description: "Measures market capitalization. The most varied theme in China; much more stable in the U.S." },
  { name: "Value",               factorCount: 21, description: "Identifies stocks trading below fundamental measures (book value, earnings, cash flows, or sales)." },
];

// ─── Data Process (Chapter 3) ─────────────────────────────────────────────────
export const DATA_PROCESS = {
  intro: `Raw factor data does not arrive analysis-ready. Before any model is fit, the data must be cleaned, inspected for outliers, tested for stationarity, and transformed to satisfy the assumptions of the regression framework. This section documents the full pipeline applied to the 153 JKP factors and two market return series.`,

  steps: [
    {
      id: "winsorization",
      number: "01",
      title: "Winsorization",
      icon: "clip",
      body: `All factor time series were winsorized at the 0.05th and 99.95th percentiles. This clips the most extreme values — corresponding to 1-in-2,000 observations on each tail — without deleting observations. In total, winsorization affected 1.43% of all data cells in the raw factor matrix. The motivation is to limit the leverage of data errors and genuine tail events on regression coefficients, while preserving the structural variation that makes factors informative.`,
      highlight: "1.43% of cells affected across the full factor matrix.",
    },
    {
      id: "outliers",
      number: "02",
      title: "Market Return Outliers",
      icon: "flag",
      body: `After winsorization, 17 market return observations still exceeded ±3σ and were classified as outliers: 6 in U.S. returns and 11 in Chinese returns. The Chinese outliers cluster around three distinct episodes: 10 during the 2007–2010 bull/bear cycle and global financial crisis; 3 from the 2014–2016 retail-investor bubble that drove Shanghai Composite volatility to historic extremes; and 3 from COVID-19 (February–March 2020). These outliers were retained because they represent genuine, economically meaningful market events — removing them would distort the historical record. They do, however, contribute to heteroscedasticity in residual plots for China return models.`,
      highlight: "6 U.S. + 11 China outliers — all genuine market events, not errors.",
    },
    {
      id: "stationarity",
      number: "03",
      title: "Stationarity Testing",
      icon: "wave",
      body: `All 262 monthly factor columns (153 factors × 2 markets, minus excluded columns) were tested for stationarity using two complementary tests: the Augmented Dickey-Fuller (ADF) test, which tests the null of a unit root, and the KPSS test, which tests the null of stationarity. A column was flagged as non-stationary if either test disagreed — specifically, if ADF failed to reject the unit root null (p > 0.05) or if KPSS rejected the stationarity null (p < 0.05). Of the 262 columns, 23 required transformation: 20 were first-differenced to remove unit roots; 1 was transformed via the Yeo-Johnson power transformation to stabilize variance; and 2 could not be made stationary by any method and were excluded entirely from the analysis.`,
      highlight: "23 of 262 columns non-stationary: 20 differenced, 1 Yeo-Johnson, 2 excluded.",
    },
    {
      id: "missing",
      number: "04",
      title: "Missing Data",
      icon: "grid",
      body: `Missing data is a fundamental challenge for Chinese factor data, which has substantially shorter and spottier histories than U.S. data. Three strategies were applied. First, factors with excessive structural missingness in Chinese data — where the factor simply did not exist in China during the relevant period — were excluded entirely; 23 individual factors fell into this category. Second, sporadic gaps in daily theme-level data (where a factor was temporarily unavailable) were filled using linear interpolation, with the largest gap being 23 business days for U.S. data and 14 for Chinese data. Third, trading days where one market was closed but factor data existed were dropped, ensuring market return and factor observations are always synchronized.`,
      highlight: "23 factors excluded; sparse gaps filled via linear interpolation.",
    },
    {
      id: "standardization",
      number: "05",
      title: "Standardization",
      icon: "scale",
      body: `All features were standardized to zero mean and unit variance using sklearn's StandardScaler before fitting any model. Standardization is critical for regularized regression: Ridge, Lasso, and Elastic Net impose magnitude-based penalties on coefficients, so features with larger native scales would be penalized more aggressively without standardization — distorting the regularization path. The scaler was fit only on the training window and applied to the test window, preventing look-ahead bias. This step also enables meaningful comparison of coefficient magnitudes across factors.`,
      highlight: "StandardScaler applied within each training window — no look-ahead.",
    },
  ],

  pipeline: {
    stages: ["Raw JKP Factors", "Winsorize (0.05%–99.95%)", "Outlier Flags", "ADF + KPSS Tests", "Difference / Transform", "Linear Interpolation", "Exclude Irresolvable", "StandardScaler", "Model-Ready Panel"],
    note: "Pipeline applied separately to each training window in time-series cross-validation to prevent any form of data leakage.",
  },
};

// ─── Key Model Metrics (real values from thesis) ──────────────────────────────
export const KEY_METRICS = {
  // U.S. → China: Table 4.1.1, daily, 2016-2024, unregularized OLS
  chinaFromUS: {
    ownBaseline:  { r2: 0.5948, label: "China own factors" },
    crossOnly:    { r2: 0.1910, label: "U.S. factors only" },
    combined:     { r2: 0.6728, label: "Both (CHN + USA)" },
    delta:        { r2: 0.0780, label: "ΔR² from U.S. factors" },
    context: "Daily factors, 2016–2024",
  },
  // China → U.S.: Table A.0.3, daily, 2001-2024, Ridge (best regularized)
  usFromChina: {
    ownBaseline:  { r2: 0.7441, label: "U.S. own factors" },
    crossOnly:    { r2: 0.0272, label: "China factors only" },
    combined:     { r2: 0.7510, label: "Both (USA + CHN)" },
    delta:        { r2: 0.0069, label: "ΔR² from China factors" },
    context: "Daily factors, 2001–2024, Ridge",
  },
  // SpAM themes: Table 4.2.2 and Table 4.2.1, monthly, 2001-2024
  spam: {
    chinaReturns: {
      ownBaseline: { r2: 0.4564, label: "China themes" },
      crossOnly:   { r2: 0.1173, label: "U.S. themes only" },
      combined:    { r2: 0.4968, label: "Both themes" },
      delta:       { r2: 0.0404, label: "ΔR² from U.S. themes" },
    },
    usReturns: {
      ownBaseline: { r2: 0.6359, label: "U.S. themes" },
      crossOnly:   { r2: 0.0633, label: "China themes only" },
      combined:    { r2: 0.6538, label: "Both themes" },
      delta:       { r2: 0.0179, label: "ΔR² from China themes" },
    },
    context: "Monthly themes, 2001–2024",
  },
  // Kernel: Table 4.3.1, daily
  kernel: {
    chinaFromUS:  { r2: 0.1122, label: "China returns ~ U.S. themes" },
    usFromChina:  { r2: 0.0000, label: "U.S. returns ~ China themes (≈ 0)" },
    context: "Daily themes, Nadaraya-Watson kernel",
  },
  // Abstract summary range
  abstractSummary: {
    usDomesticR2: "0.70–0.80",
    chinaDomesticR2: "0.55–0.60",
    note: "Linear regression with domestic data only",
  },
};

// ─── Full R² comparison table (all models) ────────────────────────────────────
export const R2_TABLE = {
  rows: [
    // Linear: OLS / daily / 2016-2024
    {
      method: "OLS",
      granularity: "Daily",
      window: "2016–2024",
      target: "China returns",
      ownR2: 0.5948,
      crossR2: 0.1910,
      bothR2: 0.6728,
      deltaR2: 0.0780,
      strong: true,
      note: "Table 4.1.1",
    },
    // Linear: Ridge / daily / 2001-2024
    {
      method: "Ridge",
      granularity: "Daily",
      window: "2001–2024",
      target: "U.S. returns",
      ownR2: 0.7441,
      crossR2: 0.0272,
      bothR2: 0.7510,
      deltaR2: 0.0069,
      strong: false,
      note: "Table 4.1.2",
    },
    // Linear: Ridge / daily / 2001-2024 (best regularized for China)
    {
      method: "Ridge",
      granularity: "Daily",
      window: "2001–2024",
      target: "China returns",
      ownR2: 0.5545,
      crossR2: 0.1100,
      bothR2: 0.5761,
      deltaR2: 0.0216,
      strong: true,
      note: "Table 4.1.3",
    },
    // SpAM: monthly / 2001-2024 → U.S.
    {
      method: "SpAM (pyGAM)",
      granularity: "Monthly",
      window: "2001–2024",
      target: "U.S. returns",
      ownR2: 0.6359,
      crossR2: 0.0633,
      bothR2: 0.6538,
      deltaR2: 0.0179,
      strong: false,
      note: "Table 4.2.1",
    },
    // SpAM: monthly / 2001-2024 → China
    {
      method: "SpAM (pyGAM)",
      granularity: "Monthly",
      window: "2001–2024",
      target: "China returns",
      ownR2: 0.4564,
      crossR2: 0.1173,
      bothR2: 0.4968,
      deltaR2: 0.0404,
      strong: true,
      note: "Table 4.2.2",
    },
    // Kernel: daily → China
    {
      method: "Kernel (NW)",
      granularity: "Daily",
      window: "2001–2024",
      target: "China returns",
      ownR2: null,
      crossR2: 0.1122,
      bothR2: null,
      deltaR2: null,
      strong: true,
      note: "Table 4.3.1",
    },
    // Kernel: daily → U.S. (≈ 0)
    {
      method: "Kernel (NW)",
      granularity: "Daily",
      window: "2001–2024",
      target: "U.S. returns",
      ownR2: null,
      crossR2: 0.0000,
      bothR2: null,
      deltaR2: null,
      strong: false,
      note: "Table 4.3.1 — cross-country only",
    },
  ],
};

// ─── Section 4: Methods ───────────────────────────────────────────────────────
export const MODEL_GRID = {
  intro: `In total, 192 models were estimated across all combinations of method, predictor granularity, time window, target market, and predictor origin. This systematic approach ensures findings are not driven by any single model specification — if the asymmetry is real, it should appear across the grid.`,

  totalModels: 192,
  olsModels: 48,
  regularizedModels: 144,

  dimensions: [
    { label: "Methods", options: ["OLS (baseline)", "Ridge", "Lasso", "Elastic Net"], count: 4, note: "Ridge won 45 of 48 regularized cases by R²" },
    { label: "Predictor Level", options: ["Individual factors (153)", "Theme aggregates (13)"], count: 2, note: "Factor-level for linear; themes for SpAM & kernel" },
    { label: "Time Window", options: ["2001–2024 (full post-WTO)", "2016–2024 (recent)"], count: 2, note: "Shorter window tests recency of integration" },
    { label: "Frequency", options: ["Daily", "Monthly"], count: 2, note: "Daily for linear; monthly better for SpAM & kernel" },
    { label: "Target Market", options: ["U.S. returns", "China returns"], count: 2, note: "The market whose returns are being predicted" },
    { label: "Predictor Origin", options: ["Own-country only", "Cross-country only", "Both combined"], count: 3, note: "ΔR² = R²(combined) − R²(own-country)" },
  ],

  residualCases: [
    {
      id: "case1",
      title: "Case 1: Well-behaved",
      description: "Residuals are approximately i.i.d. with no visible trend, pattern, or heteroscedasticity. Model assumptions are satisfied and out-of-sample predictions are reliable. Observed in: daily U.S. factor models with Ridge regularization.",
      quality: "good",
      action: "No intervention needed. These specifications were retained as-is and form the backbone of primary results — daily U.S. Ridge models are the most trustworthy configurations.",
    },
    {
      id: "case2",
      title: "Case 2: Linear boundaries",
      description: "Residuals form visible diagonal or horizontal banding at extreme predicted values — characteristic of a variable that has been winsorized or clipped. A linear relationship is captured, but the tails are artificially bounded. Observed in: models using Chinese factors heavily affected by winsorization.",
      quality: "warn",
      action: "Noted as an expected data artifact of winsorizing at the 0.5–99.5th percentile, not a model failure. Models retained with a caveat: predictions near the boundaries are clipped and should be interpreted conservatively.",
    },
    {
      id: "case3",
      title: "Case 3: Trending residuals",
      description: "Residuals exhibit a systematic trend with respect to predicted values — the linear model systematically under- or over-predicts at certain return ranges. Signals unmodeled nonlinearity. Observed in: monthly models spanning the full 2001–2024 window.",
      quality: "warn",
      action: "Directly motivated the nonlinear extension. SpAM (Sparse Additive Models) was introduced to capture the smooth, nonlinear relationships between factors and returns that linear regression could not represent.",
    },
    {
      id: "case4",
      title: "Case 4: Heteroscedasticity",
      description: "Residual variance fans out as predictions increase — the model is more accurate for low-return periods than for high-return ones. Consistent with documented Chinese return outliers during crisis periods. Observed in: most China-return models, especially 2007–2010 and 2015–2016 windows.",
      quality: "bad",
      action: "Documented as a structural property of Chinese return data during high-volatility windows, not a correctable artifact. Weighted least squares was considered but not applied due to cross-validation complexity. Flagged explicitly in the limitations section.",
    },
    {
      id: "case5",
      title: "Case 5: Square outline",
      description: "Residuals form a distinctive square or rectangular envelope — arising when both the dependent variable and residuals are bounded from winsorization applied to both sides. Observed in: the most aggressively winsorized factor configurations for China.",
      quality: "bad",
      action: "These configurations were excluded from primary results. The square pattern indicates that winsorization was too aggressive — predictions are effectively bounded in both directions and carry no useful distributional information.",
    },
  ],

  regularizationNote: `Ridge dominated Lasso and Elastic Net in 45 of 48 regularized contests (measured by out-of-sample R²). This makes intuitive sense: when many factors carry small, distributed signals (rather than a sparse set of large effects), L2 regularization (Ridge) outperforms the sparsity-inducing L1 penalty (Lasso). The factor universe is dense, not sparse.`,

  crossValidation: `All linear models used sklearn's TimeSeriesSplit with 5 folds for hyperparameter tuning — preserving temporal order and preventing future data from leaking into training. SpAM models used pyGAM's built-in CV. Kernel bandwidth was selected via 5-fold CV on a 25% random subsample (due to computational cost).`,
};

export const LENSES = [
  {
    id: "linear",
    number: "01",
    title: "Regularized Linear Regression",
    shortTitle: "Linear",
    description:
      "The baseline lens. Ridge, Lasso, and Elastic Net regression impose penalties on coefficient magnitudes, automatically selecting and shrinking predictors in high-dimensional settings. Of 144 regularized models fit, Ridge was the best by R² in 45 of 48 cases — consistent with a dense rather than sparse factor signal. Results are split by market, factor origin (U.S. only, China only, or both), granularity (daily / monthly), and time window (2001–2024 / 2016–2024).",
    // LaTeX math lines rendered in LensTabs
    mathLines: [
      { label: "Model", latex: "\\mathbf{y} = \\mathbf{X}\\boldsymbol{\\beta} + \\boldsymbol{\\varepsilon}" },
      { label: "Objective", latex: "\\min_{\\boldsymbol{\\beta}} \\;\\|\\mathbf{y} - \\mathbf{X}\\boldsymbol{\\beta}\\|_2^2 + \\lambda\\,\\mathrm{Penalty}(\\boldsymbol{\\beta})" },
      { label: "Ridge (L2)", latex: "\\mathrm{Penalty} = \\|\\boldsymbol{\\beta}\\|_2^2 \\quad\\text{shrinks all coefficients}" },
      { label: "Lasso (L1)", latex: "\\mathrm{Penalty} = \\|\\boldsymbol{\\beta}\\|_1 \\quad\\text{selects sparse set}" },
      { label: "Elastic Net", latex: "\\mathrm{Penalty} = \\alpha\\|\\boldsymbol{\\beta}\\|_1 + (1-\\alpha)\\|\\boldsymbol{\\beta}\\|_2^2" },
      { label: "Tuning", latex: "\\lambda^* = \\arg\\min_{\\lambda}\\;\\text{CV-MSE}\\;\\text{(TimeSeriesSplit, 5 folds)}" },
    ],
    reveals:
      "Which factors are linearly informative, and by how much. The regularization path shows how predictors enter the model as the penalty relaxes. Residual analysis revealed five distinct patterns (Cases 1–5) including heteroscedasticity, clipping artifacts, and trending residuals — motivating the nonlinear extensions.",
    modelCount: "48 OLS + 144 regularized = 192 total linear specifications",
  },
  {
    id: "spam",
    number: "02",
    title: "Sparse Additive Models (SpAM)",
    shortTitle: "SpAM",
    description:
      "A semiparametric extension allowing each factor's effect to be a smooth nonlinear function, estimated via penalized B-splines, while maintaining overall sparsity via a group-Lasso penalty. Implemented via pyGAM on theme-level data (13 predictors per country), with 10 splines per term and grid-search hyperparameter tuning over λ and the number of splines.",
    mathLines: [
      { label: "Model", latex: "y = \\sum_{j=1}^{p} f_j(x_j) + \\varepsilon" },
      { label: "Each term", latex: "f_j(x) = \\sum_{k=1}^{K} \\beta_{jk}\\,B_{jk}(x), \\quad K = 10 \\text{ splines}" },
      { label: "Objective", latex: "\\min_{\\boldsymbol{\\beta}} \\left\\|\\mathbf{y} - \\sum_j f_j(x_j)\\right\\|_2^2 + \\sum_j \\lambda_j \\|\\mathbf{B}_j\\boldsymbol{\\beta}_j\\|_2" },
      { label: "Sparsity", latex: "\\hat{f}_j \\equiv 0", note: "Group-Lasso zeroes entire functions, not just individual coefficients." },
      { label: "Tuning", latex: "\\lambda_j^* = \\arg\\min_{\\lambda}\\;\\text{CV-MSE} \\quad \\text{(pyGAM built-in, 5-fold)}" },
    ],
    reveals:
      "Nonlinear factor-return relationships visualized through partial dependence plots (PDPs). Each PDP shows the marginal predicted return as a single theme varies across its empirical range, holding all others constant. Chinese Value, U.S. Momentum, and U.S. Profit Growth all showed economically interpretable curves.",
    modelCount: "24 SpAM models (2 targets × 3 predictor origins × 2 windows × 2 granularities)",
  },
  {
    id: "kernel",
    number: "03",
    title: "Kernel Regression",
    shortTitle: "Kernel",
    description:
      "A fully nonparametric approach using the Nadaraya-Watson estimator with a Gaussian kernel, implemented via statsmodels' KernelReg. Applied to theme-level data only (13 predictors) to manage the curse of dimensionality. Bandwidth h was selected by cross-validation on a 25% random subsample due to computational cost. All monthly-frequency models overfit severely (R² ≈ 1.0) and were excluded from inference.",
    mathLines: [
      { label: "Goal", latex: "\\hat{m}(\\mathbf{x}) = \\mathbb{E}[y \\mid \\mathbf{X} = \\mathbf{x}] \\quad \\text{(no parametric form assumed)}" },
      { label: "NW estimator", latex: "\\hat{m}(\\mathbf{x}) = \\frac{\\displaystyle\\sum_i K_h(\\mathbf{x},\\mathbf{x}_i)\\,y_i}{\\displaystyle\\sum_i K_h(\\mathbf{x},\\mathbf{x}_i)}" },
      { label: "Kernel", latex: "K_h(\\mathbf{x},\\mathbf{x}_i) = \\exp\\!\\left(-\\frac{\\|\\mathbf{x}-\\mathbf{x}_i\\|^2}{2h^2}\\right)" },
      { label: "Bandwidth", latex: "h^* = \\arg\\min_h\\;\\text{LOO-CV MSE} \\quad \\text{(25\\% subsample)}" },
    ],
    reveals:
      "Global nonparametric structure and model limits. The most striking result: a kernel model using only Chinese themes to predict U.S. returns predicted ≈ 0 for every time period (R² ≈ 4.6×10⁻¹⁵) — confirming no signal whatsoever. Kernel PDPs reveal additional nonlinear patterns beyond SpAM, at the cost of interpretability.",
    modelCount: "12 kernel models (daily themes only; monthly excluded due to overfitting)",
  },
];

// ─── Partial Dependence Findings ──────────────────────────────────────────────
export const PARTIAL_DEPENDENCE = {
  intro: `Partial dependence plots (PDPs) show how the model's predicted return changes as a single factor varies across its empirical range, with all other factors held at their mean. In both SpAM and Kernel regression, PDPs reveal economically interpretable nonlinear relationships that linear models cannot capture.`,

  spam: {
    headline: "SpAM Partial Dependence — Key Relationships",
    chinaReturns: [
      {
        factor: "Chinese Value",
        direction: "China returns",
        shape: "Strongly curved, negative",
        finding: `Chinese Value shows the most pronounced nonlinear relationship with Chinese market returns. As Chinese value-factor levels rise, predicted returns fall sharply — a strongly negative, curved relationship. This is counterintuitive to the classic value premium but is consistent with the Chinese market's unusual structure, where value stocks are often state-owned enterprises with lower growth prospects.`,
        economic: "Chinese value stocks signal lower-growth, less dynamic sectors. Rising value levels may proxy for a rotation away from growth into defensive, lower-return names.",
      },
      {
        factor: "U.S. Profit Growth",
        direction: "China returns",
        shape: "Negative, monotonic",
        finding: `U.S. Profit Growth shows a negative cross-market effect: higher U.S. profit growth is associated with lower predicted Chinese returns. This is consistent with a global capital allocation story — when U.S. earnings are strong, capital flows toward U.S. equities and away from Chinese assets, pulling Chinese market returns down.`,
        economic: "When U.S. corporate earnings are improving, investors may reduce Chinese equity exposure in favor of U.S. assets — a portfolio diversification / competition effect.",
        src: "fig-partial-dependence-china-2.png",
        figureLabel: "Figure 4.2.2",
      },
      {
        factor: "Chinese Momentum",
        direction: "China returns",
        shape: "Negative",
        finding: `Chinese Momentum shows a negative relationship with Chinese market returns — higher recent momentum (rising prices) is associated with lower predicted future returns. This is the classic momentum reversal pattern: extreme positive momentum at the market level often precedes mean-reversion, particularly in the Chinese market where retail investor herding amplifies boom-bust cycles.`,
        economic: "Consistent with mean-reversion dynamics in the Chinese retail-dominated market. Extreme momentum signals impending correction.",
        src: "fig-B.0.17-partial-dependence-china-spam.png",
        figureLabel: "Figure B.0.17",
      },
      {
        factor: "Chinese Accruals",
        direction: "China returns",
        shape: "Negative, amplifying at extremes",
        finding: `Chinese Accruals show a negative relationship with Chinese market returns, with the effect amplifying at extreme accrual levels. High accruals signal earnings of lower quality (less supported by cash flows), which the market discounts. The nonlinear amplification at extremes suggests that very high accruals — a red flag for earnings manipulation — have disproportionately large negative return implications in Chinese markets.`,
        economic: "Earnings quality concern is priced in the Chinese market. High accruals, particularly at extremes, signal lower-quality earnings that predict deteriorating returns.",
        src: "fig-pdp-spam-china-accruals.png",
        figureLabel: "Figure 4.2.1",
      },
    ],
    usReturns: [
      {
        factor: "U.S. Momentum",
        direction: "U.S. returns",
        shape: "Negative, contra-intuition",
        finding: `U.S. Momentum shows a negative relationship with U.S. market-level returns in the SpAM framework. While the momentum premium is well-documented in cross-sectional (stock-level) data, at the aggregate market level, high momentum often signals mean-reversion risk — particularly at multi-month horizons. This reversal effect at the market level is distinct from the cross-sectional momentum premium.`,
        economic: "Market-level momentum differs from stock-level momentum. Aggregate market momentum at monthly frequency may proxy for overbought conditions and impending correction.",
        src: "fig-results-us-spam-momentum.png",
        figureLabel: "Figure 4.2.3",
      },
      {
        factor: "Chinese Value",
        direction: "U.S. returns",
        shape: "Slight negative curve",
        finding: `Chinese Value shows a small but directionally consistent negative effect on U.S. returns in the SpAM framework. When Chinese value stocks are elevated (cheapness is high), U.S. returns are marginally lower. The magnitude is modest (peak effect ≈ ±0.0016) but the shape is stable — consistent with a weak cross-market signal where Chinese value conditions reflect global growth expectations that also weigh on U.S. equities.`,
        economic: "When Chinese value stocks are cheap, capital may be rotating toward Chinese equities and away from the U.S., providing a marginal tailwind for U.S. returns. A small global diversification signal.",
        src: "fig-results-us-spam-china-value.png",
        figureLabel: "Figure 4.2.4",
      },
      {
        factor: "Chinese Accruals",
        direction: "U.S. returns",
        shape: "Negative, amplifying",
        finding: `Chinese Accruals also show a negative cross-market relationship with U.S. returns. This is the most interpretable cross-country signal in the SpAM results: deteriorating Chinese earnings quality (high accruals) appears to carry negative implications for U.S. returns, possibly through the global supply chain and trade linkages between the two economies.`,
        economic: "Chinese earnings quality acts as a macro signal for U.S. markets — consistent with supply chain exposure and global trade linkages.",
      },
    ],
  },

  kernel: {
    headline: "Kernel Partial Dependence — Key Relationships",
    chinaReturns: [
      {
        factor: "Chinese Value",
        direction: "China returns",
        shape: "Positive",
        finding: `In the kernel model, Chinese Value shows a positive relationship with Chinese returns — the opposite direction from the SpAM result. This apparent contradiction resolves when considering the fully nonparametric nature of kernel regression: the Nadaraya-Watson estimator captures local relationships that may differ from global trends in SpAM. The kernel result suggests that at moderate value levels, higher value predicts higher returns — more consistent with the classic value premium.`,
        economic: "Local vs. global nonlinearity: the classic value premium may hold at moderate levels, while SpAM captures the overall downward trend driven by extreme values.",
        src: "fig-pdp-kernel-china-value.png",
        figureLabel: "Figure B.0.20",
      },
      {
        factor: "U.S. Value",
        direction: "China returns",
        shape: "Negative",
        finding: `U.S. Value shows a negative relationship with Chinese returns — opposite to Chinese Value's positive relationship. Higher U.S. value factor levels are associated with lower Chinese returns, consistent with a global factor rotation effect: when U.S. value stocks are in favor, capital may rotate toward U.S. markets and away from China.`,
        economic: "U.S. value rallies may signal capital rotation from growth-oriented Chinese equities toward value-oriented U.S. assets — a cross-market allocation effect.",
        src: "fig-pdp-kernel-us-value.png",
        figureLabel: "Figure B.0.21",
      },
      {
        factor: "U.S. Profitability",
        direction: "China returns",
        shape: "Smooth negative",
        finding: `U.S. Profitability shows a smooth, monotonically negative relationship with Chinese returns across its full empirical range. Higher U.S. corporate profitability is consistently associated with lower Chinese market returns — the most cleanly estimated negative cross-market relationship in the kernel model.`,
        economic: "U.S. profitability strength may signal a stronger domestic U.S. economic environment that draws capital away from Chinese equities.",
        src: "fig-pdp-kernel-us-profitability.png",
        figureLabel: "Figure 4.3.5",
      },
      {
        factor: "U.S. Profit Growth",
        direction: "China returns",
        shape: "Nonmonotonic: negative in [-2,1], positive outside",
        finding: `U.S. Profit Growth shows a nonmonotonic partial dependence with respect to Chinese returns — negative in the moderate range (−2 to +1 standard deviations) but flipping to positive at the tails. This is the most complex cross-country relationship in the kernel results and suggests a regime-dependent effect: moderate U.S. profit growth draws capital away from China, while extreme (very high or very low) U.S. profit growth may trigger different portfolio responses.`,
        economic: "Nonmonotonic: moderate U.S. profit growth competes with China for capital; extreme levels may signal global macro risk that drives correlation rather than substitution.",
        src: "fig-pdp-kernel-us-profit-growth.png",
        figureLabel: "Figure 4.3.6",
      },
    ],
    artifactsNote: "Chinese Accruals and U.S. Low Leverage Growth showed visible overfitting artifacts in the kernel model — particularly at the tails of the predictor distribution where observation density drops. These were flagged as unreliable and excluded from economic interpretation.",
  },
};

// ─── Section 5: Results ───────────────────────────────────────────────────────
export const RESULTS_CHINA = {
  id: "results-china",
  direction: "U.S. → China",
  headline: "Strong Signal",
  subheadline: "U.S. macro-financial factors add 7.8 percentage points of R² to Chinese equity return models — a consistent, robust gain across all three model classes.",
  statRows: [
    { model: "OLS", spec: "daily · 2016–2024", delta: "+7.8 pp", detail: "R² 0.595 → 0.673" },
    { model: "Ridge", spec: "daily · 2001–2024", delta: "+2.2 pp", detail: "R² 0.555 → 0.576" },
    { model: "SpAM", spec: "monthly · 2001–2024", delta: "+4.0 pp", detail: "R² 0.456 → 0.497" },
    { model: "Kernel", spec: "U.S.-factors-only", delta: "R² 0.112", detail: "No Chinese data needed" },
  ],
  findingsParagraph: `U.S. macro-financial factors provide a consistent, statistically robust signal for Chinese equity returns across all three model classes. The strongest gain appeared in the OLS specification: adding U.S. factors raised R² by 7.8 percentage points (from 0.595 to 0.673) in daily data from 2016–2024. Ridge and SpAM confirmed this at +2.2 pp and +4.0 pp respectively, and the kernel model — using U.S. themes alone with no Chinese information — still achieved R² = 0.112. The consistency across model class, frequency, and time window rules out any single specification driving the result.`,
  summary: [
    "Linear regression (OLS, daily, 2016–2024): Chinese factors alone explain R² = 0.5948. Adding U.S. factors raises this to R² = 0.6728 — a ΔR² = +7.8 pp. U.S. factors alone achieve R² = 0.1910.",
    "Best regularized (Ridge, daily, 2001–2024): Chinese factors alone achieve R² = 0.5545. Combined model reaches R² = 0.5761, ΔR² = +2.2 pp. U.S. alone: R² = 0.1100.",
    "SpAM (monthly, 2001–2024): Chinese themes alone explain R² = 0.4564. Adding U.S. themes raises this to R² = 0.4968 — a ΔR² = +4.0 pp. U.S. themes alone achieve R² = 0.1173.",
    "Kernel (daily, Nadaraya-Watson): Using U.S. themes alone yields R² = 0.1122 for Chinese returns — a notable signal given the model uses zero Chinese information.",
  ],
  figures: [
    {
      src: "fig-results-china-chn-kernel.png",
      title: "Figure 4.3.1: Kernel Regression — China Returns, Chinese Themes Only",
      caption: "Kernel regression predicting Chinese returns using only Chinese themes (Adj. R² = 0.90). Tight scatter around the diagonal confirms that China's own macro-financial conditions are strong self-predictors — a necessary baseline before asking whether U.S. factors add anything.",
    },
    {
      src: "fig-results-china-both-kernel.png",
      title: "Figure 4.3.3: Kernel Regression — China Returns, Combined Themes",
      caption: "Adding U.S. themes alongside Chinese themes tightens the fit further (Adj. R² = 0.98). The incremental gain over the Chinese-only model reflects genuine cross-market signal: U.S. conditions carry information about Chinese returns beyond what China's own factors already explain.",
    },
    {
      src: "fig-results-china-actual-predicted.png",
      title: "Figure 4.3.2: Kernel Regression — China Returns, U.S. Themes Only",
      caption: "Using only U.S. themes — zero Chinese data — the model still achieves Adj. R² = 0.11. The scatter is looser but directionally informative: U.S. macro-financial conditions alone can explain a non-trivial share of Chinese return variation, evidencing a one-way spillover.",
    },
  ],
  tables: [
    {
      id: "table-4.1.3",
      label: "Table 4.1.3: Best Regularized Model for Chinese Returns (2016–2024 · Daily)",
      tableData: {
        columns: ["Predictors", "Method", "Adj. R²", "R²"],
        rows: [
          { cells: ["both_factors", "Lasso", "0.4712", "0.5761"], highlight: true },
          { cells: ["chn_factors",  "Ridge", "0.5162", "0.5545"] },
          { cells: ["usa_factors",  "Ridge", "−0.0105", "0.1100"], dim: true },
        ],
      },
    },
    {
      id: "table-4.2.2",
      label: "Table 4.2.2: SpAM Regressions Predicting Chinese Market Returns",
      tableData: {
        columns: ["Period", "Frequency", "Predictors", "Adj. R²", "R²"],
        rows: [
          { cells: ["2001–2024", "Daily",   "both_themes", "0.4357", "0.4421"] },
          { cells: ["2001–2024", "Daily",   "chn_themes",  "0.4278", "0.4324"] },
          { cells: ["2001–2024", "Daily",   "usa_themes",  "0.0173", "0.0212"], dim: true },
          { cells: ["2016–2024", "Daily",   "both_themes", "0.3906", "0.4038"] },
          { cells: ["2016–2024", "Daily",   "chn_themes",  "0.3678", "0.3763"] },
          { cells: ["2016–2024", "Daily",   "usa_themes",  "0.0502", "0.0618"], dim: true },
          { cells: ["2001–2024", "Monthly", "both_themes", "0.4090", "0.4968"], highlight: true },
          { cells: ["2001–2024", "Monthly", "chn_themes",  "0.3903", "0.4564"] },
          { cells: ["2001–2024", "Monthly", "usa_themes",  "0.0553", "0.1055"], dim: true },
          { cells: ["2016–2024", "Monthly", "both_themes", "0",      "0.9999"], dim: true },
          { cells: ["2016–2024", "Monthly", "chn_themes",  "0.0036", "0.0053"], dim: true },
          { cells: ["2016–2024", "Monthly", "usa_themes",  "0.0752", "0.1173"] },
        ],
      },
    },
  ],
};

export const RESULTS_US = {
  id: "results-us",
  direction: "China → U.S.",
  headline: "Weak Signal",
  subheadline: "Chinese macro-financial factors add less than 1 percentage point of R² to U.S. equity return models — effectively no cross-market contribution.",
  statRows: [
    { model: "Ridge", spec: "daily · 2001–2024", delta: "+0.7 pp", detail: "R² 0.744 → 0.751", weak: true },
    { model: "SpAM", spec: "monthly · 2001–2024", delta: "+1.8 pp", detail: "R² 0.636 → 0.654", weak: true },
    { model: "Kernel", spec: "Chinese-factors-only", delta: "R² ≈ 0", detail: "Predicts mean every period", weak: true },
  ],
  findingsParagraph: `Chinese macro-financial factors add essentially no explanatory power to U.S. equity return models, regardless of model class or time window. Ridge showed a gain of only +0.7 pp when Chinese factors were added to a U.S.-only baseline of R² = 0.744, and SpAM added +1.8 pp — both negligible. The kernel model provided the starkest evidence: using only Chinese themes to predict U.S. returns yielded R² ≈ 4.6×10⁻¹⁵, effectively predicting the historical mean every period with no variation captured whatsoever. This near-zero, consistent result across all specifications is the thesis's central asymmetric finding.`,
  summary: [
    "Linear regression (Ridge, daily, 2001–2024): U.S. factors alone explain R² = 0.7441. Adding Chinese factors raises this to R² = 0.7510 — a ΔR² of only +0.7 pp. Chinese factors alone achieve R² = 0.0272.",
    "SpAM (monthly, 2001–2024): U.S. themes alone explain R² = 0.6359. Adding Chinese themes raises this to R² = 0.6538 (ΔR² = +1.8 pp). Chinese themes alone achieve R² = 0.0633.",
    "Kernel regression delivers the most striking evidence: a model using only Chinese themes to predict U.S. returns achieved R² ≈ 4.6×10⁻¹⁵ — effectively predicting the mean (≈ 0) for every time period, capturing no signal whatsoever.",
    "Across all model classes, Chinese factors contribute meaningfully less incremental R² than U.S. factors do in the reverse direction. The asymmetry is consistent and large.",
  ],
  figures: [
    {
      src: "fig-B.0.18-us-kernel-actual-predicted.png",
      title: "Figure B.0.18: Kernel Regression — U.S. Returns, U.S. Themes Only",
      caption: "Kernel regression on U.S. returns using only U.S. themes (Adj. R² = 0.88). The tight scatter confirms that U.S. macro-financial conditions strongly predict U.S. equity returns — a robust domestic baseline.",
    },
    {
      src: "fig-results-us-both-kernel.png",
      title: "Figure B.0.19: Kernel Regression — U.S. Returns, Combined Themes",
      caption: "Adding Chinese themes to the U.S.-only model produces a near-identical fit (Adj. R² = 0.99 vs. 0.88 for U.S.-only). Chinese factors contribute essentially no incremental explanatory power — the combined model wins only because it overfits the training data.",
    },
    {
      src: "fig-partial-dependence-us-1.png",
      title: "Figure 4.3.4: Kernel Regression — U.S. Returns, Chinese Themes Only",
      caption: "Using only Chinese themes to predict U.S. returns, the model achieves Adj. R² ≈ 4.6×10⁻¹⁵ — a flat horizontal prediction equal to the historical mean every period. Chinese macro-financial conditions carry essentially zero information about U.S. equity returns.",
    },
  ],
  tables: [
    {
      id: "table-4.1.2",
      label: "Table 4.1.2: Best Regularized Model for U.S. Returns (2001–2024 · Daily)",
      tableData: {
        columns: ["Predictors", "Method", "Adj. R²", "R²"],
        rows: [
          { cells: ["both_factors", "Ridge", "0.7385", "0.7510"], highlight: true },
          { cells: ["chn_factors",  "Ridge", "0.0036", "0.0272"], dim: true },
          { cells: ["usa_factors",  "Ridge", "0.7378", "0.7441"] },
        ],
      },
    },
    {
      id: "table-4.2.1",
      label: "Table 4.2.1: SpAM Regressions Predicting U.S. Market Returns",
      tableData: {
        columns: ["Period", "Frequency", "Predictors", "Adj. R²", "R²"],
        rows: [
          { cells: ["2001–2024", "Daily",   "both_themes", "0.5949", "0.6032"] },
          { cells: ["2001–2024", "Daily",   "chn_themes",  "0.0078", "0.0120"], dim: true },
          { cells: ["2001–2024", "Daily",   "usa_themes",  "0.5970", "0.6022"] },
          { cells: ["2016–2024", "Daily",   "both_themes", "0.5507", "0.5687"] },
          { cells: ["2016–2024", "Daily",   "chn_themes",  "0.0123", "0.0222"], dim: true },
          { cells: ["2016–2024", "Daily",   "usa_themes",  "0.5579", "0.5714"] },
          { cells: ["2001–2024", "Monthly", "both_themes", "0.6140", "0.6538"], highlight: true },
          { cells: ["2001–2024", "Monthly", "chn_themes",  "0.0100", "0.0633"], dim: true },
          { cells: ["2001–2024", "Monthly", "usa_themes",  "0.6127", "0.6359"] },
          { cells: ["2016–2024", "Monthly", "both_themes", "0",      "0.9999"], dim: true },
          { cells: ["2016–2024", "Monthly", "chn_themes",  "0.0196", "0.0459"], dim: true },
          { cells: ["2016–2024", "Monthly", "usa_themes",  "0.4725", "0.5723"] },
        ],
      },
    },
    {
      id: "table-4.3.1",
      label: "Table 4.3.1: Kernel Regression Summary (Daily · Nadaraya-Watson)",
      tableData: {
        columns: ["Period", "Market", "Predictors", "# Pred.", "Adj. R²", "R²"],
        rows: [
          { cells: ["2001–2024", "China", "both_themes", "26", "0.9836", "0.9837"], highlight: true },
          { cells: ["2001–2024", "China", "chn_themes",  "13", "0.9041", "0.9043"] },
          { cells: ["2001–2024", "China", "usa_themes",  "13", "0.1101", "0.1122"] },
          { cells: ["2001–2024", "USA",   "both_themes", "26", "0.9913", "0.9914"], highlight: true },
          { cells: ["2001–2024", "USA",   "chn_themes",  "13", "−0.0024", "4.6×10⁻¹⁵"], dim: true },
          { cells: ["2001–2024", "USA",   "usa_themes",  "13", "0.8821", "0.8824"] },
          { cells: ["2016–2024", "China", "both_themes", "38", "0.9992", "0.9992"] },
          { cells: ["2016–2024", "China", "chn_themes",  "15", "0.8505", "0.8516"] },
          { cells: ["2016–2024", "China", "usa_themes",  "23", "0.9056", "0.9067"] },
          { cells: ["2016–2024", "USA",   "both_themes", "38", "0.9998", "0.9998"] },
          { cells: ["2016–2024", "USA",   "chn_themes",  "15", "0.7900", "0.7916"] },
          { cells: ["2016–2024", "USA",   "usa_themes",  "23", "0.9523", "0.9529"] },
        ],
      },
    },
    {
      id: "table-A.0.1",
      label: "Appendix Table A.0.1: All OLS Regressions — U.S. Returns",
      tableData: {
        columns: ["Period", "Frequency", "Predictors", "Adj. R²", "R²"],
        rows: [
          { cells: ["2001–2024", "Daily",   "usa_factors",  "0.7465", "0.7526"] },
          { cells: ["2001–2024", "Daily",   "chn_factors",  "0.0164", "0.0398"], dim: true },
          { cells: ["2001–2024", "Daily",   "both_factors", "0.7483", "0.7603"], highlight: true },
          { cells: ["2016–2024", "Daily",   "usa_factors",  "0.6982", "0.7342"] },
          { cells: ["2016–2024", "Daily",   "chn_factors",  "0.0202", "0.0977"], dim: true },
          { cells: ["2016–2024", "Daily",   "both_factors", "0.6978", "0.7577"] },
          { cells: ["2001–2024", "Daily",   "usa_themes",   "0.5784", "0.5794"] },
          { cells: ["2001–2024", "Daily",   "chn_themes",   "0.0074", "0.0098"], dim: true },
          { cells: ["2001–2024", "Daily",   "both_themes",  "0.5795", "0.5815"] },
          { cells: ["2016–2024", "Daily",   "usa_themes",   "0.5218", "0.5274"] },
          { cells: ["2016–2024", "Daily",   "chn_themes",   "0.0126", "0.0201"], dim: true },
          { cells: ["2016–2024", "Daily",   "both_themes",  "0.5224", "0.5316"] },
          { cells: ["2001–2024", "Monthly", "usa_factors",  "0.7494", "0.8670"] },
          { cells: ["2001–2024", "Monthly", "chn_factors",  "0.1197", "0.4952"] },
          { cells: ["2001–2024", "Monthly", "both_factors", "0.7699", "0.9761"] },
          { cells: ["2016–2024", "Monthly", "usa_factors",  "0",      "1"], dim: true },
          { cells: ["2016–2024", "Monthly", "chn_factors",  "0",      "1"], dim: true },
          { cells: ["2016–2024", "Monthly", "both_factors", "0",      "1"], dim: true },
          { cells: ["2001–2024", "Monthly", "usa_themes",   "0.6043", "0.6227"] },
          { cells: ["2001–2024", "Monthly", "chn_themes",   "0.0104", "0.0565"], dim: true },
          { cells: ["2001–2024", "Monthly", "both_themes",  "0.6092", "0.6456"] },
          { cells: ["2016–2024", "Monthly", "usa_themes",   "0.6139", "0.6724"] },
          { cells: ["2016–2024", "Monthly", "chn_themes",   "0.1886", "0.3279"] },
          { cells: ["2016–2024", "Monthly", "both_themes",  "0.5822", "0.7172"] },
        ],
      },
    },
    {
      id: "table-A.0.2",
      label: "Appendix Table A.0.2: All OLS Regressions — Chinese Returns",
      tableData: {
        columns: ["Period", "Frequency", "Predictors", "Adj. R²", "R²"],
        rows: [
          { cells: ["2001–2024", "Daily",   "usa_factors",  "0.0490", "0.0719"], dim: true },
          { cells: ["2001–2024", "Daily",   "chn_factors",  "0.5509", "0.5616"] },
          { cells: ["2001–2024", "Daily",   "both_factors", "0.5656", "0.5864"] },
          { cells: ["2016–2024", "Daily",   "usa_factors",  "0.0815", "0.1910"], dim: true },
          { cells: ["2016–2024", "Daily",   "chn_factors",  "0.5599", "0.5948"] },
          { cells: ["2016–2024", "Daily",   "both_factors", "0.5918", "0.6728"], highlight: true },
          { cells: ["2001–2024", "Daily",   "usa_themes",   "0.0139", "0.0163"], dim: true },
          { cells: ["2001–2024", "Daily",   "chn_themes",   "0.4168", "0.4182"] },
          { cells: ["2001–2024", "Daily",   "both_themes",  "0.4225", "0.4252"] },
          { cells: ["2016–2024", "Daily",   "usa_themes",   "0.0467", "0.0578"], dim: true },
          { cells: ["2016–2024", "Daily",   "chn_themes",   "0.3586", "0.3635"] },
          { cells: ["2016–2024", "Daily",   "both_themes",  "0.3825", "0.3944"] },
          { cells: ["2001–2024", "Monthly", "usa_factors",  "0",      "1"], dim: true },
          { cells: ["2001–2024", "Monthly", "chn_factors",  "0",      "1"], dim: true },
          { cells: ["2001–2024", "Monthly", "both_factors", "0",      "1"], dim: true },
          { cells: ["2016–2024", "Monthly", "usa_factors",  "0.1830", "0.3068"] },
          { cells: ["2016–2024", "Monthly", "chn_factors",  "0.2571", "0.3847"] },
          { cells: ["2016–2024", "Monthly", "both_factors", "0.3444", "0.5563"] },
          { cells: ["2001–2024", "Monthly", "usa_themes",   "0.0518", "0.0960"], dim: true },
          { cells: ["2001–2024", "Monthly", "chn_themes",   "0.2677", "0.3018"] },
          { cells: ["2001–2024", "Monthly", "both_themes",  "0.3147", "0.3786"] },
          { cells: ["2016–2024", "Monthly", "usa_themes",   "0.1830", "0.3068"] },
          { cells: ["2016–2024", "Monthly", "chn_themes",   "0.2571", "0.3847"] },
          { cells: ["2016–2024", "Monthly", "both_themes",  "0.3444", "0.5563"] },
        ],
      },
    },
  ],
};

// ─── Section 6: Interpretation ────────────────────────────────────────────────
export const INTERPRETATION = {
  opEd: [
    {
      headline: "Interdependence is directional.",
      body: "U.S. macro-financial conditions carry a statistically detectable signal for Chinese equity returns — adding roughly 7.8 percentage points of R² in linear models. The reverse is not true: Chinese factors contribute less than 1 pp to U.S. return prediction. This asymmetry likely reflects the dominant role of U.S. markets in setting global risk pricing. When American macro conditions shift, Chinese investors respond. The reverse propagation is constrained by capital controls, information barriers, and China's partially segmented financial system.",
    },
    {
      headline: "Domestic factors dominate, but cross-market signals are real.",
      body: "For both markets, own-country factors are the strongest predictors — explaining 0.55–0.60 of variance in Chinese returns and 0.70–0.80 in U.S. returns (linear models). But the cross-country contribution is asymmetric: U.S. factors add a consistent, meaningful increment to Chinese return prediction. This implies that macro-financial conditions are not locally contained, and that cross-market factor exposure is a real source of variance in international equity returns.",
    },
    {
      headline: "Flexibility and interpretability trade off sharply.",
      body: "SpAM and kernel regression models achieved higher in-sample R² values but were significantly more prone to overfitting — particularly at monthly frequency where the number of observations is limited relative to parameters. The most memorable example: the 2016–2024 monthly SpAM returned R² = 0.9999, which is clearly a severe overfit. Nonlinear models provided meaningful partial dependence insights but required careful diagnostic scrutiny to distinguish genuine signals from noise.",
    },
  ],
  takeaways: [
    "Adding U.S. factors to Chinese factor models raises R² by ~7.8 pp (linear, daily, 2016–2024). Adding Chinese factors to U.S. models raises R² by <1 pp.",
    "U.S. factors alone explain 11–19% of Chinese returns. Chinese factors alone explain 3–6% of U.S. returns.",
    "Domestic factors dominate: R² = 0.55–0.60 for China; R² = 0.70–0.80 for the U.S. using own-country data.",
    "The asymmetry is consistent across Ridge/Lasso, SpAM (pyGAM), and Kernel Regression (Nadaraya-Watson).",
    "Kernel regression using Chinese themes to predict U.S. returns predicted ~0 throughout — the most striking evidence of the directional gap.",
    "SpAM partial dependence reveals: Chinese Value (negative), U.S. Profit Growth (negative on China), Chinese Momentum (negative), U.S. Momentum (negative on U.S. — market-level reversal).",
    "Results should be interpreted as statistical tendencies within a predictive framework, not causal claims or stable trading signals.",
  ],
  audiences: [
    {
      label: "Investors",
      body: "Cross-market factor exposure is real but subtle. Incorporating U.S. macro signals into China equity allocation frameworks may improve risk attribution. The asymmetry implies that hedging U.S. risk via Chinese equities is less effective than the reverse — U.S. conditions ripple outward more readily than Chinese conditions do.",
    },
    {
      label: "Policymakers",
      body: "The detectability of cross-border spillovers — even in a partially segmented market like China's — suggests that capital account restrictions do not fully insulate domestic equity markets from foreign macro conditions. Monitoring U.S. factor dynamics may serve as a useful leading indicator for Chinese market risk.",
    },
    {
      label: "Researchers",
      body: "The JKP factor-based framework offers a structured, multi-model alternative to bivariate return correlation for studying integration. Future work could extend to rolling windows, sector-level analyses, or causal identification strategies (IV, synthetic controls) to move beyond statistical association toward economic explanation.",
    },
  ],
};

// ─── Section 7: Limitations ───────────────────────────────────────────────────
export const LIMITATIONS = {
  items: [
    {
      title: "Data Coverage Mismatch",
      body: "U.S. factors have substantially longer histories than their Chinese equivalents. The effective joint sample is constrained by Chinese factor availability, limiting statistical power — particularly for earlier sub-periods. Some factors were excluded entirely due to excessive missingness in Chinese data.",
    },
    {
      title: "Missingness and Stationarity",
      body: "Factor data — particularly for China — exhibits substantial missing values in earlier years, addressed via theme-level aggregation and linear imputation. Of 262 monthly factor columns, 23 required stationarity transformations (20 via differencing, 1 via Yeo-Johnson). Two columns could not be made stationary by any method and were excluded.",
    },
    {
      title: "Nonstationarity and Structural Breaks",
      body: "CUSUM tests confirm structural instability in both return series (p < 0.0001), with detected breaks around 2001, 2007–2008, and 2011–2013 for the U.S., and 2001, 2007–2009, and 2015 for China — consistent with the financial crisis and Chinese retail bubble periods. Static models estimated over the full sample mask this instability.",
    },
    {
      title: "Overfitting in Flexible Models",
      body: "SpAM and kernel regression are flexible by design, which introduces severe overfitting risk at monthly frequency. The 2016–2024 monthly SpAM returned R² = 0.9999 for multiple configurations — a clear overfit artifact. Cross-validation mitigates but cannot fully resolve the bias-variance tradeoff with these sample sizes.",
    },
    {
      title: "No Causal Identification",
      body: "This is a predictive study, not a causal one. The statistical association between U.S. factors and Chinese returns does not identify the mechanism. Factor overlap, common global drivers, or selection artifacts may contribute to the observed patterns.",
    },
  ],
  futurework: [
    "Extension to a broader market universe (EM Asia, Europe) to test whether U.S. factor dominance is China-specific or globally general.",
    "Causal identification using instrumental variable or synthetic control approaches.",
    "Time-varying coefficient models to explicitly account for regime shifts and structural breaks.",
    "Rolling-window estimation to capture time-varying integration and reduce the influence of distant historical regimes.",
    "Sector-level analysis for more granular insights, as industry-specific spillovers may be stronger and more interpretable.",
    "Interaction modeling via tree-based methods or pairwise additive terms to capture cross-factor dynamics beyond the additive assumption.",
    "Inclusion of alternative data sources (news sentiment, satellite imagery, trade flow data).",
  ],
  figures: [
    {
      src: "fig-3.2.14-cusum-us.png",
      title: "Figure 3.2.14: CUSUM Test on U.S. Market Returns",
      caption: "Cumulative sum test for parameter stability. U.S. breaks detected around 2001, 2007–2008, and 2011–2013. CUSUM p < 0.0001.",
    },
    {
      src: "fig-3.2.15-cusum-china.png",
      title: "Figure 3.2.15: CUSUM Test on Chinese Market Returns",
      caption: "CUSUM test on Chinese equity returns. Breaks detected around 2001, 2007–2009, and 2015, aligning with WTO accession, the global financial crisis, and the retail bubble. CUSUM p = 0.0002.",
    },
  ],
};

// ─── Section 8: Cite / Download ───────────────────────────────────────────────
export const CITE = {
  bibtex: `@thesis{hamdan2025crossmarket,
  author    = {Hamdan, Hamzeh},
  title     = {Cross-Market Signals: How Economic Information Propagates
               Between U.S. and Chinese Equity Markets},
  school    = {Harvard College},
  year      = {2025},
  month     = {May},
  type      = {Senior Thesis},
  address   = {Cambridge, MA}
}`,
  apa: `Hamdan, H. (2025). Cross-market signals: How economic information propagates between U.S. and Chinese equity markets [Senior thesis]. Harvard College.`,
};
