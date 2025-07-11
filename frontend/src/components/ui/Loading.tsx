import * as React from "react";
import { cn } from "@/lib/utils";

const spinnerVariants = "w-16 h-16 border-4 border-t-4 border-gray-200 border-t-gray-600 rounded-full animate-spin";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Loading = React.forwardRef<HTMLDivElement, LoadingProps>((props, ref) => {
  const { className, ...rest } = props;
  return <div ref={ref} className={cn(spinnerVariants, className)} {...rest} />;
});

Loading.displayName = "Loading";
