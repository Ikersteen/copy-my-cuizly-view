import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Legal = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/mentions');
  }, [navigate]);

  return null;
};

export default Legal;