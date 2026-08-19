const round2 = (n) => Math.round(n * 100) / 100;
const sensitivity = (n) => ({
  minus_30_pct: round2(n * 0.7),
  base: round2(n),
  plus_30_pct: round2(n * 1.3),
});

// Stima bottom-up della replica: non deriva dalle LOC. Ogni voce e il totale
// sono assunzioni di perimetro, sottoposte a sensibilita +/-30% nel report.
const replication = {
  core_fullstack_auth_security_data: 1400,
  ui_pwa_mobile_and_81_routes: 1250,
  didactic_catalog_content_and_instructor_tools: 950,
  bridge_engines_dds_ben_generation_expected_value_and_game_modes: 2100,
  social_classes_live_table_pair_challenges_and_tournaments: 1050,
  qa_accessibility_devops_documentation_and_handover: 1370,
};
const replicationHours = Object.values(replication).reduce((a, b) => a + b, 0);
const replicationRates = [70, 90, 110];

// Il fornitore aggiunge al puro sviluppo analisi, progettazione, verifica
// indipendente e governo. Le percentuali sono assunzioni esplicite.
const replacement = {
  implementation_hours: replicationHours,
  analysis_10_pct: replicationHours * 0.10,
  ux_and_solution_design_10_pct: replicationHours * 0.10,
  independent_qa_and_security_15_pct: replicationHours * 0.15,
  project_management_15_pct: replicationHours * 0.15,
};
const replacementHours = Object.values(replacement).reduce((a, b) => a + b, 0);
const supplierRates = [80, 115, 150];
const replacementOverheadPct = 0.50;

// Valore d'uso. I MAU sono misurati nel database; mantenere per 36 mesi il
// livello medio degli ultimi tre mesi completi e un'assunzione, non un dato.
const monthlyActiveUsers = {
  "2026-02": 9,
  "2026-03": 678,
  "2026-04": 373,
  "2026-05": 312,
  "2026-06": 298,
  "2026-07": 236,
  "2026-08_partial": 166,
};
const trailingCompleteMau = [312, 298, 236];
const sustainableActiveUsers = trailingCompleteMau.reduce((a, b) => a + b, 0) / trailingCompleteMau.length;
const observedActiveUserMonths = Object.values(monthlyActiveUsers).reduce((a, b) => a + b, 0);
const months = 36;

// Listini pubblici osservati il 15 agosto 2026. Il cambio ECB e quello del
// 29 luglio 2026, ultimo valore recuperato dalla pagina ufficiale nell'audit.
const usdPerEur = 1.1380;
const bboPrimeUsdPerMonth = 5.99;
const funbridgePremiumEurPerYear = 149.99;
const funbridgePremiumPlusEurPerYear = 239.99;
const learnworldsUsdPerMonthAnnualBilling = 249;
const hostingUsdPerMonth = { vercel: 20, supabase: 25 };

// L'onere operativo non e valore: viene sottratto dal beneficio lordo.
const maintenanceHoursPerMonth = 20;
const maintenanceRateEur = 90;
const hostingEur = Object.values(hostingUsdPerMonth).reduce((a, b) => a + b, 0) * months / usdPerEur;
const maintenanceEur = maintenanceHoursPerMonth * maintenanceRateEur * months;
const operatingCostEur = hostingEur + maintenanceEur;

