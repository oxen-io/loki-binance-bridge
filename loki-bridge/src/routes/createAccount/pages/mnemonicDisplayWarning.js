import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';
import { Button } from '@components';
import styles from '../styles';

class MnemonicDisplayWarning extends Component {
  render() {
    const { classes, onNext } = this.props;

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.instruction }>
          <Typography>
            We are about to show your mnemonic phrase, please ensure that no one else is looking at your screen.
          </Typography>
        </Grid>
        <Grid item xs={ 12 } align="right" className={ classes.button }>
          <Button
            fullWidth
            label="Continue"
            onClick={ onNext }
          />
        </Grid>
      </React.Fragment>
    );
  }
}

MnemonicDisplayWarning.propTypes = {
  classes: PropTypes.object.isRequired,
  onNext: PropTypes.func.isRequired,
};

export default withStyles(styles)(MnemonicDisplayWarning);
