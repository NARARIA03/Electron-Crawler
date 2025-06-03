import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes, PropsWithChildren } from "react";

type Props = { isOpen: boolean } & PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export const ModalRoot = forwardRef<HTMLDivElement, Props>(({ isOpen, className, ...props }, ref) => {
  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 flex justify-center items-center backdrop-blur-2xl bg-black bg-opacity-25 z-10",
        className
      )}
      {...props}
    />
  );
});

ModalRoot.displayName = "ModalRoot";
