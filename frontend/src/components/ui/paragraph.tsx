import type { HTMLAttributes, PropsWithChildren } from "react";

type HeadingProps = PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>;

type ParagraphProps = PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>;

export const H1 = (props: HeadingProps) => {
  return (
    <h1
      className="scroll-m-20 text-zinc-800 text-center text-4xl font-extrabold tracking-tight text-balance pointer-events-none select-none"
      {...props}
    />
  );
};

export const H2 = (props: HeadingProps) => {
  return (
    <h2
      className="scroll-m-20 text-zinc-800 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 pointer-events-none select-none"
      {...props}
    />
  );
};

export const Paragraph = (props: ParagraphProps) => {
  return <p className="leading-7 [&:not(:first-child)]:mt-6 pointer-events-none select-none" {...props} />;
};
