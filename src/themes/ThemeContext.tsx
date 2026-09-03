import React, { createContext, useContext, useEffect } from 'react';
import { ThemeDefinition, getTheme, applyThemeToDocument } from './index';

interface ThemeContextType {
  activeTheme: ThemeDefinition;
  themeId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  updateTheme: (themeId: string, customPrimary?: string, customSecondary?: string, customAccent?: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{
  schoolSettings?: any;
  children: React.ReactNode;
}> = ({ schoolSettings, children }) => {
  const themeId = schoolSettings?.themeId || 'classic-blue';
  const activeTheme = getTheme(themeId);
  const primaryColor = schoolSettings?.primaryColor || activeTheme.primary;
  const secondaryColor = schoolSettings?.secondaryColor || activeTheme.secondary;
  const accentColor = schoolSettings?.accentColor || activeTheme.accent;

  useEffect(() => {
    applyThemeToDocument(themeId, primaryColor, secondaryColor, accentColor);
  }, [themeId, primaryColor, secondaryColor, accentColor]);

  const updateTheme = (newThemeId: string, customPrimary?: string, customSecondary?: string, customAccent?: string) => {
    applyThemeToDocument(newThemeId, customPrimary, customSecondary, customAccent);
  };

  return (
    <ThemeContext.Provider value={{
      activeTheme,
      themeId,
      primaryColor,
      secondaryColor,
      accentColor,
      updateTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    const fallbackTheme = getTheme('classic-blue');
    return {
      activeTheme: fallbackTheme,
      themeId: 'classic-blue',
      primaryColor: fallbackTheme.primary,
      secondaryColor: fallbackTheme.secondary,
      accentColor: fallbackTheme.accent,
      updateTheme: applyThemeToDocument
    };
  }
  return context;
};
