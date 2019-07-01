import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography, Paper } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { Button } from '@components';
import { SWAP_TYPE, TYPE } from '@constants';
import styles from '../styles';

class Transactions extends Component {
  onCopy = () => {
    var elm = document.getElementById('depositAddress');
    let range;
    // for Internet Explorer

    if (document.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(elm);
      range.select();
      document.execCommand('Copy');
    } else if (window.getSelection) {
      // other browsers
      var selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(elm);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('Copy');
    }
  };

  renderTotals = () => {
    const { classes, transactions, swapInfo, swapType } = this.props;
    const { userAddressType, lokiAddress, bnbAddress } = swapInfo;

    const receiveCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'B-Loki' : 'Loki';
    const userAddress = userAddressType === TYPE.LOKI ? lokiAddress : bnbAddress;

    const reducer = (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount);
    const totalAmount = transactions.reduce(reducer, 0);

    return (
      <React.Fragment>
        <Typography className={ classes.instructions }>
          You will receive another <b>{totalAmount} {receiveCurrency}</b> in your address <b>{userAddress}</b>
        </Typography>
      </React.Fragment>
    );
  };

  renderTransactions = () => {
    const { classes, transactions, swapType } = this.props;

    const depositCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'Loki' : 'B-Loki';

    const transactionItems = transactions.map((transaction) => (
      <Grid item key={transaction.uuid} className={ classes.transactionGridItem }>
        <Paper className={ classes.transaction }>
          <div>
            <Typography className={ classes.transactionItemTitle }>
              Unique ID
            </Typography>
            <Typography className={ classes.transactionItemValue }>
              {transaction.uuid}
            </Typography>
          </div>
          <div>
            <Typography className={ classes.transactionItemTitle }>
             Amount
            </Typography>
            <Typography className={ classes.transactionItemValue }>
              {transaction.amount / 10e9} {depositCurrency}
            </Typography>
          </div>
          <div>
            <Typography className={ classes.transactionItemTitle }>
              Tx Hashes
            </Typography>
            <Typography className={ classes.transactionItemValue }>
              {transaction.txHash}
            </Typography>
          </div>
        </Paper>
      </Grid>
    ));

    return (
      <Grid container spacing={1} alignItems="center" className={ classes.transactionGrid }>
        {transactionItems}
      </Grid>
    );
  };

  render() {
    const { classes, loading, onDone } = this.props;

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
          <Typography className={ classes.instructionBold }>
          Swap request pending
          </Typography>
          <Typography className={ classes.instructions }>
          We have added the following transaction/s to our log for your address:
          </Typography>
          { this.renderTransactions() }
          { this.renderTotals() }
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth
            label="Done"
            disabled={loading}
            onClick={onDone}
          />
        </Grid>
      </React.Fragment>
    );
  }
}

Transactions.propTypes = {
  classes: PropTypes.object.isRequired,
  swapType: PropTypes.string.isRequired,
  swapInfo: PropTypes.object.isRequired,
  transactions: PropTypes.array.isRequired,
  onDone: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default withStyles(styles)(Transactions);
