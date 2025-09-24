import { getFetchPhotoQueryKey, useFetchPhoto, useLikePhoto, useListPhotos, useTagPhoto } from "@api/endpoints";
import { ListPhotosParams, PublicPhoto } from "@api/model";
import { Button } from "@components/Button";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { t } from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaHeart } from "react-icons/fa";

function Photo({ photo, clickHandler }: { photo: PublicPhoto, clickHandler: () => void }) {
  const clickTimer = useRef<number | null>(null);
  const burstTimer = useRef<number | null>(null);
  const [bursting, setBursting] = useState(false);

  const queryClient = useQueryClient();
  const like = useLikePhoto({
    mutation: {
      onSuccess: async () => {
      }
    }
  });

   const handlePhotoClick =
    (p: PublicPhoto) => (e: React.MouseEvent<HTMLImageElement>) => {
      if (clickTimer.current) clearTimeout(clickTimer.current);

      if (e.detail === 1) {
        // single click (open overlay) – delay so dblclick can cancel it
        clickTimer.current = window.setTimeout(() => {
          clickHandler();
          clickTimer.current = null;
        }, 200);
      } else if (e.detail === 2) {
        // double click -> like + heart burst
        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
          clickTimer.current = null;
        }

        like.mutate({ photoId: p.id });
        queryClient.invalidateQueries({ queryKey: getFetchPhotoQueryKey(p.id) });

        // trigger the heart animation
        if (burstTimer.current) clearTimeout(burstTimer.current);
        setBursting(true);
        burstTimer.current = window.setTimeout(() => {
          setBursting(false);
          burstTimer.current = null;
        }, 650);
      }
    };

  useEffect(() => {
    return () => {
      if (clickTimer.current) clearTimeout(clickTimer.current);
      if (burstTimer.current) clearTimeout(burstTimer.current);
    };
  }, []);


  return (
    <div className="relative">
    <img src={photo.thumb_url} loading="lazy" className="w-full h-auto z-0" onClick={handlePhotoClick(photo)} />
    <div
        className={clsx(
          "pointer-events-none absolute inset-0 flex items-center justify-center",
          "transition-opacity transition-transform duration-500 ease-out",
          bursting ? "opacity-100 scale-110" : "opacity-0 scale-75"
        )}
      >
        <FaHeart className="text-red-500 text-[10rem] drop-shadow" />
      </div>
    </div>
  )
}

function Overlay({ photo_id, closeHandler }: { photo_id: number, closeHandler: () => void }) {

  const [ teamNumber, setTeamNumber ] = useState<number | undefined>(undefined);
  const [ tagOpen, setTagOpen] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const like = useLikePhoto({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getFetchPhotoQueryKey(photo_id) });
      }
    }
  });

  const tag = useTagPhoto({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getFetchPhotoQueryKey(photo_id) });
      }
    }
  })

  function sendTag(team_id: number) {
    tag.mutate({ photoId: photo_id, tagId: team_id})
  }

  const { data: photoReq } = useFetchPhoto(photo_id)
  const photo = photoReq?.data;

  function sendLike() {
    like.mutate({ photoId: photo?.id ?? 0 });
  }


  if (!photo) {
    return (<></>)
  }
  return (
    <div className="absolute w-full h-full top-0 left-0 bg-black/95 text-white" onClick={(e) => {
      if (e.target === e.currentTarget) closeHandler();
    }} tabIndex={-1}>
      <div className="pt-2 p-0 md:p-10 flex flex-col gap-4" >
        <div>
          <Button variant="transparent" onClick={closeHandler}>X</Button>
        </div>
        <img src={photo.resized_url} loading="lazy" className="w-full h-auto z-0" />
        <div className="pl-3 pr-3">
          <Button variant="transparent" className="flex gap-2 z-1" onClick={sendLike}><FaHeart className="inline mt-1" />{photo.likes}</Button>
        </div>
      { !tagOpen ? (
        <div className="flex w-full justify-center">
          <Button onClick={() => {
            setTagOpen(true);
          }}>
              {t("is-this-your-team")}
            </Button>
        </div>
        ) : (
        <form className="flex flex-col gap-4 w-full p-2 justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            sendTag(teamNumber ?? 0)
            setTagOpen(false);
          }}
          >
          <label className="flex flex-col gap-1">
          <span className="text-sm">{t("team-number")}</span>
          <input className="bg-slate-800 border border-slate-700 p-2" type="number" value={teamNumber} onChange={(e) => setTeamNumber(Number(e.target.value))} />
            </label>
          <Button type="submit">
            {t("tag-team")}
          </Button>
        </form>
        )}
      </div>
    </div>
  )
}

