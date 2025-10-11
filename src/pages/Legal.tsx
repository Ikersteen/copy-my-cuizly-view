import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Legal = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    const newPath = i18n.language === 'fr' ? '/fr/mentions-legales' : '/en/mentions';
    navigate(newPath);
  }, [navigate, i18n.language]);

  return null;
};

export default Legal;