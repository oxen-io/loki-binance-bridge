import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography, IconButton, Paper } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { FileCopyOutlined as CopyIcon } from '@material-ui/icons';
import { Button } from '../../../components';
import { SWAP_TYPE, TYPE } from '../../../utils/constants';
import SwapList from '../components/swapList';
import styles from '../styles';

class SwapInfo extends Component {
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

  renderInstructions = () => {
    const { swapType, classes, swapInfo } = this.props;

    const { userAddressType, lokiAddress, bnbAddress } = swapInfo;

    const depositCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'Loki' : 'B-Loki';
    const depositAddress = userAddressType === TYPE.LOKI ? bnbAddress : lokiAddress;

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
              style={{
                verticalAlign: 'top',
                marginRight: '-5px'
              }}
              onClick={this.onCopy}
            >
              <CopyIcon/>
            </IconButton>
          </Typography>
          <Typography className={ classes.instructions }>
            After you've completed the transfer, click the <b>"REFRESH"</b> button to see if any swap requests have gone through. <br/>
            <b>Note:</b> You will have to wait for there to be atleast 12 confirmations before your request is logged.
          </Typography>

          <Typography className={ classes.instructions }>
            You can leave this page and come back later to refresh your swap requests. <br/>
            If you run into any trouble, or your swap request has not gone through after 12 confirmations, please contact us.
          </Typography>
        </Grid>
      </React.Fragment>
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
