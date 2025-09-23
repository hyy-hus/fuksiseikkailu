import { Option } from "@components/Forms/Form";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { FaCheck, FaChevronDown } from 'react-icons/fa';

interface SelectProps {
  disabled?: boolean;
  className?: string;
  name?: string;
  label?: string;
  value?: string | number;
  invalid?: boolean;
  errorMessage?: string;
  options?: Option[];
  onChange?: (value: string | number) => void;
}

export function Select({
  invalid = false,
  errorMessage,
  options = [],
  className,
  name,
  label,
  value,
  onChange,
}: SelectProps) {
  const colors = invalid ? "border-pink-700/30 bg-pink-900/30" : "bg-white dark:bg-fuksi-800 focus-within:bg-fuksi-200 dark:focus-within:bg-fuksi-900 border-2 border-black dark:border-black dark:text-fuksi-200";

  return (
    <div>
      <label htmlFor={name} className={`group relative flex flex-col border mt-2 has-[:invalid]:border-pink-700/30 has-[:invalid]:bg-pink-900/30   ${colors} ${className}`}>
        <span className="
                absolute -top-2 left-2 text-xs pointer-events-none px-1 w-fit
                ">
          <span className="relative z-20 dark:text-fuksi-600 dark:group-has-[:disabled]:text-slate-600">{label}</span>
          <div className={`absolute left-0 bottom-[2px] inline h-2 w-10 ${!invalid ? "bg-white dark:bg-fuksi-800 group-focus-within:bg-fuksi-200 dark:group-focus-within:bg-fuksi-900" : "bg-pink-transparent border-pink-700"} z-10 w-full group-has-[:invalid]:bg-transparent`}></div>
        </span>
        <Listbox value={value} onChange={onChange}>
          <div className="relative mt-1">
            <ListboxButton className="relative w-full cursor-default py-3 pl-3 pr-10 text-left">
              <span className="block truncate">{options.find(o => o.key == value)?.value}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 -top-2">
                <FaChevronDown className="h-5 w-5 text-gray-400" />
              </span>
            </ListboxButton>

            {/* This is your fully stylable dropdown panel */}
            <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto border-2 border-black bg-white py-1 dark:bg-fuksi-800 z-100 min-w-sm">
              {options.map((opt) => (
                <ListboxOption
                  key={opt.key}
                  value={opt.key}
                  className={({ active }: { active: boolean }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-fuksi-200 text-black dark:bg-fuksi-900' : 'dark:text-fuksi-200'
                    }`
                  }
                >
                  {({ selected }: { selected: boolean }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {opt.value}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-500">
                          <FaCheck className="h-5 w-5" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </label>
      {invalid && errorMessage && (
        <div className="mt-1 text-sm text-red-600 dark:text-rose-400/50">
          {errorMessage}
        </div>
      )}
    </div>
  )
}
