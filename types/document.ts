export type DocumentRow = {
  id: string;
  verification_code: string;
  image_path: string;
  created_at: string;
  updated_at: string;
};

/** Ce qui est envoyé à l'interface admin (jamais à la page publique). */
export type AdminDocument = DocumentRow & {
  /** URL signée temporaire pour afficher la miniature dans l'admin. */
  thumbnail_url: string | null;
  /** URL publique de vérification, ex. https://verify.mondomaine.com/v/8F42A91X */
  public_url: string;
};

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };
