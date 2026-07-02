import { SUPPORTED_CURRENCIES } from "@/lib/currencies";

type CurrencySelectProps = {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  className?: string;
  required?: boolean;
};

export function CurrencySelect({ name, value, defaultValue, onChange, className, required = true }: CurrencySelectProps) {
  const regions = [...new Set(SUPPORTED_CURRENCIES.map((currency) => currency.region))];
  return (
    <select name={name} value={value} defaultValue={defaultValue} onChange={onChange} required={required} className={className}>
      {regions.map((region) => (
        <optgroup key={region} label={region}>
          {SUPPORTED_CURRENCIES.filter((currency) => currency.region === region).map((currency) => (
            <option key={currency.code} value={currency.code}>{currency.code} — {currency.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
