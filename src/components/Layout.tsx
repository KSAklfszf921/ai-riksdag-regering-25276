import { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full bg-primary py-1 flex items-center justify-end px-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
};
