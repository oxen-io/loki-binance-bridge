import { red } from '@material-ui/core/colors';
import { colors } from '@theme';

const styles = theme => ({
  root: {
    maxWidth: '800px'
  },
  button: {
    marginTop: '24px'
  },
  back: {
    marginBottom: theme.spacing(2),
  },
  heading: {
    fontSize: '24px',
    marginBottom: '24px'
  },
  frame: {
    borderRadius: '3px',
    backgroundColor: theme.palette.background.paper,
    padding: '1rem'
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
  hash: {
    fontSize: '0.8rem',
    textAlign: 'center',
    marginBottom: '16px',
    maxWidth: '100%',
    cursor: 'pointer'
  },
  disclaimer: {
    fontSize: '16px',
    marginTop: '24px',
    lineHeight: '42px',
    maxWidth: '250px'
  },
  createAccount: {
    fontSize: '0.8rem',
    textDecoration: 'underline',
    textAlign: 'right',
    marginBottom: '16px',
    cursor: 'pointer',
    display: 'inline-block',
    float: 'right'
  },
  stats: {
    marginTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end'
  },
  statTitle: {
    marginRight: '4px',
    fontSize: '0.84rem'
  },
  statAmount: {
    fontWeight: '600',
    fontSize: '0.94rem'
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
    backgroundColor: colors.lokiBlack80,
    color: 'white',
    padding: '1rem',
    overflowWrap: 'break-word',
    maxWidth: '100%',
    textAlign: 'center'
  },
  redText: {
    color: theme.palette.text.secondary,
    margin: theme.spacing(1, 0)
  },
  link: {
    cursor: 'pointer'
  }
});

export default styles;
