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
import PageLoader from '../../components/pageLoader';
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
    password: null,
    confirmPassword: null,
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
  }

  onBNBKeystoreDownloaded = () => {
    this.setState({ page: 1, loading: false });
  }

  validateCreateBNBAccount = () => {
    const { accept, password, confirmPassword } = this.state;

    const passwordsSet = password && confirmPassword;
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
        private_key: privateKey
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

  renderInitialPage = () => {
    return <h1>Page 0</h1>;
  }

  render() {
    const { page, loading } = this.state;

    return (
      <Grid container>
        { true && <PageLoader /> }
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