export function CostumePage() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const [overlay, setOverlay] = useState<PublicPhoto | undefined>(undefined);

  const limit = 10;
  const [offset, setOffset] = useState(0);
  const [allPhotos, setAllPhotos] = useState<PublicPhoto[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const params: ListPhotosParams = useMemo(
    () => ({
      limit,
      offset,
      sort: "newest",
      search_query: undefined,
    }),
    [limit, offset]
  );

  const { data: costumeResponse, isFetching, } = useListPhotos(params);
  // const photos = costumeResponse?.data;

  useEffect(() => {
    const page = costumeResponse?.data ?? [];
    if (!page) return;

    setAllPhotos((prev) => {
      // Dedupe by a stable key; prefer an id if you have one:
      const keyOf = (p: PublicPhoto) => (p as any).id ?? p.resized_url;
      const seen = new Set(prev.map(keyOf));
      const merged: PublicPhoto[] = [...prev];
      for (const p of page) {
        const k = keyOf(p);
        if (!seen.has(k)) {
          seen.add(k);
          merged.push(p);
        }
      }
      return merged;
    });

    // If we got fewer than limit, no more pages.
    setHasMore(page.length === limit);
  }, [costumeResponse, limit]);

  // IntersectionObserver to trigger loading next page
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setOffset((o) => o + limit);
    }
  }, [isFetching, hasMore, limit]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) onLoadMore();
      },
      { root: null, rootMargin: "300px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [onLoadMore]);






  if (!isFetching && allPhotos.length === 0 && !hasMore) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">
          {t("costume-contest")}
        </h2>
        {currentLang == "fi" ? (
          <>
            <p>
              Tällä sivulla voit äänestää asukilpailun voittajajoukkuetta.
            </p>
            <p>
              Kuvat eivät ole vielä saatavilla. Palaathan myöhemmin uudestaan!
            </p>
          </>
        ) : (
          <>
            <p>
              On this page you can vote for the winner of the costume competition.
            </p>
            <p>
              The photos are not yet available. Please come back later!
            </p>
          </>
        )}
      </div>
    )
  }



  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">
        {t("costume-contest")}
      </h2>
        {currentLang == "fi" ? (
          <>
            <p>
              Tällä sivulla voit äänestää asukilpailun voittajajoukkuetta. Skrollaa kuvia ja äänestä tuplaklikkaamalla parhaita. Kuvan voi myös avata suuremmaksi ja käydä merkitsemässä oman joukkueensa kuvaan!
            </p>
          </>
        ) : (
          <>
            <p>
              On this page you can vote for the winner of the costume competition. Scroll the photos and doubleclick to vote for the best ones. You can also open the image larger and tag your own team to the photo!
            </p>
          </>
        )}
      <div className="flex flex-col gap-4">
        {allPhotos.map((p) => (
          <Photo key={(p as any).id ?? p.resized_url} photo={p} clickHandler={() => setOverlay(p)} />
        ))}

        {/* Loading indicator */}
        {isFetching && (
          <div className="py-4 text-center opacity-70">{t("loading")}…</div>
        )}

        {/* Sentinel for infinite scroll */}
        {hasMore && <div ref={sentinelRef} className="h-1" />}
      </div>
      <Overlay photo_id={overlay?.id ?? 0} closeHandler={() => setOverlay(undefined)} />
    </div>
  )
}
