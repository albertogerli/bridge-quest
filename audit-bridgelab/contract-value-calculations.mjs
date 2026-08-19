const round2 = (value) => Math.round(value * 100) / 100;

const registeredUsers = 1095;
const sustainableMonthlyActiveUsers = 282;
const annualComparablePriceEur = 149.99;
const threeYearOperatingBurdenEur = 66223.55;
const annualOperatingBurdenEur = threeYearOperatingBurdenEur / 3;

const assumption = {
  activeUsers: {
    minus30: sustainableMonthlyActiveUsers * 0.7,
    base: sustainableMonthlyActiveUsers,
    plus30: sustainableMonthlyActiveUsers * 1.3,
  },
  operatingBurden: {
    minus30: annualOperatingBurdenEur * 0.7,
    base: annualOperatingBurdenEur,
    plus30: annualOperatingBurdenEur * 1.3,
  },
  economicLifeYears: { minus30: 7, base: 10, plus30: 13 },
  discountRate: { minus30: 0.035, base: 0.05, plus30: 0.065 },
};

const annuityPv = (annualValue, rate, years, startYear = 1) =>
  annualValue * (1 - (1 + rate) ** -years) / rate / (1 + rate) ** (startYear - 1);

const scenario = ({ users, annualOps, years, discountRate }) => {
  const annualGrossUseValue = users * annualComparablePriceEur;
  const annualNetAfterFreePeriod = Math.max(0, annualGrossUseValue - annualOps);
  const firstThreeYearsAllInclusivePv = annuityPv(annualGrossUseValue, discountRate, 3);
  const residualYears = Math.max(0, years - 3);
  const residualLicencePv = residualYears
    ? annuityPv(annualNetAfterFreePeriod, discountRate, residualYears, 4)
    : 0;
  return {
    years,
    discount_rate_pct: discountRate * 100,
    monthly_active_users: users,
    annual_gross_use_value_eur: annualGrossUseValue,
    annual_operating_burden_after_free_period_eur: annualOps,
    annual_net_use_value_after_free_period_eur: annualNetAfterFreePeriod,
    first_three_years_all_inclusive_pv_eur: firstThreeYearsAllInclusivePv,
    residual_licence_pv_eur: residualLicencePv,
    total_contract_pv_eur: firstThreeYearsAllInclusivePv + residualLicencePv,
  };
};

const low = scenario({
  users: assumption.activeUsers.minus30,
  annualOps: assumption.operatingBurden.plus30,
  years: assumption.economicLifeYears.minus30,
  discountRate: assumption.discountRate.plus30,
});
const base = scenario({
  users: assumption.activeUsers.base,
  annualOps: assumption.operatingBurden.base,
  years: assumption.economicLifeYears.base,
  discountRate: assumption.discountRate.base,
});
const high = scenario({
  users: assumption.activeUsers.plus30,
  annualOps: assumption.operatingBurden.minus30,
  years: assumption.economicLifeYears.plus30,
  discountRate: assumption.discountRate.minus30,
});

const perpetualTailPv = base.annual_net_use_value_after_free_period_eur
  / assumption.discountRate.base
  / (1 + assumption.discountRate.base) ** 3;

const output = {
  measured_inputs: {
    registered_users: registeredUsers,
    sustainable_monthly_active_users_from_perizia: sustainableMonthlyActiveUsers,
  },
  public_price_input: {
    funbridge_premium_eur_per_user_year: annualComparablePriceEur,
  },
  assumptions_with_sensitivity: {
    monthly_active_users: assumption.activeUsers,
    annual_operating_burden_eur: assumption.operatingBurden,
    economic_life_years: assumption.economicLifeYears,
    discount_rate_pct: Object.fromEntries(
      Object.entries(assumption.discountRate).map(([key, value]) => [key, value * 100]),
    ),
    free_all_inclusive_period_years: 3,
  },
  undiscounted_first_three_years_eur: {
    minus30_active_users: assumption.activeUsers.minus30 * annualComparablePriceEur * 3,
    base: assumption.activeUsers.base * annualComparablePriceEur * 3,
    plus30_active_users: assumption.activeUsers.plus30 * annualComparablePriceEur * 3,
  },
  finite_economic_life_scenarios: { low, base, high },
  strict_perpetuity_base_eur: {
    first_three_years_all_inclusive_pv: base.first_three_years_all_inclusive_pv_eur,
    perpetual_residual_licence_pv: perpetualTailPv,
    total: base.first_three_years_all_inclusive_pv_eur + perpetualTailPv,
    qualification: "Theoretical only: assumes constant use, economics and technological relevance forever.",
  },
};

console.log(JSON.stringify(output, (key, value) => (
  typeof value === "number" ? round2(value) : value
), 2));
