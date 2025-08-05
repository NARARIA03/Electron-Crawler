import Header from "../components/Header";
import List from "../components/List";
import { useSyncIpcToZustand } from "../hooks/useSyncIpcToZustand";

const OpenGoKrContainer = () => {
  useSyncIpcToZustand();

  return (
    <div className="w-screen flex flex-col justify-center items-center gap-12">
      <Header />
      <List />
    </div>
  );
};

export default OpenGoKrContainer;
