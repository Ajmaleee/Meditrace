import { createTheme } from '@mui/material/styles';

/**
 * MediTrace visual identity.
 *
 * Deliberately restrained: a single desaturated clinical blue as the primary
 * signal color, a muted teal for secondary/positive actions, and status
 * colors that are used ONLY to mean something (allergy = red, interaction =
 * amber, verified = green, informational = blue). No gradients, no
 * decorative color. Surfaces are flat white on a very light neutral
 * background; elevation is expressed mostly through 1px borders rather than
 * heavy shadow, which reads as "clinical document" rather than "app".
 */

declare module '@mui/material/styles' {
  interface Palette {
    clinical: {
      allergy: string;
      allergyBg: string;
      interaction: string;
      interactionBg: string;
      verified: string;
      verifiedBg: string;
      inactive: string;
      inactiveBg: string;
    };
  }
  interface PaletteOptions {
    clinical?: Palette['clinical'];
  }
}

const borderColor = '#E1E5E9';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F5C7A', // restrained medical blue
      dark: '#0A4A63',
      light: '#3D7A93',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#3C8C7C', // muted teal
      dark: '#2E6E61',
      light: '#5FA396',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#B3261E',
      light: '#F9DEDC',
    },
    warning: {
      main: '#8A5A00',
      light: '#FCEED3',
    },
    success: {
      main: '#276B47',
      light: '#DCEEE2',
    },
    info: {
      main: '#0F5C7A',
      light: '#DCEBF1',
    },
    background: {
      default: '#F6F7F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1D2226',
      secondary: '#5B6470',
    },
    divider: borderColor,
    clinical: {
      allergy: '#B3261E',
      allergyBg: '#FCEBEA',
      interaction: '#8A5A00',
      interactionBg: '#FCF3DE',
      verified: '#276B47',
      verifiedBg: '#E6F2EB',
      inactive: '#6B7480',
      inactiveBg: '#EEF0F2',
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.625rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.375rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.9375rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 500, color: '#5B6470' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', color: '#5B6470' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#F6F7F8' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${borderColor}`,
        },
        elevation0: { border: `1px solid ${borderColor}` },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderBottom: `1px solid ${borderColor}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: `1px solid ${borderColor}`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, paddingInline: 16 },
        containedPrimary: {
          '&:hover': { backgroundColor: '#0A4A63' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, borderRadius: 4 },
        sizeSmall: { fontSize: '0.75rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: '#5B6470', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 6, border: '1px solid transparent' },
        standardError: { borderColor: '#F0B7B3' },
        standardWarning: { borderColor: '#F0D89A' },
        standardSuccess: { borderColor: '#A9D2B8' },
        standardInfo: { borderColor: '#A9C7D6' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, minHeight: 44 },
      },
    },
  },
});
