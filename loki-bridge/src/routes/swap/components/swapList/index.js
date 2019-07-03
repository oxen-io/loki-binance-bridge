import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'timeago-react';
import dateformat from 'dateformat';
import { Grid, Typography, Paper, Divider, Link } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import config from '@config';
import { SWAP_TYPE } from '@constants';
import styles from './styles';

class SwapList extends Component {
  renderHash = (type, txHash, transferTxHashes) => {
    const { classes } = this.props;

    const baseUrl = type === SWAP_TYPE.LOKI_TO_BLOKI ? config.loki.txExplorerUrl : '';
    const hashes = transferTxHashes.length === 0 ? [txHash] : transferTxHashes;
    const hashItems = hashes.map(hash => {
      const url = `${baseUrl}/${hash}`;
      return (
        <Typography key={hash} className={classes.hash}>
          <Link href={url}>
            {hash}
          </Link>
        </Typography>
      );
    });

    if(transferTxHashes.length === 0) {
      return (
        <React.Fragment>
          <Typography className={classes.hashTitle}>Deposit Transaction Hash</Typography>
          {hashItems[0]}
        </React.Fragment>
      );
    }

    const swapTitle = transferTxHashes.length === 1 ? 'Swap Transaction Hash' : 'Swap Transaction Hashes';
    return (
      <React.Fragment>
        <Typography className={classes.hashTitle}>{swapTitle}</Typography>
        {hashItems}
      </React.Fragment>
    );
  }

  renderTime = (created) => {
    const { classes } = this.props;
    const now = Date.now();
    const timestamp = Date.parse(created);
    const diff = Math.abs(now - timestamp);
    const dayMs = 24 * 60 * 60 * 1000;

    const showFullDate = diff > dayMs;
    if (showFullDate) {
      const formatted = dateformat(timestamp, 'dd/mm/yyyy');
      return (
        <Typography className={classes.time}>{formatted}</Typography>
      );
    }

    return <TimeAgo className={classes.time} datetime={timestamp} />;
  }

  renderSwapItem = ({ uuid, type, amount, txHash, transferTxHashes, created }) => {
    const { classes } = this.props;

    const isPending = transferTxHashes && transferTxHashes.length === 0;
    const depositCurrency = type === SWAP_TYPE.LOKI_TO_BLOKI ? 'LOKI' : 'B-LOKI';
    const displayAmount = amount / 1e9;

    return (
      <Grid item xs={12} key={uuid} className={classes.item}>
        <Paper className={classes.container}>
          <div className={classes.info}>
            <Typography className={classes.amount}>{displayAmount} {depositCurrency}</Typography>
            <div className={classes.rowCenter}>
              <Typography className={isPending ? classes.pending : classes.completed}>
                {isPending ? 'Pending' : 'Completed'}
              </Typography>
              <Typography className={classes.timeSeperator}> • </Typography>
              { this.renderTime(created) }
            </div>
          </div>
          <Divider variant="middle" className={classes.divider} />
          <div className={classes.infoHash}>
            { this.renderHash(type, txHash, transferTxHashes) }
          </div>
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
      <Grid item xs={ 12 } className={classes.root}>
        <Grid container direction="column" spacing={1}>
          {this.renderSwaps()}
        </Grid>
      </Grid>
    );
  }
}

SwapList.propTypes = {
  classes: PropTypes.object.isRequired,
  swaps: PropTypes.array
};

export default withStyles(styles)(SwapList);
