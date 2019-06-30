import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import { Checkbox, Input, Button } from '../../../components';
import styles from '../styles';

class CreateWallet extends Component {
  state = {
    accept: false,
    password: '',
    confirmPassword: '',
    passwordError: false,
  };

  validateCreateBNBAccount = () => {
    const { accept, password, confirmPassword } = this.state;

    const isEmpty = string => !string || string.length === 0;
    const passwordsSet = !isEmpty(password) && !isEmpty(confirmPassword);
    const passwordsMatch = password.trim() === confirmPassword.trim();
    this.setState({
      passwordError: !passwordsSet || !passwordsMatch,
    });

    return accept && passwordsSet && passwordsMatch;
  }

  onChange = (event) => {
    let val = [];
    val[event.target.id] = event.target.value;
    this.setState(val);
  };

  onCheckChange = (event) => {
    let val = [];
    val[event.target.id] = event.target.checked;
    this.setState(val);
  }

  downloadMnemonic = () => {
    const { onNext } = this.props;
    const { password } = this.state;

    if (this.validateCreateBNBAccount()) {
      onNext(password);
    }
  }

  render() {
    const { classes, loading, onCancel } = this.props;
    const {
      accept,
      password,
      confirmPassword,
      passwordError
    } = this.state;

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Input
            id="password"
            fullWidth={ true }
            label="Password"
            placeholder="Set a New Password"
            value={ password }
            error={ passwordError }
            onChange={ this.onChange }
            disabled={ loading }
            password
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="confirmPassword"
            fullWidth={ true }
            label="Re-enter Password"
            placeholder="Re-enter Password"
            value={ confirmPassword }
            error={ passwordError }
            onChange={ this.onChange }
            disabled={ loading }
            password
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Checkbox
            id="accept"
            fullWidth={ true }
            label="I understand that loki cannot recover or reset my account details. I will make a backup of the account details and complete all wallet creation steps."
            checked={ accept }
            onChange={ this.onCheckChange }
          />
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth={true}
            label="Download Mnemonic"
            disabled={ !accept }
            onClick={ this.downloadMnemonic }
          />
        </Grid>
        <Grid item xs={ 12 } align='right'>
          <Button
            fullWidth
            secondary
            label="Cancel"
            onClick={ onCancel }
          />
        </Grid>
      </React.Fragment>
    );
  }
}

CreateWallet.propTypes = {
  classes: PropTypes.object.isRequired,
  onNext: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

CreateWallet.defaultProps = {
  loading: false,
};

export default withStyles(styles)(CreateWallet);