const activeSensitivity = sensitivity(sustainableActiveUsers);
const bboAnnualEur = bboPrimeUsdPerMonth * 12 / usdPerEur;
const grossUseScenarios = {
  low_bbo_prime_and_active_minus_30: activeSensitivity.minus_30_pct * bboAnnualEur * 3,
  base_funbridge_premium: sustainableActiveUsers * funbridgePremiumEurPerYear * 3,
  high_funbridge_premium_plus_and_active_plus_30: activeSensitivity.plus_30_pct * funbridgePremiumPlusEurPerYear * 3,
};
const historicalDelivered = {
  low_bbo_prime: observedActiveUserMonths * bboPrimeUsdPerMonth / usdPerEur,
  base_funbridge_premium_annual_monthly_equivalent:
    observedActiveUserMonths * funbridgePremiumEurPerYear / 12,
  high_funbridge_premium_plus_annual_monthly_equivalent:
    observedActiveUserMonths * funbridgePremiumPlusEurPerYear / 12,
};
const baseComparatorGrossSensitivity = {
  minus_30_pct_active_users: activeSensitivity.minus_30_pct * funbridgePremiumEurPerYear * 3,
  base: sustainableActiveUsers * funbridgePremiumEurPerYear * 3,
  plus_30_pct_active_users: activeSensitivity.plus_30_pct * funbridgePremiumEurPerYear * 3,
};
const pessimisticOperatingCost = hostingEur * 1.3 + maintenanceEur * 1.3;
const favorableOperatingCost = hostingEur * 0.7 + maintenanceEur * 0.7;
const netUseSensitivityCombined = {
  active_minus_30_and_operating_plus_30:
    baseComparatorGrossSensitivity.minus_30_pct_active_users - pessimisticOperatingCost,
  base: baseComparatorGrossSensitivity.base - operatingCostEur,
  active_plus_30_and_operating_minus_30:
    baseComparatorGrossSensitivity.plus_30_pct_active_users - favorableOperatingCost,
};
const lowComparatorNetFloor = Math.max(
  0,
  grossUseScenarios.low_bbo_prime_and_active_minus_30 - operatingCostEur,
);

const algorithmRewrites = {
  game_engine_ai_scoring_dds_ben_integration_and_replay: 900,
  constrained_hand_generation_dds_expected_value_and_validation: 850,
  bidding_engine_shared_field_pair_challenge_and_tournaments: 650,
  in_house_endgame_solver_and_validation_helpers: 320,
  generated_trick_and_opening_quizzes: 180,
  spaced_repetition_leitner: 80,
  gamification_xp_badges_streaks_and_objectives: 160,
  learning_progression_orchestration: 260,
  live_class_table_state_and_hidden_information: 200,
};

const qualityScores = [4, 4, 4, 3, 4, 3, 4, 1, 4, 4, 3, 3];

