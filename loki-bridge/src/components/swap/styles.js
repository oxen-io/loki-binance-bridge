const styles = theme => ({
  item: {
    display: 'flex',
    justifyContent: 'center'
  },
  itemColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  spaceBetweenRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statTitle: {
    marginRight: '4px',
    fontSize: '0.84rem'
  },
  statAmount: {
    fontWeight: '600',
    fontSize: '0.94rem'
  },
  transactionTitle: {
    fontSize: '1.3rem'
  }
});

export default styles;
