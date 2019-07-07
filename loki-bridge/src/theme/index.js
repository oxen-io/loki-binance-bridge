export const colors = {
  lokiGreen: '#5BCA5B',
  lokiBlack90: '#0A0A0A',
  lokiBlack80: '#252525',
  lokiBlack60: '#313131',
  lokiBlack50: '#7E7E7E',
  white: '#fff',
  black: '#000',
  gray: '#e1e1e1',
  lightGray: '#fafafa',
  lightBlack: '#6a6a6a',
  darkBlack: '#141414'
};

const theme =  {
  typography: {
    fontFamily: ['Lato', 'Roboto', 'Open Sans', 'sans-serif'].join(','),
    lineHeight: 1.45,
    useNextVariants: true,
    h6: {
      fontFamily: ['Source Sans Pro','sans-serif'].join(','),
      fontSize: '0.8rem',
      // color: colors.darkBlack,
      fontWeight: 600,
      marginBottom: '.5rem'
    }
  },
  type: 'light',
  overrides: {
    MuiInputBase: {
      root: {
        fontSize: '13px',
        background: colors.lokiBlack60
      }
    },
    MuiOutlinedInput: {
      input: {
        padding: '14px'
      }
    },
    MuiPrivateNotchedOutline: {
      root: {
        borderRadius: '0px'
      }
    },
    MuiButton: {
      label: {
        fontSize: '0.7rem'
      }
    },
  },
  palette: {
    type: 'dark',
    primary: {
      main: colors.lokiGreen
    },
    secondary: {
      main: colors.lightBlack
    },
    background:{
      paper: colors.lokiBlack60,
      default: colors.lokiBlack80
    },
    text: {
      primary: colors.gray,
      secondary: colors.lokiGreen
    }
  }
};

export default theme;
