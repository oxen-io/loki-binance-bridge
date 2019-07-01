import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';
import { store, dispatcher, Actions, Events } from '@store';
import { PageLoader } from '@components';
import { CreateWallet, MnemonicDisplayWarning, MnemonicDisplay, MnemonicConfirm, Completion } from './pages';
import styles from './styles';

class CreateAccount extends Component {
  state = {
    loading: false,
    page: 0,
    account: {},
    enteredWords: [],
    wordError: false,
    validateEnabled: false,
    password: '',
    mnemonicWords: [],
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

  navigateBackToHome = () => {
    this.props.history.push('/');
  }

  onNext = () => {
    switch (this.state.page) {
      case 0: // Input password
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

  render() {
    const { classes } = this.props;
    const { page, loading, account, mnemonicWords } = this.state;

    return (
      <Grid container spacing={1} className={ classes.root }>
        { loading && <PageLoader /> }
        <Grid item xs={12}>
          <Typography className={ classes.heading }>
            Create New Binance Chain Wallet
          </Typography>
        </Grid>
        <React.Fragment>
          <Grid item xs={ 12 }>
            <Typography className={ classes.step }>
              { page < 3 ? `Step ${page + 1} of 4` : 'Completed' }
            </Typography>
          </Grid>
        </React.Fragment>
        { page === 0 && (
          <CreateWallet
            loading={loading}
            onNext={(password) => {
              this.setState({ password });
              this.onNext();
            }}
            onCancel={this.navigateBackToHome}
          />
        )}
        { page === 1 && <MnemonicDisplayWarning onNext={this.onNext} />}
        { page === 2 && (
          <MnemonicDisplay
            loading={loading}
            mnemonic={account.mnemonic}
            onNext={this.onNext}
          />
        )}
        { page === 3 && (
          <MnemonicConfirm
            loading={loading}
            mnemonic={account.mnemonic}
            mnemonicWords={mnemonicWords}
            onNext={this.onNext}
            onBack={() => this.setState({ page: page - 1 })}
          />
        )}
        { page === 4 && <Completion onNext={this.navigateBackToHome} address={account.address} />}
      </Grid>
    );
  }
}

CreateAccount.propTypes = {
  showError: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default withRouter(withStyles(styles)(CreateAccount));
