const styles = theme => ({
  root: {
    maxWidth: '800px'
  },
  button: {
    marginTop: '24px'
  },
  heading: {
    fontSize: '24px',
    marginBottom: '24px'
  },
  frame: {
    border: '1px solid #e1e1e1',
    borderRadius: '3px',
    backgroundColor: '#fafafa',
    padding: '1rem'
  },
  instructions: {
    fontSize: '0.8rem',
    textAlign: 'center',
    marginBottom: '16px'
  },
  instructionUnderlined: {
    fontSize: '0.8rem',
    textDecoration: 'underline',
    textAlign: 'center',
    marginBottom: '16px'
  },
  instructionBold: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '16px'
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
  transaction: {
    padding: theme.spacing(2),
    minWidth: '150px'
  },
  transactionGrid: {
    marginBottom: theme.spacing(1)
  },
  transactionGridItem: {
    maxWidth: '100%'
  },
  transactionItemTitle: {
    fontSize: '0.9rem',
    marginBottom: '4px',
    maxWidth: '100%',
    fontWeight: 'bold'
  },
  transactionItemValue: {
    marginBottom: theme.spacing(1),
    overflowWrap: 'break-word',
  }
});

export default styles;
