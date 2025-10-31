import ComsiganHeader from "../components/ComsiganHeader";
import ComsiganList from "../components/ComsiganList";

const ComsiganContainer = () => {
  return (
    <div className="w-screen flex flex-col justify-center items-center gap-12">
      <ComsiganHeader />
      <ComsiganList />
    </div>
  );
};

export default ComsiganContainer;
