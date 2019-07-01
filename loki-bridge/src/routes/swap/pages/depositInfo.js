import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography, IconButton } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { FileCopyOutlined as CopyIcon } from '@material-ui/icons';
import { Button } from '../../../components';
import { SWAP_TYPE, TYPE } from '../../../utils/constants';
import styles from '../styles';

class DepositInfo extends Component {
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

  render() {
    const { swapType, classes, swapInfo, loading, onNext } = this.props;

    const { userAddressType, lokiAddress, bnbAddress } = swapInfo;

    const depositCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'Loki' : 'B-Loki';
    const depositAddress = userAddressType === TYPE.LOKI ? bnbAddress : lokiAddress;

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
          <Typography className={ classes.instructionUnderlined }>
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
          <Typography className={ classes.instructionUnderlined }>
            After you've completed the transfer, click the "NEXT" button so we can verify your transaction.
          </Typography>
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth
            label="Next"
            disabled={loading}
            onClick={onNext}
          />
        </Grid>
      </React.Fragment>
    );
  }
}

DepositInfo.propTypes = {
  classes: PropTypes.object.isRequired,
  swapType: PropTypes.string.isRequired,
  swapInfo: PropTypes.object.isRequired,
  onNext: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default withStyles(styles)(DepositInfo);
