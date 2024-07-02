import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const RouteIntercept = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.electronAPI?.routePath) {
      navigate(window.electronAPI.routePath);
    } else {
      navigate("/home");
    }
  }, []);
  return <></>;
};
