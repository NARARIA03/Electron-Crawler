import { Body, Header } from "../components";

export const OpenGoKrContainer = () => {
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center p-24 gap-24">
      <Header />
      <Body />
    </div>
  );
};