const output = {
  assumptions: {
    replication_hours_by_workstream: replication,
    replication_hours_sensitivity_by_workstream: Object.fromEntries(
      Object.entries(replication).map(([name, hours]) => [name, sensitivity(hours)]),
    ),
    hourly_rates_eur_method_A: replicationRates,
    external_supplier_scope_hours: replacement,
    hourly_rates_eur_method_B: supplierRates,
    work_hours_per_month_per_developer: sensitivity(160),
    replacement_overhead_pct: sensitivity(replacementOverheadPct * 100),
    sustainable_active_users_from_may_july_average: sensitivity(sustainableActiveUsers),
    funbridge_premium_equivalent_eur_per_year: sensitivity(funbridgePremiumEurPerYear),
    maintenance_hours_per_month: sensitivity(maintenanceHoursPerMonth),
    maintenance_hourly_rate_eur: sensitivity(maintenanceRateEur),
    hosting_usd_per_month: sensitivity(Object.values(hostingUsdPerMonth).reduce((a, b) => a + b, 0)),
    usd_per_eur_ecb_2026_07_29: usdPerEur,
    horizon_months_prescribed: months,
  },
  measured_usage_inputs: {
    monthly_active_users: monthlyActiveUsers,
    trailing_complete_months_used: trailingCompleteMau,
    trailing_complete_month_average: sustainableActiveUsers,
    observed_active_user_months_feb_to_aug_partial: observedActiveUserMonths,
  },
  external_two_senior_team: {
    total_person_hours: sensitivity(replicationHours),
    calendar_months_at_160h_per_developer: sensitivity(replicationHours / (2 * 160)),
    calendar_months_when_monthly_capacity_varies_30_pct: {
      capacity_minus_30_pct_112h: round2(replicationHours / (2 * 112)),
      base_160h: round2(replicationHours / (2 * 160)),
      capacity_plus_30_pct_208h: round2(replicationHours / (2 * 208)),
    },
  },
  method_A_reproduction_cost_eur: Object.fromEntries(replicationRates.map((rate) => [
    `${rate}_eur_per_hour`,
    sensitivity(replicationHours * rate),
  ])),
  method_B_external_replacement: {
    total_scope_hours: sensitivity(replacementHours),
    hours_when_overhead_pct_varies_30_pct: {
      overhead_35_pct: round2(replicationHours * 1.35),
      overhead_50_pct: round2(replicationHours * 1.50),
      overhead_65_pct: round2(replicationHours * 1.65),
    },
    cost_at_base_scope_eur: Object.fromEntries(supplierRates.map((rate) => [
      `${rate}_eur_per_hour`,
      round2(replacementHours * rate),
    ])),
    full_combined_envelope_eur: {
      effort_minus_30_at_80_eur: round2(replacementHours * 0.7 * 80),
      effort_plus_30_at_150_eur: round2(replacementHours * 1.3 * 150),
    },
  },
  method_C_value_in_use: {
    public_price_inputs: {
      bbo_prime_usd_per_month: bboPrimeUsdPerMonth,
      bbo_prime_eur_per_year_at_ecb_rate: round2(bboAnnualEur),
      funbridge_premium_eur_per_year: funbridgePremiumEurPerYear,
      funbridge_premium_plus_eur_per_year: funbridgePremiumPlusEurPerYear,
      learnworlds_learning_center_usd_per_month_billed_annually:
        learnworldsUsdPerMonthAnnualBilling,
    },
    historical_gross_value_delivered_to_date_eur: Object.fromEntries(
      Object.entries(historicalDelivered).map(([k, v]) => [k, round2(v)])
    ),
    prospective_three_year_gross_use_scenarios_eur: Object.fromEntries(
      Object.entries(grossUseScenarios).map(([k, v]) => [k, round2(v)])
    ),
    nearest_comparator_gross_sensitivity_eur: Object.fromEntries(
      Object.entries(baseComparatorGrossSensitivity).map(([k, v]) => [k, round2(v)])
    ),
    generic_lms_license_cross_check_eur: sensitivity(
      learnworldsUsdPerMonthAnnualBilling * months / usdPerEur
    ),
    operating_burden_eur: {
      hosting: sensitivity(hostingEur),
      maintenance: sensitivity(maintenanceEur),
      base_total: round2(operatingCostEur),
    },
    net_use_value_nearest_comparator_eur: Object.fromEntries(
      Object.entries(netUseSensitivityCombined).map(([k, v]) => [k, round2(v)])
    ),
  },
  algorithm_rewrite_person_hours_and_cost_at_90_eur: Object.fromEntries(
    Object.entries(algorithmRewrites).map(([name, hours]) => [name, {
      hours: sensitivity(hours),
      cost_eur: sensitivity(hours * 90),
    }])
  ),
  quality: {
    scores: qualityScores,
    sum: qualityScores.reduce((a, b) => a + b, 0),
    count: qualityScores.length,
    arithmetic_mean: round2(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length),
  },
  prudent_conferred_value: {
    basis: "Net three-year use value: avoided bridge-learning licence less hosting and maintenance. The lower bound admits a low-cost substitute and is floored at zero; replacement cost is only a ceiling cross-check.",
    gross_capability_equivalence_eur: {
      lower: round2(baseComparatorGrossSensitivity.minus_30_pct_active_users),
      upper: round2(baseComparatorGrossSensitivity.plus_30_pct_active_users),
    },
    exact_eur: {
      lower: round2(lowComparatorNetFloor),
      upper: round2(netUseSensitivityCombined.active_plus_30_and_operating_minus_30),
    },
    rounded_for_board_eur: { lower: 0, upper: 120000 },
    central_net_after_base_operating_burden_eur: round2(netUseSensitivityCombined.base),
  },
};

console.log(JSON.stringify(output, null, 2));
