export interface GlossaryTerm {
  term: string;
  definition: string;
}

// Curated, real definitions — kept plain-English on purpose. Ordered longest
// term first so multi-word terms (e.g. "Compound Interest") match before
// their substrings ("Interest") when scanning lesson text.
export const GLOSSARY: GlossaryTerm[] = [
  {
    term: "Emergency Fund",
    definition: "Money set aside specifically for unexpected costs — a car repair, a lost job, a medical bill — so a surprise expense doesn't force you into debt.",
  },
  {
    term: "Opportunity Cost",
    definition: "What you give up by choosing one option over another. Spending $20 on takeout means that same $20 can't go toward anything else — that trade-off is the opportunity cost.",
  },
  {
    term: "Supply and Demand",
    definition: "The relationship between how much of something exists (supply) and how much people want it (demand). When demand outpaces supply, prices tend to rise; when supply outpaces demand, prices tend to fall.",
  },
  {
    term: "Compound Interest",
    definition: "Interest calculated on both the original amount and the interest that's already accumulated. It's why savings and debt both grow faster over time than a flat percentage would suggest.",
  },
  {
    term: "Credit Score",
    definition: "A number (roughly 300–850 in the U.S.) that summarizes how reliably someone repays borrowed money. Lenders use it to decide whether to approve a loan and what interest rate to charge.",
  },
  {
    term: "Diversification",
    definition: "Spreading money across different investments instead of concentrating it in one place, so a single bad outcome doesn't sink the whole portfolio.",
  },
  {
    term: "Net Worth",
    definition: "Everything you own (assets) minus everything you owe (debts). It's a snapshot of financial position at a point in time, not income.",
  },
  {
    term: "Inflation",
    definition: "The general rise in prices over time, which means each dollar buys a little less than it used to. Historically the U.S. has averaged roughly 2-3% inflation per year.",
  },
  {
    term: "Liquidity",
    definition: "How quickly and easily an asset can be turned into usable cash without losing value. Cash is perfectly liquid; a house is not.",
  },
  {
    term: "Volatility",
    definition: "How much and how quickly a price moves up and down over time. Higher volatility means bigger swings in either direction, not necessarily bigger long-term risk.",
  },
  {
    term: "APR",
    definition: "Annual Percentage Rate — the yearly cost of borrowing money, including interest and most fees, expressed as a percentage. Lower is better when you're the one borrowing.",
  },
  {
    term: "FDIC Insurance",
    definition: "A U.S. government guarantee that protects up to $250,000 per depositor, per bank, if the bank itself fails. It's why keeping money in an FDIC-insured bank is considered safe.",
  },
  {
    term: "Gross Pay",
    definition: "The total amount earned before taxes and other deductions are taken out — the number on the offer letter, not the number that lands in your account.",
  },
  {
    term: "Net Pay",
    definition: "What actually lands in your bank account after taxes and other deductions are subtracted from gross pay. Also called \"take-home pay.\"",
  },
  {
    term: "Risk Tolerance",
    definition: "How much uncertainty or potential loss someone is comfortable accepting in exchange for potentially higher returns. It's personal, not fixed, and tends to shift with age and circumstances.",
  },
];

const sortedTerms = [...GLOSSARY].sort((a, b) => b.term.length - a.term.length);

export function findGlossaryTerm(term: string): GlossaryTerm | undefined {
  return GLOSSARY.find((g) => g.term.toLowerCase() === term.toLowerCase());
}

export function glossaryTermsForMatching(): GlossaryTerm[] {
  return sortedTerms;
}
