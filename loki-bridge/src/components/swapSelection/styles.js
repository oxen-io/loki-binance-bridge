import { common } from '@theme';

const styles = theme => ({
  root: {
    [theme.breakpoints.up('md')]: {
      maxWidth: '600px',
    },
    ...common.section,
  },
  button: {
    marginTop: '24px'
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
});

export default styles;
