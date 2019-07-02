import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { Input, Button, Select } from '@components';
import { SWAP_TYPE, TYPE } from '@constants';
import styles from '../styles';

class Selection extends Component {
  state = {
    address: '',
    addressError: false,
    options: [{
      value: SWAP_TYPE.LOKI_TO_BLOKI,
      description: 'LOKI to B-LOKI',
    }, {
      value: SWAP_TYPE.BLOKI_TO_LOKI,
      description: 'B-LOKI to LOKI',
    }],
  };

  onNext = () => {
    const { address } = this.state;
    const { onNext } = this.props;

    const isValidAddress = address && address.length > 0;
    this.setState({ addressError: !isValidAddress });

    if (isValidAddress) onNext(address);
  }

  onAddressChanged = (event) => {
    this.setState({ address: event.target.value });
  }

  onSwapTypeChanged = (event) => {
    this.props.onSwapTypeChanged(event.target.value);
  }

  getAddressType = () => {
    const { swapType } = this.props;
    return swapType === SWAP_TYPE.LOKI_TO_BLOKI ? TYPE.BNB : TYPE.LOKI;
  }

  render() {
    const { swapType, loading, classes, onCreateAccount } = this.props;
    const { options, address, addressError } = this.state;

    const addressType = this.getAddressType();
    const inputLabel = addressType === TYPE.LOKI ? 'Loki Address' : 'BNB Address';
    const inputPlaceholder = addressType === TYPE.LOKI ? 'L...' : 'bnb...';

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Select
            fullWidth
            label="Swap Type"
            options={options}
            value={swapType}
            handleChange={this.onSwapTypeChanged}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            fullWidth
            label={inputLabel}
            placeholder={inputPlaceholder}
            value={address}
            error={addressError}
            onChange={this.onAddressChanged}
            disabled={loading}
          />
          { addressType === TYPE.BNB && (
            <Typography className={ classes.createAccount } onClick={ onCreateAccount }>
              Don't have an account? Create one
            </Typography>
          )}
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth
            label="Next"
            disabled={loading}
            onClick={this.onNext}
          />
        </Grid>
      </React.Fragment>
    );
  }
}

Selection.propTypes = {
  classes: PropTypes.object.isRequired,
  swapType: PropTypes.string.isRequired,
  onSwapTypeChanged: PropTypes.func.isRequired,
  onCreateAccount: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default withStyles(styles)(Selection);
