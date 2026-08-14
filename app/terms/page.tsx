import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — PlannIt",
  description: "Les conditions d'utilisation de l'application PlannIt.",
};

const CONTACT_EMAIL = "privacy@plannit-app.fr";

export default function TermsPage() {
  return (
    <LegalPage title="Conditions d'utilisation" updatedAt="15 août 2026">
      <p>
        En créant un compte ou en utilisant PlannIt, vous acceptez les
        conditions décrites ci-dessous.
      </p>

      <LegalSection title="1. Description du service">
        <p>
          PlannIt est une application web de gestion de planning personnel :
          création d&apos;événements organisés par types d&apos;activité
          colorés, rappels, et synchronisation optionnelle avec Google
          Calendar. PlannIt est proposée gratuitement.
        </p>
      </LegalSection>

      <LegalSection title="2. Compte utilisateur">
        <p>
          Vous devez fournir une adresse email valide pour créer un compte et
          êtes responsable de la confidentialité de votre mot de passe. Vous
          êtes responsable de toute activité effectuée depuis votre compte.
          Vous devez avoir au moins 16 ans pour utiliser PlannIt.
        </p>
      </LegalSection>

      <LegalSection title="3. Utilisation autorisée">
        <p>
          PlannIt est destinée à un usage personnel de gestion de planning.
          Vous vous engagez à ne pas utiliser le service à des fins illégales,
          à ne pas tenter d&apos;accéder aux données d&apos;autres
          utilisateurs, et à ne pas perturber le fonctionnement du service.
        </p>
      </LegalSection>

      <LegalSection title="4. Intégration Google Calendar">
        <p>
          La synchronisation avec Google Calendar est optionnelle et peut être
          activée ou désactivée à tout moment depuis les Réglages. En
          l&apos;activant, vous autorisez PlannIt à créer, modifier et
          supprimer des événements dans votre agenda Google au nom des
          événements que vous gérez dans PlannIt — voir la{" "}
          <a href="/privacy" className="text-accent underline">
            politique de confidentialité
          </a>{" "}
          pour le détail des données concernées.
        </p>
      </LegalSection>

      <LegalSection title="5. Disponibilité du service">
        <p>
          Nous nous efforçons de maintenir PlannIt disponible et fonctionnel,
          mais ne garantissons pas une disponibilité ininterrompue. Le service
          peut être temporairement suspendu pour maintenance ou évoluer sans
          préavis.
        </p>
      </LegalSection>

      <LegalSection title="6. Limitation de responsabilité">
        <p>
          PlannIt est fournie « en l&apos;état ». Nous ne pouvons être tenus
          responsables d&apos;une perte de données, d&apos;une interruption de
          service, ou d&apos;un dysfonctionnement de la synchronisation
          Google Calendar. Nous vous recommandons de ne pas faire de PlannIt
          votre unique moyen de conserver des informations critiques.
        </p>
      </LegalSection>

      <LegalSection title="7. Résiliation">
        <p>
          Vous pouvez cesser d&apos;utiliser PlannIt à tout moment et demander
          la suppression de votre compte en nous contactant. Nous nous
          réservons le droit de suspendre un compte en cas d&apos;utilisation
          contraire à ces conditions.
        </p>
      </LegalSection>

      <LegalSection title="8. Modifications">
        <p>
          Ces conditions peuvent être mises à jour ; la date en haut de cette
          page reflète la version en vigueur. Une utilisation continue de
          PlannIt après modification vaut acceptation des nouvelles
          conditions.
        </p>
      </LegalSection>

      <LegalSection title="9. Droit applicable">
        <p>Ces conditions sont régies par le droit français.</p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Pour toute question relative à ces conditions, contactez-nous à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
