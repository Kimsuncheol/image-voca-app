import React, { createContext, useContext } from "react";

type TabLayoutContextValue = {
  goToTab: (key: string) => void;
};

const TabLayoutContext = createContext<TabLayoutContextValue | null>(null);

export function TabLayoutProvider({
  goToTab,
  children,
}: {
  goToTab: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <TabLayoutContext.Provider value={{ goToTab }}>
      {children}
    </TabLayoutContext.Provider>
  );
}

export function useTabLayout() {
  return useContext(TabLayoutContext);
}
