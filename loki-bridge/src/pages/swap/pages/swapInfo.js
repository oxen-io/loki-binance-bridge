import React, { Component } from 'react';
import PropTypes from 'prop-types';
import QRCode from 'qrcode.react';
import AnimateHeight from 'react-animate-height';
import { Grid, Typography, IconButton, Link } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { FileCopyOutlined as CopyIcon } from '@material-ui/icons';
import { Button, QRIcon } from '@components';
import { SWAP_TYPE } from '@constants';
import { store, Events } from '@store';
import SwapList from '../components/swapList';
import styles from '../styles';

class SwapInfo extends Component {
  state = {
    info: {},
    showQR: false,
    qrSize: 128,
  };

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
    this.onInfoUpdated();
    store.on(Events.FETCHED_INFO, this.onInfoUpdated);
  }

  componentDidMount() {
    // Run a timer every 10 seconds to refresh
    this.timer = setInterval(this.props.onRefresh, 30 * 1000);

    this.onResize();
    window.addEventListener('resize', this.onResize);
  }

  componentWillUnmount() {
    store.removeListener(Events.FETCHED_INFO, this.onInfoUpdated);
    window.removeEventListener('resize', this.onResize);
    clearInterval(this.timer);
  }

  onInfoUpdated = () => {
    this.setState({ info: store.getStore('info') || {} });
  }

  onResize = () => {
    const width = window.innerWidth;
    const qrSize = (width <= 600) ? 128 : 210;
    this.setState({ qrSize });
  }

  toggleQR = () => {
    this.setState({ showQR: !this.state.showQR });
  }

  renderQR = () => {
    const { showQR, qrSize } = this.state;
    const { classes, swapInfo } = this.props;
    const { depositAddress } = swapInfo;

    const height = showQR ? 'auto' : 0;

    return (
      <AnimateHeight
        duration={250}
        height={height}
      >
        <div className={classes.qrContainer}>
          <div className={classes.qr}>
            <QRCode value={depositAddress} renderAs='canvas' size={qrSize} />
          </div>
        </div>
      </AnimateHeight>
    );
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

  renderInstructions = () => {
    const { info } = this.state;
    const { swapType, classes, swapInfo } = this.props;

    const { depositAddress } = swapInfo;
    const depositCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'LOKI' : 'B-LOKI';

    const lokiFee = (info && info.fees && info.fees.loki / 1e9) || 0;
    let lokiConfirmations = (info && info.minLokiConfirmations);
    if (typeof lokiConfirmations != 'number') { lokiConfirmations = '-'; }

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
            <div className={classes.actionButtons}>
              <IconButton onClick={() => this.onCopy('depositAddress')}>
                <CopyIcon/>
              </IconButton>
              <IconButton onClick={this.toggleQR}>
                <QRIcon />
              </IconButton>
            </div>
          </Typography>
          {this.renderQR() }
          {this.renderMemo() }
          <Typography className={ classes.instructions }>
            After you've completed the transfer, click the <b>"REFRESH"</b> button to see if any swap requests have gone through.
          </Typography>
          { swapType === SWAP_TYPE.LOKI_TO_BLOKI && (
            <Typography className={ classes.instructions }>
              <b>Note:</b> You will have to wait for there to be atleast {lokiConfirmations} confirmations before your request is logged.
            </Typography>
          )}
          { swapType === SWAP_TYPE.BLOKI_TO_LOKI && (
            <Typography className={ classes.instructionBold }>
              There will be a processing fee of {lokiFee} LOKI which will be charged when processing all your pending swaps.
            </Typography>
          )}
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
    const { classes, swapType, loading, onRefresh, swapInfo, unconfirmedTxs, onBack } = this.props;

    const unconfirmed = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? unconfirmedTxs : [];
    const unconfirmedSwaps = (unconfirmed || []).map(({ hash, amount, created }) => ({
      uuid: hash,
      type: SWAP_TYPE.LOKI_TO_BLOKI,
      amount,
      txHash: hash,
      transferTxHashes: [],
      created,
      unconfirmed: true,
    }));

    const swaps = [...unconfirmedSwaps, ...(swapInfo.swaps || [])];

    return (
      <React.Fragment>
        <Grid item xs={ 12 } align='left' className={ classes.back }>
          <Typography>
            <Link className={classes.link} onClick={onBack}>
              &lt; Back
            </Link>
          </Typography>
        </Grid>
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
        <SwapList swaps={swaps} />
      </React.Fragment>
    );
  }
}

SwapInfo.propTypes = {
  classes: PropTypes.object.isRequired,
  swapType: PropTypes.string.isRequired,
  swapInfo: PropTypes.object.isRequired,
  unconfirmedTxs: PropTypes.array,
  onRefresh: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default withStyles(styles)(SwapInfo);
