import { colors, common } from '@theme';

const styles = theme => ({
  root: {
    [theme.breakpoints.up('md')]: {
      maxWidth: '800px',
      position: 'sticky',
      top: 0,
    },
    ...common.section,
  },
  instructionContainer: {
    ...common.flexCenter,
    flexDirection: 'column',
    wordBreak: 'break-word',
  },
  instructions: {
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: '16px'
  },
  instructionBold: {
    color: colors.white,
    fontSize: '0.9rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '16px',
    overflowWrap: 'break-word',
  },
  memoFrame: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  memo: {
    border: '1px solid',
    borderColor: colors.lokiBlack90,
    borderRadius: '3px',
    backgroundColor: colors.lokiBlack90,
    color: 'white',
    padding: '1rem',
    overflowWrap: 'break-word',
    maxWidth: '100%',
    textAlign: 'center'
  },
  warningText: {
    color: theme.palette.text.secondary,
    margin: theme.spacing(1, 0),
    textAlign: 'center',
  },
  link: {
    cursor: 'pointer'
  },
  qr: {
    padding: theme.spacing(1),
    backgroundColor: 'white',
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  }
});

export default styles;
