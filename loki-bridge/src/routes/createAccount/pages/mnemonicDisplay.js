import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';
import { Button } from '@components';
import styles from '../styles';

class MnemonicDisplay extends Component {
  render() {
    const { classes, loading, onNext, mnemonic } = this.props;

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.instruction }>
          <Typography>
            Back up the mnemonic text below on paper and keep it somewhere secret and safe.
          </Typography>
        </Grid>
        <Grid item xs={ 12 }>
          <div className={ classes.bordered }>
            <Typography id="mnemonic" className={ classes.mnemonic }>
              { mnemonic }
            </Typography>
          </div>
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth
            label="Continue"
            disabled={ loading }
            onClick={ onNext }
          />
        </Grid>
      </React.Fragment>
    );
  }
}

MnemonicDisplay.propTypes = {
  classes: PropTypes.object.isRequired,
  mnemonic: PropTypes.string.isRequired,
  onNext: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

MnemonicDisplay.defaultProps = {
  loading: false,
};

export default withStyles(styles)(MnemonicDisplay);
