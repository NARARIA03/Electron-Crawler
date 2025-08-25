import NaraG2bHeader from "../components/NaraG2bHeader";
import NaraG2bList from "../components/NaraG2bList";

const NaraG2bContainer = () => {
  return (
    <div className="w-screen flex flex-col justify-center items-center gap-12">
      <NaraG2bHeader />
      <NaraG2bList />
    </div>
  );
};

export default NaraG2bContainer;
