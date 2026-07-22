import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPage,
  Section,
  Bullets,
  Term,
  LegalTable,
} from "@/components/legal/LegalLayout";

// Czech privacy policy. A standalone route rather than a [locale] segment:
// two static documents do not justify introducing next-intl or restructuring
// every route in the app. The shared primitives live in
// components/legal/LegalLayout.tsx so the two versions stay visually identical.
//
// `alternates.languages` pairs this page with the English one so crawlers treat
// them as translations rather than duplicates. metadataBase in app/layout.tsx
// resolves these relative paths against https://flytriply.eu.

export const metadata: Metadata = {
  title: "Zásady ochrany osobních údajů",
  description:
    "Jaké údaje Triply shromažďuje, proč, kdo je zpracovává a jak dlouho je uchováváme. Text odpovídá tomu, co aplikace skutečně dělá.",
  alternates: {
    canonical: "/cs/privacy",
    languages: { en: "/privacy", cs: "/cs/privacy" },
  },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "22. července 2026";

const CONTROLLER = "Radek Tomas";

// Musí odpovídat app/privacy/page.tsx — tytéž regiony, jen česky.
const REGION_SUPABASE = "Evropská unie (Paříž)";
const REGION_VERCEL = "Spojené státy (Washington, D.C.)";
const REGION_N8N = "Evropská unie";

export default function PrivacyPageCs() {
  return (
    <LegalPage
      lang="cs"
      title="Zásady ochrany osobních údajů"
      lastUpdatedLabel="Poslední aktualizace:"
      lastUpdated={LAST_UPDATED}
      enHref="/privacy"
      csHref="/cs/privacy"
    >
      <Section title="Kdo za vaše údaje odpovídá">
        <p>
          Triply (flytriply.eu) provozuje <Term>{CONTROLLER}</Term>, fyzická osoba se sídlem v České
          republice. Nejde o obchodní společnost — neexistuje žádný zapsaný subjekt ani IČO.{" "}
          {CONTROLLER} je správcem osobních údajů ve vztahu ke všemu, co je zde popsáno.
        </p>
        <p>
          S čímkoli, co se těchto zásad týká, včetně uplatnění vašich práv, se obracejte na{" "}
          <a href="mailto:hello@flytriply.eu" className="text-accent hover:underline underline-offset-2">
            hello@flytriply.eu
          </a>
          .
        </p>
      </Section>

      <Section title="Co Triply dělá, v jednom odstavci">
        <p>
          Zadáte rozpočet, termín, výchozí město a několik preferencí. Ty odešleme jazykovému
          modelu, který navrhne tři destinace s programem a rozpisem nákladů. Každá zobrazená cena
          je odhadem modelu — nedotazujeme se žádné služby s cenami letenek, ubytování ani aktivit.
          Proto jsou ceny v celém rozhraní označeny symbolem ≈.
        </p>
      </Section>

      <Section title="Jaké údaje shromažďujeme">
        <p>
          <Term>Když plánovač používáte bez účtu:</Term>
        </p>
        <Bullets>
          <li>
            Rozpočet, termín cesty, počet cestujících, výchozí město, styl cesty a nepovinnou
            preferovanou destinaci.
          </li>
          <li>
            Pokud zvolíte cestu autem místo letadla: výchozí město a maximální dobu jízdy.
          </li>
        </Bullets>

        <p>
          <Term>Když si založíte účet:</Term>
        </p>
        <Bullets>
          <li>
            Používáme Supabase Auth. Zaregistrovat se můžete přes Google, nebo e-mailem a heslem.
          </li>
          <li>
            Pokud použijete Google, získáme z vašeho profilu e-mailovou adresu, jméno a odkaz na
            profilovou fotografii. Odkaz uložíme do naší databáze a obrázek načítáme ze serverů
            Google — samotnou fotografii u sebe neukládáme.
          </li>
          <li>
            Ukládáme: vaše ID uživatele, e-mailovou adresu, zobrazované jméno, odkaz na profilovou
            fotografii, datum založení účtu, denní počítadlo vygenerovaných cest, údaj o tom, zda
            jste udělili souhlas s marketingovými e-maily, a zda jste se odhlásili.
          </li>
          <li>
            Vaše heslo, pokud jej používáte, ukládá a ověřuje Supabase. My je nikdy nevidíme.
          </li>
        </Bullets>

        <p>
          <Term>Při používání účtu:</Term>
        </p>
        <Bullets>
          <li>Destinace, které si uložíte, včetně cesty, ze které pocházejí.</li>
          <li>Historie cest, které si necháte vygenerovat.</li>
        </Bullets>

        <p>
          <Term>Analytika:</Term>
        </p>
        <Bullets>
          <li>
            Zaznamenáváme, ke kterým krokům v produktu se dostanete: zobrazení úvodní stránky,
            zahájení formuláře, vygenerování cesty, výběr destinace, zobrazení detailu cesty,
            kliknutí na partnerský odkaz, založení účtu, zadání e-mailu.
          </li>
          <li>
            Každá událost je označena identifikátorem{" "}
            <code className="text-[13px]">triply_session_id</code>, náhodným řetězcem uloženým ve
            vašem prohlížeči, jehož platnost nevyprší. <Term>Nejde o anonymní údaj.</Term> Je to
            trvalý pseudonymní identifikátor, a jakmile si založíte účet, propojíme s ním všechny
            události dříve zaznamenané pod tímto identifikátorem. Chcete-li tomuto propojení
            zabránit, vymažte před registrací úložiště prohlížeče.
          </li>
          <li>
            Dále používáme Vercel Analytics pro souhrnné měření návštěvnosti. Nenastavuje žádné
            soubory cookie a nesleduje vás napříč jinými weby.
          </li>
        </Bullets>

        <p>
          <Term>Když nám pošlete zpětnou vazbu:</Term> to, co napíšete, a vaši e-mailovou adresu,
          pokud ji uvedete. Tyto údaje se odesílají do naší automatizační služby, abychom si je
          mohli přečíst a odpovědět vám.
        </p>

        <p>
          <Term>Serverové protokoly:</Term> náš poskytovatel hostingu Vercel zaznamenává běžné
          protokoly požadavků včetně IP adresy, identifikace prohlížeče a času. Uchovávají se podle
          pravidel společnosti Vercel, která neurčujeme, a proto zde neuvádíme žádnou konkrétní
          dobu.
        </p>
      </Section>

      <Section title="Na jakém právním základě údaje zpracováváme">
        <Bullets>
          <li>
            <Term>Plnění smlouvy, čl. 6 odst. 1 písm. b).</Term> Údaje z formuláře, váš účet, uložené
            destinace a historie cest. Bez nich služba nemůže fungovat.
          </li>
          <li>
            <Term>Souhlas, čl. 6 odst. 1 písm. a).</Term> Pouze marketingové e-maily. Nic jiného na
            souhlasu nestojí a souhlas můžete kdykoli odvolat.
          </li>
          <li>
            <Term>Oprávněný zájem, čl. 6 odst. 1 písm. f).</Term> Produktová analytika, serverové
            protokoly a omezení počtu požadavků, která brání zneužití generátoru cest. Naším zájmem
            je rozumět tomu, zda produkt funguje, a udržet jej v provozu. Proti tomuto zpracování
            můžete kdykoli podat námitku na výše uvedené adrese.
          </li>
        </Bullets>
      </Section>

      <Section title="E-maily">
        <p>Jsou dvojího druhu a zacházíme s nimi odlišně.</p>

        <p>
          <Term>
            Servisní e-maily — odhlásit se z nich nelze, protože je potřebujete k používání účtu:
          </Term>
        </p>
        <Bullets>
          <li>Uvítací zpráva po registraci.</li>
          <li>Potvrzení o uložení destinace.</li>
          <li>
            Autentizační zprávy: potvrzení e-mailu, obnovení hesla, přihlašovací odkazy a potvrzení
            změny e-mailové adresy.
          </li>
        </Bullets>

        <p>
          <Term>Marketingové e-maily — pouze na základě souhlasu:</Term>
        </p>
        <Bullets>
          <li>
            Dvě připomenutí po uložení destinace, odeslaná po jednom a po sedmi dnech.
          </li>
          <li>
            Odesíláme je pouze tehdy, pokud jste při registraci zaškrtli příslušné políčko. Ve
            výchozím stavu je nezaškrtnuté. Pokud jste jej nezaškrtli, tyto e-maily nikdy neobdržíte.
          </li>
          <li>
            Každý marketingový e-mail obsahuje funkční odkaz pro odhlášení, jedinečný pro vás a
            kryptograficky podepsaný. Podporováno je i tlačítko pro odhlášení vestavěné ve vašem
            e-mailovém klientovi. Odhlášení zastaví marketingové e-maily okamžitě a trvale; servisní
            e-maily chodí dál.
          </li>
        </Bullets>

        <p>E-maily doručuje služba Resend ve Spojených státech.</p>
      </Section>

      <Section title="Soubory cookie a úložiště prohlížeče">
        <p>
          Podle pravidel směrnice ePrivacy se na <code className="text-[13px]">localStorage</code> a{" "}
          <code className="text-[13px]">sessionStorage</code> vztahují stejná pravidla jako na
          soubory cookie. Níže je uvedeno vše, co ve vašem zařízení ukládáme.
        </p>

        <p>
          <Term>Soubory cookie:</Term>
        </p>
        <LegalTable
          headers={["Název", "Účel", "Platnost", "Typ"]}
          rows={[
            [
              <code key="c1" className="text-[13px]">
                sb-&lt;project-ref&gt;-auth-token
              </code>,
              "Udržuje vás přihlášené",
              "400 dní",
              "Nezbytně nutný",
            ],
            [
              <code key="c2" className="text-[13px]">
                sb-&lt;project-ref&gt;-auth-token-code-verifier
              </code>,
              "Dokončuje zabezpečenou výměnu při přihlášení",
              "Dočasný, po dokončení se maže",
              "Nezbytně nutný",
            ],
          ]}
        />

        <p>
          <Term>localStorage:</Term>
        </p>
        <LegalTable
          headers={["Název", "Účel", "Platnost"]}
          rows={[
            [
              <code key="l1" className="text-[13px]">
                triply_session_id
              </code>,
              "Analytický identifikátor (viz výše)",
              "Nevyprší",
            ],
            [
              "Počítadlo generování bez přihlášení",
              "Vynucuje denní limit cest zdarma pro nepřihlášené",
              "Trvalé",
            ],
            [
              "Příznak přihlášení do pořadníku",
              "Pamatuje si, že jste se již přihlásili, abychom se neptali znovu",
              "Trvalé",
            ],
            ["Zvolená měna", "Vaše preferovaná měna", "Trvalé"],
            ["Mezipaměť směnných kurzů", "Zabraňuje opakovanému stahování kurzů", "24 hodin"],
          ]}
        />

        <p>
          <Term>sessionStorage:</Term> příznak, který jednou za relaci prohlížeče zaznamená
          zobrazení úvodní stránky.
        </p>
        <p>
          Nepoužíváme žádné reklamní cookies, žádné sledování napříč weby ani skripty třetích stran
          určené ke sledování.
        </p>
      </Section>

      <Section title="Kdo další vaše údaje zpracovává">
        <LegalTable
          headers={["Zpracovatel", "Co zpracovává", "Umístění"]}
          rows={[
            ["Vercel", "Hosting, serverové protokoly, souhrnná analytika", REGION_VERCEL],
            ["Supabase", "Databáze a autentizace", REGION_SUPABASE],
            ["OpenAI", "Jazykový model, který tvoří doporučení", "Spojené státy"],
            ["Resend", "Odesílání e-mailů", "Spojené státy"],
            ["n8n", "Automatizace propojující aplikaci s modelem", REGION_N8N],
            ["Google", "Identita při přihlášení, pokud použijete Google", "USA / celosvětově"],
            [
              "Pexels, Unsplash",
              "Fotografie destinací (neodesílají se žádné osobní údaje)",
              "Spojené státy",
            ],
            [
              "photon.komoot.io",
              <>
                Našeptávač měst — <Term>přijímá názvy měst, které píšete</Term>
              </>,
              "EU",
            ],
            [
              "open.er-api.com",
              "Směnné kurzy (neodesílají se žádné osobní údaje)",
              "Umístění nebylo ověřeno",
            ],
          ]}
        />
        <p>
          Pokud zpracovatel nakládá s vašimi údaji mimo Evropský hospodářský prostor, opírá se
          předání o standardní smluvní doložky Evropské komise a — je-li poskytovatel certifikován —
          o rámec EU&ndash;US Data Privacy Framework, spolu s vlastními podmínkami zpracování údajů
          daného poskytovatele.
        </p>
      </Section>

      <Section title="Partnerské odkazy">
        <p>
          Z některých odchozích odkazů nám plyne provize. Nikdy to nemění cenu, kterou zaplatíte, a
          jazykový model nemá žádnou informaci o tom, kteří partneři nám platí — nelze jej tím
          ovlivnit.
        </p>
        <Bullets>
          <li>
            <Term>Booking.com</Term> prostřednictvím partnerské sítě{" "}
            <Term>CJ (Commission Junction)</Term>. Po kliknutí projdete přes sledovací odkaz CJ,
            který kliknutí zaznamená a přesměruje vás na Booking.com. CJ i Booking.com nastavují
            vlastní cookies podle svých vlastních zásad.
          </li>
          <li>
            Odkazy na <Term>GetYourGuide</Term> aktuálně <Term>neobsahují</Term> žádné partnerské
            sledování a nic nám nevydělávají. Pokud se to změní, upravíme nejprve tuto stránku.
          </li>
        </Bullets>
      </Section>

      <Section title="Jak dlouho údaje uchováváme">
        <LegalTable
          headers={["Údaje", "Doba uchování"]}
          rows={[
            [
              "Vygenerované cesty (sdílená mezipaměť, bez vazby na uživatele)",
              "30 dní, poté se automaticky mažou",
            ],
            ["Analytické události", "90 dní, poté se automaticky mažou"],
            ["Váš profil, uložené destinace, historie cest", "Po dobu existence vašeho účtu"],
          ]}
        />
        <p>
          Obě automatická mazání probíhají jako naplánované úlohy. U ničeho, co pravidelně nemažeme,
          dobu uchování neuvádíme.
        </p>
        <p>
          Zpětná vazba, kterou nám pošlete, se předává naší automatizační službě n8n a v naší
          vlastní databázi se neukládá. Doba jejího uchování se proto řídí službou n8n, nikoli námi.
        </p>
      </Section>

      <Section title="Smazání účtu">
        <p>
          Na stránce svého profilu použijte možnost &bdquo;Delete account&ldquo;. Budete vyzváni,
          abyste pro potvrzení napsali DELETE. Tím se okamžitě a trvale odstraní váš profil, uložené
          destinace, historie cest, analytické události i samotné přihlášení.
        </p>
        <p>
          Jedna věc zůstává záměrně zachována: sdílená mezipaměť vygenerovaných cest. Tyto záznamy
          obsahují pouze parametry cesty — rozpočet, termín, názvy měst — bez ID uživatele, bez
          e-mailu a bez jakéhokoli identifikátoru, a jsou sdílené mezi všemi uživateli Triply. Samy
          zaniknou do 30 dnů.
        </p>
      </Section>

      <Section title="Vaše práva">
        <p>
          Můžete nás požádat o kopii svých údajů, o jejich opravu, výmaz, přenos v přenositelném
          formátu, omezení zpracování nebo vznést námitku proti zpracování založenému na oprávněném
          zájmu. Tam, kde se opíráme o souhlas, jej můžete kdykoli odvolat. Napište na{" "}
          <a href="mailto:hello@flytriply.eu" className="text-accent hover:underline underline-offset-2">
            hello@flytriply.eu
          </a>{" "}
          — žádný formulář ani proces neexistuje, stačí nám napsat.
        </p>
        <p>
          Pokud máte za to, že s vašimi údaji nakládáme nesprávně, můžete podat stížnost u českého
          dozorového úřadu: <Term>Úřad pro ochranu osobních údajů</Term>, Pplk. Sochora 27, 170 00
          Praha 7,{" "}
          <a
            href="https://www.uoou.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline underline-offset-2"
          >
            uoou.cz
          </a>
          .
        </p>
      </Section>

      <Section title="Změny">
        <p>
          Pokud se tyto zásady podstatně změní, uvedeme to na webu. Datum v záhlaví vždy odpovídá
          aktuální verzi.
        </p>
        <p className="text-sm text-muted mt-8">
          Hledáte pravidla používání služby? Přečtěte si naše{" "}
          <Link href="/cs/terms" className="text-accent hover:underline underline-offset-2">
            Podmínky služby
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
