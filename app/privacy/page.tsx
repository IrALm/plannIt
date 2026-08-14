import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité — PlannIt",
  description:
    "Comment PlannIt collecte, utilise et protège vos données, y compris les données Google Calendar.",
};

const CONTACT_EMAIL = "privacy@plannit-app.fr";

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updatedAt="15 août 2026">
      <p>
        PlannIt (« nous », « l&apos;application ») est une application de
        gestion de planning personnel. Cette page explique quelles données
        nous collectons, pourquoi, et comment vous pouvez les contrôler.
      </p>

      <LegalSection title="1. Qui nous sommes">
        <p>
          PlannIt est éditée à titre individuel. Pour toute question relative
          à vos données, contactez-nous à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Données de compte">
        <p>
          Lors de la création d&apos;un compte (par email/mot de passe ou via
          Google), nous collectons : votre adresse email, votre nom (si
          fourni), et un identifiant de compte unique. L&apos;authentification
          est gérée par Supabase Auth ; votre mot de passe n&apos;est jamais
          stocké en clair.
        </p>
      </LegalSection>

      <LegalSection title="3. Données nécessaires au fonctionnement de l'application">
        <p>Pour fournir le service, nous stockons :</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>
            les événements que vous créez (titre, description, date, horaires,
            rappels) ;
          </li>
          <li>les types d&apos;activité que vous définissez (nom, couleur) ;</li>
          <li>
            vos préférences (thème clair/sombre, rappels par défaut, état de
            l&apos;onboarding).
          </li>
        </ul>
        <p>
          Ces données ne sont accessibles qu&apos;à vous : notre base de
          données applique des règles de sécurité au niveau des lignes (Row
          Level Security) garantissant qu&apos;un utilisateur ne peut jamais
          lire ou modifier les données d&apos;un autre utilisateur.
        </p>
      </LegalSection>

      <LegalSection title="4. Connexion avec Google (Google OAuth)">
        <p>
          Vous pouvez vous connecter à PlannIt avec votre compte Google. Cette
          connexion nous transmet uniquement votre adresse email et votre nom
          public Google, via le fournisseur d&apos;authentification standard
          de Supabase — nous n&apos;obtenons aucun autre accès à votre compte
          Google par ce biais.
        </p>
      </LegalSection>

      <LegalSection title="5. Accès à Google Calendar">
        <p>
          Séparément de la connexion ci-dessus, PlannIt propose une
          fonctionnalité optionnelle de synchronisation avec Google Calendar,
          activable depuis les Réglages. Si vous l&apos;activez :
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>
            nous demandons l&apos;autorisation Google de portée{" "}
            <code className="font-mono text-[12.5px] bg-surface px-1 py-0.5 rounded">
              calendar.events
            </code>{" "}
            — la création, la modification et la suppression d&apos;événements
            dans votre agenda Google. Nous ne lisons pas le reste de votre
            Google Calendar (autres événements, autres agendas) au-delà de ce
            qui est nécessaire pour éviter les doublons ;
          </li>
          <li>
            cet accès sert uniquement à répliquer dans votre Google Calendar
            les événements que vous créez dans PlannIt (et inversement leur
            suppression), pour que vous les retrouviez au même endroit sur
            votre téléphone ;
          </li>
          <li>
            vous pouvez déconnecter Google Calendar à tout moment depuis les
            Réglages — cela supprime immédiatement les jetons d&apos;accès
            stockés et arrête toute synchronisation.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Stockage des jetons d'accès Google (tokens OAuth)">
        <p>
          Les jetons OAuth Google Calendar (access token et refresh token)
          sont stockés côté serveur, dans une table dédiée de notre base de
          données (chiffrée au repos par notre hébergeur, Supabase). Ils ne
          sont accessibles qu&apos;à notre logique serveur (Edge Functions) —
          jamais exposés au navigateur, jamais transmis au client, et
          invisibles pour les autres utilisateurs. Ils sont utilisés
          uniquement pour appeler l&apos;API Google Calendar en votre nom, et
          rafraîchis automatiquement quand nécessaire.
        </p>
      </LegalSection>

      <LegalSection title="7. Emails transactionnels">
        <p>
          Nous envoyons des emails liés à votre utilisation de PlannIt (email
          de bienvenue, confirmation de création d&apos;événement) via Brevo,
          notre prestataire d&apos;envoi d&apos;emails. Les emails
          d&apos;authentification (confirmation de compte, réinitialisation de
          mot de passe) sont envoyés directement par Supabase Auth. Nous ne
          vendons ni ne partageons votre adresse email à des fins marketing
          tierces.
        </p>
      </LegalSection>

      <LegalSection title="8. Sécurité">
        <p>
          Toutes les communications entre votre navigateur et nos serveurs
          sont chiffrées (HTTPS). Les secrets d&apos;application (clés API,
          identifiants OAuth) ne sont jamais exposés au frontend. L&apos;accès
          à vos données est protégé par authentification et par des règles de
          sécurité appliquées au niveau de la base de données.
        </p>
      </LegalSection>

      <LegalSection title="9. Vos droits">
        <p>
          Vous pouvez à tout moment : consulter et modifier votre profil
          depuis les Réglages, déconnecter Google Calendar depuis les
          Réglages, et demander la suppression complète de votre compte et de
          toutes les données associées en nous contactant à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline">
            {CONTACT_EMAIL}
          </a>
          . Nous traiterons toute demande de suppression dans un délai
          raisonnable.
        </p>
      </LegalSection>

      <LegalSection title="10. Modifications de cette politique">
        <p>
          Nous pouvons mettre à jour cette politique de confidentialité pour
          refléter des évolutions de l&apos;application. La date de dernière
          mise à jour en haut de cette page reflète la version en vigueur.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Pour toute question relative à cette politique ou à vos données,
          contactez-nous à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
