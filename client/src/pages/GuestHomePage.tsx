import { Button } from "@components/Button";
import { useTranslation } from "react-i18next"
import { FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

export function GuestHomePage() {

    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    return (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">
            {t("welcome")}
          </h2>
      {currentLang == "fi" ? (
        <>
          <p>
            Fuksisyksyn suurin seikkailu odottaa! HYYn Fuksiseikkailussa Helsingin yliopiston uudet opiskelijat kisaavat huimilla rasteilla ympäri Helsingin keskustaa. Voittajat saavat kunnian lisäksi upeita palkintoja. Joukkueiden kannattaa panostaa myös pukeutumiseen, sillä yleisön suosikkiasu palkitaan ruhtinaallisesti!
          </p>
          <p>
            Katso lisätietoja <span className="inline flex gap-2"><a href="https://fuksiseikkailu.fi" className="underline">fuksiseikkailun tapahtumasivulta <FaExternalLinkAlt className="inline" /></a></span>
            </p>
            <div className="flex gap-4">
                <Button>
                    <Link to="/checkpoints">
                        Selaa rasteja
                    </Link>
                </Button>
                <Button>
                    <Link to="/map">
                        Etsi rasteja kartalla
                    </Link>
                </Button>
            </div>
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
