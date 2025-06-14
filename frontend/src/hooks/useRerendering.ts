import { useState } from "react";

export const useRerendering = () => {
  const [trigger, setTrigger] = useState<number>(0);

  const rerenderTrigger = () => setTrigger(trigger + 1);

  return rerenderTrigger;
};
