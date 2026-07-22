import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, Bullets, Term } from "@/components/legal/LegalLayout";

// Czech terms of service. Vocabulary is kept deliberately consistent with
// app/cs/privacy/page.tsx — the same Czech term is used for the same concept
// across both documents (partnerský odkaz, provize, jazykový model, zpracovatel),
// so the two read as one body of text rather than two separate translations.

export const metadata: Metadata = {
  title: "Podmínky služby",
  description:
    "Pravidla používání Triply: odkud pocházejí ceny, co slibujeme a co ne, účty a jak fungují partnerské odkazy.",
  alternates: {
    canonical: "/cs/terms",
    languages: { en: "/terms", cs: "/cs/terms" },
  },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "22. července 2026";

const CONTROLLER = "Radek Tomas";

export default function TermsPageCs() {
  return (
    <LegalPage
      lang="cs"
      title="Podmínky služby"
      lastUpdatedLabel="Poslední aktualizace:"
      lastUpdated={LAST_UPDATED}
      enHref="/terms"
      csHref="/cs/terms"
    >
      <Section title="S kým uzavíráte dohodu">
        <p>
          Triply (flytriply.eu) provozuje <Term>{CONTROLLER}</Term>, fyzická osoba se sídlem v České
          republice. Nestojí za ním žádná obchodní společnost. Používáním Triply uzavíráte tyto
          podmínky s touto osobou. Kontakt:{" "}
          <a href="mailto:hello@flytriply.eu" className="text-accent hover:underline underline-offset-2">
            hello@flytriply.eu
          </a>
          .
        </p>
      </Section>

      <Section title="Co Triply je">
        <p>
          Zadáte rozpočet, termín a několik preferencí. Jazykový model navrhne tři destinace s
          návrhem programu a rozpisem nákladů. To je celý produkt.
        </p>
      </Section>

      <Section title="Odkud pocházejí čísla — tuto část si přečtěte">
        <p>
          Každý údaj, který Triply zobrazuje, vytváří jazykový model na základě úvahy o obvyklých
          nákladech.{" "}
          <Term>
            Nedotazujeme se žádné služby s cenami letenek, ubytování ani aktivit.
          </Term>{" "}
          Nic na tomto webu není cenová nabídka, závazný návrh ani cena, kterou bychom ověřili.
        </p>
        <p>
          Znamená to, že zde uvedená cena může být zastaralá, sezónně nepřesná nebo prostě chybná.
          Ceny jsou proto všude označeny symbolem ≈. Berte každé číslo jako výchozí bod pro vlastní
          ověření a skutečnou cenu si před jakýmkoli závazkem zkontrolujte přímo u poskytovatele.
        </p>
        <p>
          Totéž platí pro vše ostatní, co model napíše: otevírací dobu, dobu cesty, co stojí za
          návštěvu i to, zda se někam vyplatí jet v únoru. Jde o poučený návrh, nikoli o ověřený
          fakt.
        </p>
      </Section>

      <Section title="Neprodáváme cestovní služby">
        <p>
          Triply není cestovní kancelář, cestovní agentura ani prodejce cestovních služeb.
          Nepřijímáme rezervace a nezpracováváme platby. Letenku, ubytování či aktivitu si
          rezervujete přímo u daného poskytovatele a smlouvu uzavíráte s ním, podle jeho podmínek.
          Pokud se u rezervace něco pokazí — zrušení, vrácení peněz, pokoj neodpovídající popisu —
          řeší se to mezi vámi a poskytovatelem. Nemůžeme do toho zasáhnout a k vaší rezervaci nemáme
          přístup.
        </p>
      </Section>

      <Section title="Účty">
        <p>Účet je nepovinný; plánovač funguje i bez něj. Pokud si jej založíte:</p>
        <Bullets>
          <li>
            Uvádějte pravdivé údaje. Pokud se přihlásíte přes Google, přebíráme z tohoto účtu vaše
            jméno a e-mail.
          </li>
          <li>
            Odpovídáte za to, co se pod vaším přihlášením děje. Máte-li podezření, že k němu má
            přístup někdo další, změňte si heslo.
          </li>
          <li>
            Počet cest, které lze vygenerovat, je denně omezen. Je to proto, že každé generování nás
            stojí peníze.
          </li>
          <li>
            Účet můžete kdykoli smazat na stránce svého profilu. Jde o okamžitý a nevratný krok —
            co přesně se odstraní, uvádějí{" "}
            <Link href="/cs/privacy" className="text-accent hover:underline underline-offset-2">
              Zásady ochrany osobních údajů
            </Link>
            .
          </li>
          <li>
            Účet, který je zneužíván k poškozování služby, můžeme pozastavit nebo zrušit.{" "}
            <Term>Pokud tak učiníme, sdělíme vám důvod na e-mail uvedený u účtu.</Term>
          </li>
        </Bullets>
      </Section>

      <Section title="Přiměřené užívání">
        <p>
          Nestahujte prosím obsah webu automatizovaně, neovládejte generátor cest skripty,
          nezkoumejte API kvůli zranitelnostem a nepoužívejte Triply k vytváření čehokoli
          protiprávního.
        </p>
        <p>
          Uplatňujeme základní omezení počtu požadavků, aby provoz generátoru zůstal únosný. Řekněme
          to na rovinu: jde o praktickou brzdu, nikoli o bezpečnostní záruku, a nevedeme žádný
          seznam blokovaných adres. Pokud je někdo obejde a bude nás to stát peníze, budeme to řešit
          až v ten okamžik — včetně odepření přístupu.
        </p>
      </Section>

      <Section title="Partnerské odkazy">
        <p>Z některých odchozích odkazů nám plyne provize. Konkrétně:</p>
        <Bullets>
          <li>
            Odkazy na ubytování na <Term>Booking.com</Term> vedou přes partnerskou síť{" "}
            <Term>CJ (Commission Junction)</Term>. Pokud po kliknutí provedete rezervaci, můžeme
            obdržet provizi.
          </li>
          <li>
            Odkazy na <Term>GetYourGuide</Term> aktuálně neobsahují žádné partnerské sledování a nic
            nám nevydělávají.
          </li>
        </Bullets>
        <p>
          Tři věci stojí za jasné vyjádření. <Term>Nikdy nezaplatíte více</Term> jen proto, že jde o
          partnerský odkaz — cena je stejná jako při přímém nákupu.{" "}
          <Term>Neovlivňuje to naše doporučení</Term>: jazykový model, který vybírá destinace, nemá
          žádnou informaci o tom, kteří partneři nám platí, a nemůže je tedy zvýhodnit. A{" "}
          <Term>
            každý odkaz, ze kterého nám skutečně plyne provize, je jako partnerský označen přímo v
            místě, kde na něj klikáte
          </Term>
          , nejen zde.
        </p>
        <p>Příjmy z partnerských odkazů jsou důvodem, proč je Triply zdarma.</p>
      </Section>

      <Section title="Co neslibujeme">
        <p>
          Služba je poskytována tak, jak je. Neslibujeme, že bude vždy dostupná, že vám doporučení
          budou vyhovovat, že ceny budou přesné ani že destinace bude ve vašem termínu volná.
          Stavíme to pečlivě, ale jsme jeden člověk a je to zdarma.
        </p>
      </Section>

      <Section title="Právo na odstoupení od smlouvy">
        <p>
          Triply je zdarma a neuzavíráte s námi žádnou úplatnou smlouvu, proto se čtrnáctidenní
          právo na odstoupení od smlouvy uzavřené na dálku neuplatní. Pokud někdy zavedeme placenou
          funkci, změní se to a dáme vám to vědět dříve, než cokoli zaplatíte.
        </p>
      </Section>

      <Section title="Omezení odpovědnosti">
        <p>
          V maximálním rozsahu, který právo připouští, neodpovídáme za peníze, o které přijdete
          proto, že se zde uvedená cena lišila od skutečné, za komplikace na cestě, za spory s
          poskytovatelem, u něhož jste rezervovali, ani za nepřímé či následné škody.
        </p>
        <p>
          Nic zde neomezuje odpovědnost za smrt či újmu na zdraví způsobenou nedbalostí, za podvod
          ani za cokoli dalšího, co nelze zákonně vyloučit. Jste-li spotřebitel, uplatní se kogentní
          ochrana podle práva země vašeho bydliště bez ohledu na znění tohoto dokumentu.
        </p>
      </Section>

      <Section title="Změny">
        <p>
          Tyto podmínky můžeme aktualizovat. Podstatné změny označíme na webu a datum v záhlaví vždy
          odpovídá aktuální verzi. Pokračováním v používání Triply po změně vyjadřujete souhlas s
          novým zněním.
        </p>
      </Section>

      <Section title="Rozhodné právo a spory">
        <p>
          Řídí se českým právem. Pokud se něco nepodaří vyřešit e-mailem, jsou příslušné české soudy
          — opět bez dotčení kogentních spotřebitelských práv země vašeho bydliště.
        </p>
        <p>
          Jako spotřebitel můžete rovněž využít evropskou platformu pro řešení sporů online, případně
          v České republice Českou obchodní inspekci (
          <a
            href="https://www.coi.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline underline-offset-2"
          >
            coi.cz
          </a>
          ) pro mimosoudní řešení spotřebitelských sporů.
        </p>
        <p className="text-sm text-muted mt-8">
          Jak nakládáme s vašimi údaji, popisují{" "}
          <Link href="/cs/privacy" className="text-accent hover:underline underline-offset-2">
            Zásady ochrany osobních údajů
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
