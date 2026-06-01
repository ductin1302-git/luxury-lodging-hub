import { useMemo, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/common/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/common/popover";
import type { Province } from "@/services/locationService";

type ProvinceComboboxProps = {
  value: string;
  provinces: Province[];
  onSelect: (provinceName: string) => void;
  disabled?: boolean;
};

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const ProvinceCombobox = ({ value, provinces, onSelect, disabled }: ProvinceComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredProvinces = useMemo(() => {
    const keyword = normalizeSearch(query);
    if (!keyword) return provinces;

    return provinces.filter((province) => {
      const name = normalizeSearch(province.name);
      const codeName = normalizeSearch(province.codename || "");

      return name.includes(keyword) || codeName.includes(keyword);
    });
  }, [provinces, query]);

  const handleSelect = (provinceName: string) => {
    onSelect(provinceName);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900 outline-none transition-all hover:border-blue-300 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-muted dark:text-white"
          aria-label="Chọn tỉnh/thành phố"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-green-600" />
            <span className={value ? "truncate" : "truncate text-gray-400"}>
              {value || "Chọn tỉnh/thành phố"}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Gõ để tìm nhanh, ví dụ: g, da, ho..."
          />
          <CommandList className="max-h-72">
            <CommandEmpty>Không tìm thấy tỉnh/thành phù hợp.</CommandEmpty>
            <CommandGroup heading="Tỉnh/Thành phố Việt Nam">
              {filteredProvinces.map((province) => (
                <CommandItem
                  key={province.code}
                  value={province.name}
                  onSelect={() => handleSelect(province.name)}
                  className="cursor-pointer justify-between px-3 py-2.5"
                >
                  <span>{province.name}</span>
                  {value === province.name && <Check className="h-4 w-4 text-green-600" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProvinceCombobox;
