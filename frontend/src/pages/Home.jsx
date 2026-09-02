import { FaHome } from "react-icons/fa";
import { DUStats } from "../components/daisyUI/DUStats";
import useGetStats from "../hooks/profile/useGetStats";
import { useState } from "react";
import { useEffect } from "react";

const Home = () => {
  const DEFAULT_NAME = "Juanito Pérez";

  const getEmail = (user) => {
    if (!user) {
      return DEFAULT_NAME;
    }
    try {
      return String(user?.email)?.split("@")[0];
    } catch (error) {
      return DEFAULT_NAME;
    }
  }

  const user = JSON.parse(sessionStorage.getItem("usuario")) || "";
  const username = user?.username || getEmail(user) || DEFAULT_NAME;

  const { fetchStats } = useGetStats();
  const [statsData, setStatsData] = useState(null);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const getStatsData = async () => {
      const statsData = await fetchStats();
      setStatsData(statsData);
    };
    getStatsData();
  }, []);

  return (
    <div className="home-banner">
      <h2 className="card-title mb-2">Bienvenido,<div className="italic m-0">{String(username).toUpperCase()}</div>.</h2>
      <DUStats stats={statsData}></DUStats>
    </div>
  );
};

export default Home;
