-- Configure custom email templates to use our edge functions

-- Update auth config to use custom email templates
UPDATE auth.config 
SET 
  external_email_enabled = true,
  external_email_confirm_signup_template = '{
    "subject": "Confirmez votre adresse email - Cuizly",
    "body": "Pour confirmer votre inscription, cliquez sur ce lien : {{ .ConfirmationURL }}",
    "redirect_to": "{{ .RedirectTo }}"
  }',
  external_email_reset_password_template = '{
    "subject": "Réinitialisation de votre mot de passe Cuizly", 
    "body": "Pour réinitialiser votre mot de passe, cliquez sur ce lien : {{ .ConfirmationURL }}",
    "redirect_to": "{{ .RedirectTo }}"
  }',
  external_email_magic_link_template = '{
    "subject": "Votre lien de connexion Cuizly",
    "body": "Pour vous connecter, cliquez sur ce lien : {{ .ConfirmationURL }}",
    "redirect_to": "{{ .RedirectTo }}"
  }'
WHERE id = 1;

-- If no config exists, insert it
INSERT INTO auth.config (
  id,
  external_email_enabled,
  external_email_confirm_signup_template,
  external_email_reset_password_template,
  external_email_magic_link_template
) 
SELECT 
  1,
  true,
  '{
    "subject": "Confirmez votre adresse email - Cuizly",
    "body": "Pour confirmer votre inscription, cliquez sur ce lien : {{ .ConfirmationURL }}",
    "redirect_to": "{{ .RedirectTo }}"
  }',
  '{
    "subject": "Réinitialisation de votre mot de passe Cuizly", 
    "body": "Pour réinitialiser votre mot de passe, cliquez sur ce lien : {{ .ConfirmationURL }}",
    "redirect_to": "{{ .RedirectTo }}"
  }',
  '{
    "subject": "Votre lien de connexion Cuizly",
    "body": "Pour vous connecter, cliquez sur ce lien : {{ .ConfirmationURL }}",
    "redirect_to": "{{ .RedirectTo }}"
  }'
WHERE NOT EXISTS (SELECT 1 FROM auth.config WHERE id = 1);