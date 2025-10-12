import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const countries = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'États-Unis' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
];

export const PhoneInput = ({ 
  id, 
  value, 
  onChange, 
  placeholder = "(514) 465-4783",
  className = "",
  required = false 
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[1]); // Default to Canada

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = e.target.value;
    // Always include the country code in the value
    onChange(phoneValue);
  };

  return (
    <div className="flex gap-2">
      <Select
        value={selectedCountry.country}
        onValueChange={(country) => {
          const selected = countries.find(c => c.country === country);
          if (selected) setSelectedCountry(selected);
        }}
      >
        <SelectTrigger className="w-[120px] overflow-visible">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm">{selectedCountry.code}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.country} value={country.country}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{country.flag}</span>
                <span className="text-sm">{country.name}</span>
                <span className="text-xs text-muted-foreground">{country.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="relative flex-1">
        <Phone className="absolute left-3 top-3 h-4 w-4 text-cuizly-neutral" />
        <Input
          id={id}
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={handlePhoneChange}
          className={`pl-10 text-sm ${className}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          required={required}
        />
      </div>
    </div>
  );
};
