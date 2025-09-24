import { useListCheckpoints } from "@api/endpoints";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { useAdventure } from "@contexts/AdventureContext";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next"
import { t } from "i18next";
import { FaAngleDown, FaAngleUp, FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

interface SearchBarProps {
    onSubmit?: () => void;
    onChange?: (value: string) => void;
    value: string;
}

function SearchBar({
    onSubmit,
    onChange,
    value
}: SearchBarProps) {

    return (
      <form
  className="relative grid w-full min-w-0 grid-cols-[1fr_auto] grid-rows-1 items-stretch gap-2 overflow-x-hidden"
  onSubmit={(e) => {
    e.preventDefault();
    onSubmit?.();
  }}
>
  <div
    className="min-w-0" /* allow the input column to shrink */
  >
    <Input
      type="search"
      label={t("search")}
      placeholder={`${t("example-abbr.")} Akateemiset seikkailijat`}
      value={value}
      onChange={(e) => {
        onChange?.(e.target.value);
      }}
      className="h-full w-full min-w-0" /* makes the actual input shrinkable */
    />
  </div>

  <div className="flex items-end">
  <Button type="submit" className="h-13 shrink-0" variant="green">
    {t("search")}
  </Button>
</div>
</form>
    )
}

export function CheckpointsPage() {
    const { t } = useTranslation();

    const [open, setOpen] = useState<Set<number>>(() => new Set<number>());
    const [searchQuery, setSearchQuery] = useState<string>("");

    const toggleOpen = useCallback((id: number) => {
        setOpen((prev) => {
            const newOpen = new Set(prev);
            if (newOpen.has(id)) {
                newOpen.delete(id);
            } else {
                newOpen.add(id);
            }

            return newOpen;

        });

    }, []);


    const { selectedAdventure } = useAdventure();

    const { data } = useListCheckpoints(selectedAdventure?.id ?? 0);
    const checkpoints = data?.data ?? [];

    const filtered = searchQuery !== "" ? checkpoints.filter(
      cp => (`${cp.number} - ${cp.org_name} - ${cp.org_abbreviation}`.toLowerCase()).includes(searchQuery.toLowerCase())) : checkpoints

    const sorted = filtered.sort((a, b) => (a.number ?? 0) < (b.number ?? 0) ? -1 : 1);

    function openFirst() {
      if (sorted.length > 0) {
        toggleOpen(sorted[0].id);
      }
    }

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">{t("checkpoints")}</h2>
                <SearchBar onSubmit={() => openFirst()}
                  onChange={(value: string) => setSearchQuery(value)}
                  value={searchQuery}
                   />
            <ul className="flex flex-col gap-4">
                {
                    sorted.map((cp) => {
                        const isOpen = open.has(cp.id);
                        return (
                            <li key={cp.id} className={`border-2 "border-black"`}
                                onClick={() => toggleOpen(cp.id)}>
                                <div className={`p-4 bg-fuksi-400 dark:bg-slate-800 grid grid-cols-[1fr_auto]`}>
                                    <h4><span className="font-bold">#{cp.number}</span> - {cp.org_name} {cp.org_abbreviation ? <>({cp.org_abbreviation})</> : <></>}</h4>
                                    {isOpen ? (
                                        <FaAngleUp />) : (
                                        <FaAngleDown />)
                                    }
                                </div>
                                {open.has(cp.id) && (
                                    <div className="p-4 border-t-2 border-black dark:border-slate-600 bg-fuksi-200 flex flex-col gap-3">
                                        <p className="italic">{t(cp.category)}</p>
                                        <p>{cp.checkpoint_description}</p>
                                        <p>{cp.org_description}</p>
                                        <p>
                                          <Link to={`/map/${cp.id}`}>
                                            <Button>{t("view-at-map")}</Button>
                                          </Link>
                                        </p>
                                        {cp.org_link && (
                                        <p>
                                          <Link to={cp.org_link}>
                                          <span className="flex gap-2 align-center">
                                              <FaExternalLinkAlt />
                                              <span>{t("org-link")}</span>
                                          </span>
                                        </Link>
                                        </p>
                                        )}
                                    </div>
                                )
                                }
                            </li>
                        );
                    })
                }
            </ul>
        </div>
    )
}

