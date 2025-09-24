import { useListNews } from "@api/endpoints";
import { useAdventure } from "@contexts/AdventureContext";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next"
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

export function NewsPage() {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    const [readNews, setReadNews] = useState<Set<number>>(() => {
        const stored = localStorage.getItem("readNews");
        return stored ? new Set(JSON.parse(stored)) : new Set();
    })

    const [open, setOpen] = useState<Set<number>>(() => new Set<number>());

    const toggleOpen = useCallback((id: number) => {
        setOpen((prev) => {
            const newOpen = new Set(prev);
            if (newOpen.has(id)) {
                newOpen.delete(id);
            } else {
                newOpen.add(id);

                setReadNews(prevRead => {
                    if (prevRead.has(id)) {
                        return prevRead;
                    }

                    const newRead = new Set(prevRead);
                    newRead.add(id);

                    localStorage.setItem("readNews", JSON.stringify([...newRead]));
                    return newRead;
                })
            }

            return newOpen;

        });

    }, []);

    // const queryClient = useQueryClient();
    const { selectedAdventure } = useAdventure();

    const { data } = useListNews(selectedAdventure?.id ?? 0);
    const news = data?.data ?? [];

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("news")}</h2>
            <ul className="flex flex-col gap-4">
                {
                    news.sort((a, b) => (a.published_at ?? 0) > (b.published_at ?? 0) ? -1 : 1).map((post) => {
                        const isOpen = open.has(post.id);
                        const isRead = readNews.has(post.id);

                        console.log(currentLang);

                        const title = post[`title_${currentLang}` as keyof typeof post] ?? post.title_fi;
                        const contents = post[`contents_${currentLang}` as keyof typeof post] ?? post.contents_fi;

                        return (
                            <li key={post.id} className={`border-2 ${!isRead ? "border-sky-900 dark:border-sky-600" : "border-black"}`}
                                onClick={() => toggleOpen(post.id)}>
                                <div className={`p-4 ${!isRead ? "font-bold bg-sky-300" : "font-base"} bg-fuksi-400 dark:bg-fuksi-700 grid grid-cols-[1fr_auto]`}>
                                    <h4>{title}</h4>
                                    {isOpen ? (
                                        <FaAngleUp />) : (
                                        <FaAngleDown />)
                                    }
                                </div>
                                {open.has(post.id) && (
                                    <div className="p-4 border-t-2 border-black bg-fuksi-200 dark:bg-fuksi-800">
                                        <p>{contents}</p>
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
