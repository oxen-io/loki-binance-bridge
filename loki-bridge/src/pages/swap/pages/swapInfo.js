import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography, IconButton } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { FileCopyOutlined as CopyIcon } from '@material-ui/icons';
import { Button } from '@components';
import { SWAP_TYPE } from '@constants';
import { store, Events } from '@store';
import SwapList from '../components/swapList';
import styles from '../styles';

class SwapInfo extends Component {
  onCopy = (id) => {
    var elm = document.getElementById(id);
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

  componentWillMount() {
    this.onWithdrawalFeesUpdated();
    store.on(Events.FETCHED_WITHDRAWAL_FEES, this.onWithdrawalFeesUpdated);
  }

  componentWillUnmount() {
    store.removeListener(Events.FETCHED_WITHDRAWAL_FEES, this.onWithdrawalFeesUpdated);
  }

  onWithdrawalFeesUpdated = () => {
    this.setState({ fees: store.getStore('fees') || {} });
  }

  renderMemo = () => {
    const { classes, swapInfo: { memo }} = this.props;
    if (!memo) return null;

    return (
      <div className={classes.memoFrame}>
        <Typography className={classes.redText}>
          PLEASE READ CAREFULLY
        </Typography>
        <Typography id='memo' className={classes.memo}>
          {memo}
        </Typography>
        <IconButton
          onClick={() => this.onCopy('memo')}
        >
          <CopyIcon/>
        </IconButton>
        <Typography>
          When creating the transaction, please paste the string above into the <b>Memo</b> field. <br/>
        </Typography>
        <Typography>Ensure that this is the only thing that you put in the field.</Typography>
        <Typography className={classes.redText}>
          If done incorrectly then you will not receive <b>LOKI</b> into your designated address.
        </Typography>
      </div>
    );
  }

  renderLokiInstructions = () => {
    const { fees } = this.state;
    const { swapType, classes } = this.props;
    if (swapType !== SWAP_TYPE.LOKI_TO_BLOKI) return null;

    const lokiFee = (fees && fees.loki / 1e9) || 0;

    return (
      <React.Fragment>
        <Typography className={ classes.instructionsNoMargin }>
          <b>Note:</b> You will have to wait for there to be atleast 12 confirmations before your request is logged.
        </Typography>
        <Typography className={ classes.instructionBold }>
          There will be a processing fee of {lokiFee} LOKI which will be charged when processing all your pending swaps.
        </Typography>
      </React.Fragment>
    );
  }

  renderInstructions = () => {
    const { swapType, classes, swapInfo } = this.props;

    const { depositAddress } = swapInfo;
    const depositCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'LOKI' : 'B-LOKI';

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
          <Typography className={ classes.instructions }>
            Here's what you need to do next:
          </Typography>
          <Typography className={ classes.instructionBold }>
            Transfer your {depositCurrency}
          </Typography>
          <Typography className={ classes.instructions }>
            to
          </Typography>
          <Typography component={'div'} className={ classes.instructionBold }>
            <div id='depositAddress'>{depositAddress}</div>
            <IconButton
              onClick={() => this.onCopy('depositAddress')}
            >
              <CopyIcon/>
            </IconButton>
          </Typography>
          {this.renderMemo() }
          <Typography className={ classes.instructions }>
            After you've completed the transfer, click the <b>"REFRESH"</b> button to see if any swap requests have gone through.
          </Typography>
          {this.renderLokiInstructions()}
          <Typography className={ classes.instructions }>
            You can leave this page and come back later to refresh your swap requests. <br/>
            If you run into any trouble, or your swap request has not gone through, please contact us.
          </Typography>
        </Grid>
      </React.Fragment>
    );
  }

  renderReceivingAmount = () => {
    const { classes, swapType, swapInfo } = this.props;
    if (!swapInfo || !swapInfo.swaps || swapInfo.swaps.length === 0) return null;

    const receivingCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'B-LOKI' : 'LOKI';

    const pendingSwaps = swapInfo.swaps.filter(s => s.transferTxHashes && s.transferTxHashes.length === 0);
    const total = pendingSwaps.reduce((total, swap) => total + parseFloat(swap.amount), 0);
    const displayTotal = total / 1e9;

    return (
      <Grid item xs={ 12 } align='right' className={ classes.stats }>
        <Typography className={classes.statTitle}>Pending Amount:</Typography>
        <Typography className={classes.statAmount}>{displayTotal} {receivingCurrency}</Typography>
      </Grid>
    );
  }

  render() {
    const { classes, loading, onRefresh, swapInfo } = this.props;

    return (
      <React.Fragment>
        {this.renderInstructions()}
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth
            label="Refresh"
            disabled={loading}
            onClick={onRefresh}
          />
        </Grid>
        {this.renderReceivingAmount()}
        <SwapList swaps={swapInfo.swaps} />
      </React.Fragment>
    );
  }
}

SwapInfo.propTypes = {
  classes: PropTypes.object.isRequired,
  swapType: PropTypes.string.isRequired,
  swapInfo: PropTypes.object.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default withStyles(styles)(SwapInfo);
