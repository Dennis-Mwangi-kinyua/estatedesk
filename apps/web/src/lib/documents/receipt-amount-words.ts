const SMALL_NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function integerWords(value: number): string {
  if (value < 20) return SMALL_NUMBER_WORDS[value];
  if (value < 100) return `${TENS_WORDS[Math.floor(value / 10)]}${value % 10 ? `-${SMALL_NUMBER_WORDS[value % 10]}` : ""}`;
  if (value < 1_000) return `${SMALL_NUMBER_WORDS[Math.floor(value / 100)]} hundred${value % 100 ? ` ${integerWords(value % 100)}` : ""}`;
  for (const [size, name] of [[1_000_000_000, "billion"], [1_000_000, "million"], [1_000, "thousand"]] as const) {
    if (value >= size) return `${integerWords(Math.floor(value / size))} ${name}${value % size ? ` ${integerWords(value % size)}` : ""}`;
  }
  return String(value);
}

export function amountInWords(amount: number, currencyCode: string) {
  const totalCents = Math.round(Math.abs(amount) * 100);
  const whole = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  return `${currencyCode} ${integerWords(whole)}${cents ? ` and ${integerWords(cents)} cents` : " only"}`;
}

