const styles = theme => ({
  root: {
    maxWidth: '400px'
  },
  button: {
    marginTop: '24px'
  },
  heading: {
    fontSize: '24px',
    marginBottom: '24px'
  },
  image: {
    padding: '24px',
    margin: '0 auto',
    width: '280px'
  },
  instruction: {
    marginBottom: '24px'
  },
  bordered: {
    padding: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgb(216, 216, 216)',
    backgroundColor: 'rgb(249, 249, 249)',
    minHeight: '180px',
    marginTop: '24px'
  },
  borderedError: {
    padding: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#f44336',
    backgroundColor: 'rgb(249, 249, 249)',
    minHeight: '180px',
    marginTop: '24px'
  },
  mnemonic: {
    wordSpacing: '16px',
    lineHeight: '30px',
    fontSize: '18px',
    fontWeight: '600'
  },
  step: {
    marginBottom: '12px'
  },
  wordPaper: {
    width: 'fit-content',
    padding: '4px 10px',
    display: 'inline-block',
    margin: '6px 12px',
    cursor: 'pointer'
  },
  accountAddress: {
    lineHeight: '30px',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default styles;
