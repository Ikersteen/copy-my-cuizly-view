const Mentions = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          Mentions légales
        </h1>
        
        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Éditeur du site</h2>
            <div className="text-cuizly-neutral space-y-2">
              <p><strong>Raison sociale :</strong> Cuizly Technologie Inc.</p>
              <p><strong>Forme juridique :</strong> Société par actions</p>
              <p><strong>Siège social :</strong> Montréal, Québec, Canada</p>
              <p><strong>Président Directeur Général :</strong> Iker Kiomba Landu</p>
              <p><strong>Email :</strong> contact@cuizly.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Hébergement</h2>
            <div className="text-cuizly-neutral space-y-2">
              <p><strong>Hébergeur :</strong> Supabase Inc.</p>
              <p><strong>Adresse :</strong> San Francisco, CA, États-Unis</p>
              <p><strong>Site web :</strong> https://supabase.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Directeur de la publication</h2>
            <div className="text-cuizly-neutral">
              <p>Iker Kiomba Landu, Président Directeur Général</p>
              <p>Email : contact@cuizly.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Propriété intellectuelle</h2>
            <p className="text-cuizly-neutral">
              L'ensemble de ce site relève de la législation canadienne et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Données personnelles</h2>
            <p className="text-cuizly-neutral">
              Conformément à la loi canadienne sur la protection des renseignements personnels, vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant. Pour exercer ce droit, contactez-nous à privacy@cuizly.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Responsabilité</h2>
            <p className="text-cuizly-neutral">
              Cuizly Technologie Inc. ne pourra être tenue responsable des dommages directs et indirects causés au matériel de l'utilisateur, lors de l'accès au site, et résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications indiquées, soit de l'apparition d'un bug ou d'une incompatibilité.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Droit applicable</h2>
            <p className="text-cuizly-neutral">
              Tout litige en relation avec l'utilisation du site Cuizly est soumis au droit canadien et québécois. Il est fait attribution exclusive de juridiction aux tribunaux compétents de Montréal.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Mentions;