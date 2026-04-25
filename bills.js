/**
 * Bill database. Each entry has:
 *   id          – unique slug
 *   number      – official bill number
 *   title       – short title
 *   jurisdiction – "federal" | "state" | "city"
 *   state       – full state name (for state/city bills)
 *   city        – city name (for city bills)
 *   topics      – topic IDs matching the frontend TOPICS list
 *   text        – the legislative text / summary used for AI analysis
 */

const BILLS = [

  /* ─── FEDERAL ─────────────────────────────────────────────────────────── */

  {
    id: "FED-001",
    number: "S. 1284",
    title: "Medicare Prescription Drug Pricing Reform Act of 2026",
    jurisdiction: "federal",
    state: null,
    city: null,
    topics: ["healthcare", "retirement"],
    text: `
BILL NUMBER: S. 1284
TITLE: Medicare Prescription Drug Pricing Reform Act of 2026

Section 1. Purpose.
This Act empowers the Secretary of Health and Human Services to negotiate directly with pharmaceutical manufacturers on the price of the 50 highest-cost Medicare Part D drugs annually.

Section 2. Out-of-Pocket Cap.
Beginning January 1, 2027, Medicare beneficiaries shall pay no more than $2,000 per calendar year in out-of-pocket prescription drug costs under Part D.

Section 3. Insulin Price Cap.
The cost of insulin products covered under Medicare Part D shall not exceed $35 per month per prescription.

Section 4. Inflation Rebates.
If a drug manufacturer raises the price of a Medicare-covered drug faster than the rate of inflation, the manufacturer must pay a rebate to the federal government equal to the excess price increase.

Section 5. Low-Income Subsidy Expansion.
The income threshold for the Low-Income Subsidy (Extra Help) program is raised from 135% to 150% of the Federal Poverty Level, extending coverage to approximately 1.2 million additional beneficiaries.

Section 6. Effective Date.
Negotiated prices take effect January 1, 2027. The out-of-pocket cap and insulin price provisions take effect July 1, 2026.
    `.trim()
  },

  {
    id: "FED-002",
    number: "H.R. 3310",
    title: "Small Business Relief and Innovation Tax Act of 2026",
    jurisdiction: "federal",
    state: null,
    city: null,
    topics: ["business", "taxes"],
    text: `
BILL NUMBER: H.R. 3310
TITLE: Small Business Relief and Innovation Tax Act of 2026

Section 1. Small Business Health Insurance Tax Credit.
Employers with fewer than 25 full-time employees who provide health insurance coverage shall receive a tax credit equal to 50% of employer-paid premiums, up from the current 35%.

Section 2. Startup Expense Deduction Increase.
The first-year deduction for startup business expenses is increased from $5,000 to $15,000 for new businesses with gross receipts under $1 million.

Section 3. Self-Employment Tax Relief.
Self-employed individuals may deduct 100% of health insurance premiums paid for themselves and their families against both income tax and self-employment tax.

Section 4. Digital Infrastructure Credit.
Small businesses investing in cybersecurity tools, e-commerce platforms, or cloud-based infrastructure shall receive a 25% tax credit on qualifying purchases up to $10,000.

Section 5. Payroll Tax Deferral for New Hires.
Businesses with fewer than 50 employees that hire workers from underrepresented communities may defer the employer share of payroll taxes for the new hire's first 12 months.

Section 6. Effective Date.
Provisions apply to taxable years beginning after December 31, 2025.
    `.trim()
  },

  {
    id: "FED-003",
    number: "S. 2078",
    title: "Social Security Expansion and COLA Enhancement Act of 2026",
    jurisdiction: "federal",
    state: null,
    city: null,
    topics: ["retirement", "taxes"],
    text: `
BILL NUMBER: S. 2078
TITLE: Social Security Expansion and COLA Enhancement Act of 2026

Section 1. Cost-of-Living Adjustment (COLA) Reform.
Replaces the current CPI-W index used to calculate Social Security COLA with the Consumer Price Index for the Elderly (CPI-E), which more accurately reflects spending patterns of seniors, particularly on healthcare and housing.

Section 2. Minimum Benefit Increase.
Establishes a new minimum Social Security benefit of 125% of the Federal Poverty Level for any worker with 30 or more years of covered earnings.

Section 3. Widow(er) Benefit Enhancement.
Surviving spouses shall receive 75% of the combined Social Security benefit of both spouses, up from the current rate which is limited to the higher individual benefit only.

Section 4. Earnings Test Elimination.
Removes the retirement earnings test for beneficiaries who have reached full retirement age, allowing them to earn unlimited income without reduction in benefits.

Section 5. Solvency Provisions.
The Social Security payroll tax cap is raised from $168,600 to $400,000, applying the current 6.2% employee and employer rate to wages above that threshold.

Section 6. Effective Date.
COLA changes take effect January 1, 2027. Minimum benefit and widow(er) provisions take effect January 1, 2028.
    `.trim()
  },

  {
    id: "FED-004",
    number: "H.R. 4561",
    title: "Immigrant Worker Protection and Visa Modernization Act of 2026",
    jurisdiction: "federal",
    state: null,
    city: null,
    topics: ["immigration"],
    text: `
BILL NUMBER: H.R. 4561
TITLE: Immigrant Worker Protection and Visa Modernization Act of 2026

Section 1. H-1B Visa Modernization.
Increases the annual H-1B visa cap from 65,000 to 110,000. Adds a dedicated 20,000-visa allocation for workers in healthcare, eldercare, and direct support professions.

Section 2. DACA Permanent Residency Pathway.
DACA recipients who have been enrolled for at least five continuous years, have no disqualifying criminal history, and meet educational or employment requirements may apply for lawful permanent residency.

Section 3. Family Backlog Reduction.
The per-country limit on family-based green cards is removed for immediate relatives of U.S. citizens, eliminating multi-decade backlogs for applicants from countries such as Mexico, India, and the Philippines.

Section 4. Worker Protections.
Undocumented workers who report wage theft, workplace safety violations, or labor trafficking to federal authorities are granted a protected status that shields them from deportation for the duration of the investigation and any resulting proceedings.

Section 5. Naturalization Fee Waiver.
Applicants with household income below 200% of the Federal Poverty Level may apply for a full waiver of the naturalization application fee.

Section 6. Effective Date.
This Act takes effect 180 days after enactment.
    `.trim()
  },

  /* ─── CALIFORNIA ───────────────────────────────────────────────────────── */

  {
    id: "CA-SB567",
    number: "SB 567",
    title: "Tenant Protection, Housing Relief, and Urban Revitalization Act of 2026",
    jurisdiction: "state",
    state: "California",
    city: null,
    topics: ["housing", "taxes"],
    text: `
BILL NUMBER: SB 567
TITLE: Tenant Protection, Housing Relief, and Urban Revitalization Act of 2026

Section 201. Annual Rent Cap.
Commencing January 1, 2027, an owner of residential real property shall not increase the gross rental rate more than 5% plus the percentage change in the cost of living, or 8%, whichever is lower. For properties owned by Corporate Landlords (more than 10 units), the cap is 4% plus CPI or 7%, whichever is lower.

Section 203. Just Cause Eviction Requirements.
After 12 months of continuous lawful occupancy, owners may not terminate a tenancy without just cause. At-fault just cause includes non-payment of rent, lease violations, and nuisance. No-fault just cause includes owner move-in, demolition, or government-ordered vacating.

Section 204. Relocation Assistance.
For no-fault evictions, owners must either pay two months' rent directly to the tenant or waive the final month's rent.

Section 301. Renter Tax Credit.
A refundable state tax credit of up to $1,000 (single filers, AGI ≤ $50,000) or $2,000 (joint filers, AGI ≤ $100,000) for qualified renters, with an additional $500 per dependent child (capped at two children).

Section 402. Retrofitting Subsidy.
State grants cover up to 40% of energy efficiency upgrades (HVAC, solar, weatherization), not to exceed $15,000 per property. Owners may not pass upgrade costs to tenants via rent increases.

Section 501. Transit-Oriented Development.
Housing developments within half a mile of a major transit stop that include 20% affordable units receive streamlined ministerial approval, bypassing standard local discretionary review.
    `.trim()
  },

  {
    id: "CA-AB1220",
    number: "AB 1220",
    title: "California Universal Childcare and Pre-Kindergarten Expansion Act of 2026",
    jurisdiction: "state",
    state: "California",
    city: null,
    topics: ["education", "taxes"],
    text: `
BILL NUMBER: AB 1220
TITLE: California Universal Childcare and Pre-Kindergarten Expansion Act of 2026

Section 1. Universal Pre-K Entitlement.
Beginning July 1, 2027, every child in California who is three or four years of age is entitled to a minimum of 15 hours per week of free, high-quality pre-kindergarten education in a state-subsidized program.

Section 2. Childcare Subsidy Expansion.
The income eligibility threshold for the California Childcare Assistance Program is raised from 85% to 150% of the State Median Income (SMI). Copayments are capped at 1% of family income for households below 75% SMI and 3% for households between 75% and 150% SMI.

Section 3. Childcare Worker Wage Floor.
Childcare workers employed in state-subsidized programs shall receive a minimum wage of $25 per hour by January 1, 2028. The state shall provide workforce grants to subsidized providers to cover the wage increase without passing costs to families.

Section 4. K-12 Mental Health Counselor Mandate.
Every public school with an enrollment of 500 or more students must employ at least one full-time licensed mental health counselor. Schools with enrollment below 500 may fulfill this requirement through a shared-services agreement with neighboring districts.

Section 5. Student Loan Interest Deduction.
California state income tax filers may deduct 100% of student loan interest payments, with no income cap (current federal deduction phases out above $85,000 AGI for single filers).

Section 6. Appropriation.
The sum of $2.1 billion is hereby appropriated from the General Fund for fiscal year 2026–2027 to implement the provisions of this Act.
    `.trim()
  },

  /* ─── NEW YORK ─────────────────────────────────────────────────────────── */

  {
    id: "NY-S4321",
    number: "S. 4321-A",
    title: "New York Housing Stability and Tenant Protection Act of 2026",
    jurisdiction: "state",
    state: "New York",
    city: null,
    topics: ["housing"],
    text: `
BILL NUMBER: S. 4321-A
TITLE: New York Housing Stability and Tenant Protection Act of 2026

Section 1. Statewide Rent Stabilization Extension.
Rent stabilization protections are extended to all residential rental units in municipalities with a vacancy rate below 3%, regardless of the building's construction date or prior deregulation status.

Section 2. Preferential Rent Protections.
Landlords who charged a preferential rent (below the legal regulated rent) shall maintain that lower rent as the base for all future calculations. The practice of "bait-and-switch" preferential rents is prohibited.

Section 3. Good Cause Eviction.
Tenants in non-stabilized units occupied for 12 or more months may only be evicted for good cause. Good cause includes non-payment of rent, nuisance, illegal activity, or owner move-in (subject to relocation fee of three months' rent).

Section 4. Rent Increase Limits (Unregulated Units).
For tenants outside of stabilization, annual rent increases are capped at 3% or the local CPI, whichever is lower, once the tenant has resided in the unit for 12 continuous months.

Section 5. Security Deposit Reform.
Security deposits are capped at one month's rent statewide. Landlords must return the deposit or provide an itemized statement of deductions within 14 days of vacancy (reduced from 30 days).

Section 6. Source of Income Discrimination.
Landlords and real estate agents are prohibited from refusing to rent to any tenant on the basis of the tenant's lawful source of income, including Section 8 vouchers, housing subsidies, or Social Security payments.

Section 7. Effective Date.
This Act takes effect immediately upon signature.
    `.trim()
  },

  {
    id: "NY-A5678",
    number: "A. 5678",
    title: "New York Small Business Recovery and Main Street Investment Act of 2026",
    jurisdiction: "state",
    state: "New York",
    city: null,
    topics: ["business", "taxes"],
    text: `
BILL NUMBER: A. 5678
TITLE: New York Small Business Recovery and Main Street Investment Act of 2026

Section 1. Commercial Rent Tax Credit.
Small businesses located in New York City with annual gross receipts under $5 million that have occupied the same commercial space for at least three years are eligible for a state income tax credit equal to 25% of the increase in annual commercial rent over the prior year, capped at $10,000 per year.

Section 2. Restaurant and Hospitality Workforce Credit.
Food service establishments and hotels with 100 or fewer employees that maintain at least 80% of their pre-pandemic workforce receive a $3,000 per full-time equivalent employee payroll tax credit.

Section 3. Minority- and Women-Owned Business (MWBE) Certification Streamlining.
The state MWBE certification process is consolidated into a single online portal with a maximum processing time of 45 days. Certified MWBEs receive priority access to the grant and loan programs established in this Act.

Section 4. Main Street Revolving Loan Fund.
A $400 million revolving loan fund is established providing low-interest loans (capped at 3%) to small brick-and-mortar businesses for storefront improvements, accessibility upgrades, and energy efficiency retrofits.

Section 5. Independent Contractor Protections.
Freelancers and independent contractors in New York are entitled to written contracts for any engagement exceeding $800 in value, with payment due within 30 days. Violations are subject to penalties of $250 per day.

Section 6. Effective Date.
Tax credit provisions apply to taxable years beginning January 1, 2026. All other provisions take effect 90 days after enactment.
    `.trim()
  },

  /* ─── TEXAS ────────────────────────────────────────────────────────────── */

  {
    id: "TX-HB234",
    number: "HB 234",
    title: "Texas Property Tax Reduction and Homestead Exemption Enhancement Act of 2026",
    jurisdiction: "state",
    state: "Texas",
    city: null,
    topics: ["taxes", "housing"],
    text: `
BILL NUMBER: HB 234
TITLE: Texas Property Tax Reduction and Homestead Exemption Enhancement Act of 2026

Section 1. Homestead Exemption Increase.
The standard homestead exemption for school district property taxes is increased from $100,000 to $140,000 of the appraised value of a homeowner's primary residence.

Section 2. Senior and Disabled Homeowner Exemption.
Homeowners aged 65 or older or who are disabled are entitled to an additional $30,000 exemption on top of the standard homestead exemption. This exemption also freezes school district property taxes at the level assessed in the year the homeowner turns 65 or becomes disabled.

Section 3. Appraisal Cap Reduction.
The annual cap on increases in the appraised value of a homestead for property tax purposes is reduced from 10% to 5%. The cap applies beginning in the second year after the most recent sale of the property.

Section 4. Appraisal Review Board Reform.
Appraisal Review Board members must complete a minimum of 30 hours of training in appraisal methodology, procedural fairness, and ethics. Homeowners have the right to appear by videoconference in any ARB protest hearing.

Section 5. Renter Property Tax Rebate.
Texas resident renters with household income below $60,000 may claim a $400 annual rebate on their state franchise tax return to offset the portion of property taxes estimated to be passed through to them by landlords.

Section 6. Effective Date.
Exemption increases and the appraisal cap reduction apply beginning with the 2027 tax year.
    `.trim()
  },

  /* ─── FLORIDA ──────────────────────────────────────────────────────────── */

  {
    id: "FL-SB890",
    number: "SB 890",
    title: "Florida Senior Healthcare Access and Medicare Supplement Modernization Act of 2026",
    jurisdiction: "state",
    state: "Florida",
    city: null,
    topics: ["healthcare", "retirement"],
    text: `
BILL NUMBER: SB 890
TITLE: Florida Senior Healthcare Access and Medicare Supplement Modernization Act of 2026

Section 1. Medicare Supplement Open Enrollment Expansion.
Florida residents who are 65 or older and enrolled in Medicare Part B may enroll in any Medicare Supplement (Medigap) plan without medical underwriting during a 90-day open enrollment window each January, regardless of pre-existing conditions.

Section 2. Prescription Drug Assistance Program.
The Florida Pharmaceutical Assistance Program (FPAP) is expanded to serve Medicare Part D beneficiaries with household income up to 200% of the Federal Poverty Level. Program benefits supplement—but do not duplicate—federal Low-Income Subsidy benefits.

Section 3. Home and Community-Based Care.
A $250 million appropriation is made to the Florida Agency for Health Care Administration to expand Medicaid waiver slots for home- and community-based long-term care services. The waitlist for the Statewide Medicaid Managed Care Long-Term Care program shall not exceed 90 days.

Section 4. Adult Protective Services Funding.
Funding for the Department of Children and Families Adult Protective Services unit is increased by $45 million to add case managers, reduce caseloads, and improve response times for reports of elder abuse, neglect, and exploitation.

Section 5. Telehealth Parity.
All state-regulated health insurance plans must reimburse telehealth services at the same rate as equivalent in-person services. Cost-sharing for telehealth visits shall not exceed cost-sharing for in-person visits.

Section 6. Effective Date.
This Act takes effect upon becoming law.
    `.trim()
  },

  /* ─── ILLINOIS ─────────────────────────────────────────────────────────── */

  {
    id: "IL-HB456",
    number: "HB 456",
    title: "Illinois New American Integration and Workforce Equity Act of 2026",
    jurisdiction: "state",
    state: "Illinois",
    city: null,
    topics: ["immigration", "business"],
    text: `
BILL NUMBER: HB 456
TITLE: Illinois New American Integration and Workforce Equity Act of 2026

Section 1. Driver's License Access.
Illinois residents who are unable to prove lawful presence but can provide alternative proof of Illinois residency and identity are eligible to obtain a standard driver's license (marked "Not for Federal Identification"). Includes a streamlined renewal process for existing Temporary Visitor Driver's License holders.

Section 2. Professional License Portability.
State licensing boards must accept foreign professional credentials in medicine, nursing, engineering, law, and education on a par with out-of-state U.S. credentials, subject to supplemental competency examination if required by the board.

Section 3. Language Access in Public Services.
All state agencies and any contractor receiving more than $250,000 in state funding must provide translation or interpretation services in any language spoken by more than 5% of their service population, at no charge to the user.

Section 4. Wage Theft Protections.
The Illinois Department of Labor is authorized to investigate and penalize wage theft claims regardless of the immigration status of the worker. Workers who file wage theft complaints are issued an automatic 180-day stay of any pending civil immigration enforcement.

Section 5. Immigrant Business Incubator Program.
$30 million is appropriated to the Department of Commerce and Economic Opportunity to fund grants of up to $50,000 to immigrant-owned small businesses for equipment, inventory, licensing, and workforce training.

Section 6. Effective Date.
Sections 1–4 take effect 90 days after enactment. Section 5 takes effect July 1, 2026, subject to appropriation.
    `.trim()
  },

  /* ─── CHICAGO (city-level) ─────────────────────────────────────────────── */

  {
    id: "CHI-ORD-2026-14",
    number: "Ordinance 2026-14",
    title: "Chicago Affordable Housing Preservation and Anti-Displacement Ordinance",
    jurisdiction: "city",
    state: "Illinois",
    city: "Chicago",
    topics: ["housing", "safety"],
    text: `
BILL NUMBER: Ordinance 2026-14
TITLE: Chicago Affordable Housing Preservation and Anti-Displacement Ordinance

Section 1. Community Right of First Refusal.
When an owner of a residential building with five or more units intends to sell, they must first offer the property to the Chicago Land Bank Authority, eligible nonprofit housing organizations, or a resident association at the same price and terms as any third-party offer.

Section 2. Affordable Unit Preservation Fee.
Developers who demolish or substantially rehabilitate an affordable residential building and replace it with market-rate units are assessed a one-time Affordable Unit Preservation Fee of $75,000 per removed affordable unit, deposited into the Chicago Affordable Housing Trust Fund.

Section 3. Emergency Tenant Protections.
Tenants who receive an eviction notice and whose household income is below 80% of Area Median Income may apply for emergency rental assistance through the Chicago Housing Authority within five business days of receiving the notice. A stay of eviction proceedings is automatically issued for up to 45 days pending review.

Section 4. Anti-Harassment Protections.
It is unlawful for a landlord to engage in conduct designed to force a tenant to vacate, including repeated unannounced entries, deliberate failure to make repairs, or threats. Violations are subject to fines of up to $10,000 per incident and allow the tenant to terminate the lease without penalty and recover three months' rent in damages.

Section 5. Neighborhood Safety Investment.
$20 million is allocated from the city's tax increment financing (TIF) surplus to fund community-based violence interruption programs, street lighting upgrades, and youth employment in the five community areas with the highest rates of housing instability.

Section 6. Effective Date.
This Ordinance takes effect 30 days after passage.
    `.trim()
  },

];

module.exports = BILLS;
