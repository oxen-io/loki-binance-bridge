import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography, Paper } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { SWAP_TYPE } from '../../../../utils/constants';
import styles from './styles';

class SwapList extends Component {
  renderSwapItem = ({ uuid, type, amount, txHash, transferTxHashes, created }) => {
    const { classes } = this.props;

    const isPending = transferTxHashes && transferTxHashes.length === 0;
    const depositCurrency = type === SWAP_TYPE.LOKI_TO_BLOKI ? 'Loki' : 'B-Loki';
    const displayAmount = amount / 10e9;

    return (
      <Grid item xs={12} key={uuid} className={ classes.item }>
        <Paper className={ classes.container }>
          <Typography>Unique ID: {uuid}</Typography>
          <Typography>Amount: {displayAmount} {depositCurrency}</Typography>
          <Typography>Pending: {isPending ? 'True' : 'False'}</Typography>
          <Typography>TxHash: {txHash}</Typography>
          <Typography>TransferHashes: {transferTxHashes.join(',')}</Typography>
        </Paper>
      </Grid>
    );
  }

  renderSwaps = () => {
    const { swaps } = this.props;
    if (!swaps || swaps.length === 0) return null;

    return swaps.map(this.renderSwapItem);
  }

  render() {
    const { classes } = this.props;

    return (
      <Grid item xs={ 12 } className={ classes.root }>
        <Grid container direction="column" spacing={1}>
          {this.renderSwaps()}
        </Grid>
      </Grid>
    );
  }
}

SwapList.propTypes = {
  classes: PropTypes.object.isRequired,
  swaps: PropTypes.array.isRequired
};

export default withStyles(styles)(SwapList);
