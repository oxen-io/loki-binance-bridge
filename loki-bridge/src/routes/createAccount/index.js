import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  Paper,
  IconButton,
  SvgIcon
} from '@material-ui/core';
import { store, dispatcher, Actions, Events } from '../../store';
import { PageLoader, Checkbox, Input, Button } from '../../components';
import styles from './styles';

class CreateAccount extends Component {
  state = {
    loading: false,
    page: 0,
    accept: false,
    account: null,
    enteredWords: [],
    wordError: false,
    validateEnabled: false,
    password: '',
    confirmPassword: '',
    passwordError: false,
  };

  componentWillMount() {
    store.on(Events.ERROR, this.onError);
    store.on(Events.BNB_ACCOUNT_CREATED, this.onBNBAccountCreated);
    store.on(Events.BNB_KEYSTORE_DOWNLOADED, this.onBNBKeystoreDownloaded);
  }

  componentWillUnmount() {
    store.removeListener(Events.ERROR, this.onError);
    store.removeListener(Events.BNB_ACCOUNT_CREATED, this.onBNBAccountCreated);
    store.removeListener(Events.BNB_KEYSTORE_DOWNLOADED, this.onBNBKeystoreDownloaded);
  }

  onError = (error) => {
    this.props.showError(error);
    this.setState({ loading: false });
  }

  onBNBAccountCreated = (account) => {
    this.setState({
      account,
      mnemonicWords: account.mnemonic.split(' ').sort(() => Math.random() - 0.5),
    });

    this.downloadBNBKeystore(account.privateKey);
  }

  onBNBKeystoreDownloaded = () => {
    this.setState({ page: 1, loading: false });
  }

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

  createBNBAccount = () => {
    dispatcher.dispatch({ type: Actions.CREATE_BNB_ACCOUNT });
    this.setState({ loading: true });
  }

  downloadBNBKeystore = (privateKey) => {
    const { password } = this.state;
    dispatcher.dispatch({
      type: Actions.DOWNLOAD_BNB_KEYSTORE,
      content: {
        password,
        privateKey
      }
    });
    this.setState({ loading: true });
  }

  onNext = () => {
    switch (this.state.page) {
      case 0: // Input password
        if (this.validateCreateBNBAccount())
          this.createBNBAccount();
        break;
      case 1: // Mnemonic reveal warning
      case 2: // Mnemonic
      case 3: // Mnemonic confirm
        this.setState({ page: this.state.page + 1 });
        break;
      default: break;
    }
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

  renderInitialPage = () => {
    const {
      classes
    } = this.props;

    const {
      accept,
      password,
      confirmPassword,
      passwordError,
      loading,
    } = this.state;

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Typography className={ classes.step }>
            Step 1 of 4
          </Typography>
        </Grid>
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
            label={ 'Download Mnemonic' }
            disabled={ !accept }
            onClick={ this.onNext }
          />
        </Grid>
      </React.Fragment>
    );
  }

  render() {
    const { page, loading } = this.state;

    return (
      <Grid container>
        { loading && <PageLoader /> }
        <Grid item xs={12}>
          <Typography>Create New Binance Chain Wallet</Typography>
        </Grid>
        { page === 0 && this.renderInitialPage() }
      </Grid>
    );
  }
}

CreateAccount.propTypes = {
  showError: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(CreateAccount);
