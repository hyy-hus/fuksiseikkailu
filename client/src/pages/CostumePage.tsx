import { useTranslation } from "react-i18next";

export function CostumePage() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

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
