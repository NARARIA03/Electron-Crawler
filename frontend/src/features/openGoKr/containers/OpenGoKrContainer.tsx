import OpenGoKrHeader from "../components/OpenGoKrHeader";
import OpenGoKrList from "../components/OpenGoKrList";

const OpenGoKrContainer = () => {
  return (
    <div className="w-screen flex flex-col justify-center items-center gap-12">
      <OpenGoKrHeader />
      <OpenGoKrList />
    </div>
  );
};

export default OpenGoKrContainer;
