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
                    <Link to="/checkpoints">
                        Etsi rasteja kartalla
                    </Link>
                </Button>
            </div>
        </>
      ) : (
        <>

          <p>
              The greatest adventure of your fresher autumn awaits! In HYY’s Fresher Adventure, new students at the University of Helsinki complete tasks at exciting checkpoints all around downtown Helsinki. Winners will receive both glory and stunning prizes. Teams are also encouraged to invest in their costumes, as the public’s favourite costume will be handsomely rewarded!
          </p>
          <p>
            Find more information at <span className="inline flex gap-2"><a href="https://fuksiseikkailu.fi" className="underline">Fresher Adventure's event page <FaExternalLinkAlt className="inline" /></a></span>
            </p>
            <div className="flex gap-4">
                <Button>
                    <Link to="/checkpoints">
                        Browse checkpoints
                    </Link>
                </Button>
                <Button>
                    <Link to="/checkpoints">
                        Find checkpoints on the map
                    </Link>
                </Button>
            </div>
        </>
      )}

        </div>
    )
}
