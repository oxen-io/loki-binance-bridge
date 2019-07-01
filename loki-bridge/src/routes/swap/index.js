import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';
import { store, dispatcher, Actions, Events } from '../../store';
import { SWAP_TYPE } from '../../utils/constants';
import { PageLoader } from '../../components';
import { Selection, DepositInfo, Transactions } from './pages';
import styles from './styles';

class Swap extends Component {
  state = {
    loading: false,
    page: 0,
    swapType: SWAP_TYPE.LOKI_TO_BLOKI,
    address: '',
    swapInfo: {},
    transactions: [],
  };

  navigateToBNBAccountCreation = () => {
    this.props.history.push('/createAccount');
  }

  componentWillMount() {
    store.on(Events.ERROR, this.onError);
    store.on(Events.TOKEN_SWAPPED, this.onTokenSwapped);
    store.on(Events.TOKEN_SWAP_FINALIZED, this.onTokenSwapFinalized);
  }

  componentWillUnmount() {
    store.removeListener(Events.ERROR, this.onError);
    store.removeListener(Events.TOKEN_SWAPPED, this.onTokenSwapped);
    store.removeListener(Events.TOKEN_SWAP_FINALIZED, this.onTokenSwapFinalized);
  }

  onError = (error) => {
    this.props.showError(error);
    this.setState({ loading: false });
  }

  onTokenSwapped = (swapInfo) => {
    this.setState({ swapInfo, loading: false, page: 1 });
  }

  onTokenSwapFinalized = (transactions) => {
    this.setState({ transactions, loading: false, page: 2 });
  }

  resetState = () => {
    this.setState({
      loading: false,
      page: 0,
      swapType: SWAP_TYPE.LOKI_TO_BLOKI,
      address: '',
      swapInfo: {},
      transactions: []
    });
  }

  onNext = () => {
    switch (this.state.page) {
      case 0:
        this.swapToken();
        break;
      case 1:
        this.finalizeSwap();
        break;
      case 2:
        this.resetState();
        break;
      default:

    }
  }

  swapToken = () => {
    const { swapType, address } = this.state;
    dispatcher.dispatch({
      type: Actions.SWAP_TOKEN,
      content: {
        type: swapType,
        address
      }
    });
    this.setState({ loading: true });
  }

  finalizeSwap = () => {
    const { swapInfo } = this.state;
    dispatcher.dispatch({
      type: Actions.FINALIZE_SWAP_TOKEN,
      content: {
        uuid: swapInfo.uuid
      }
    });
    this.setState({ loading: true });
  }

  render() {
    const { classes } = this.props;

    const { page, loading, swapType, swapInfo, transactions } = this.state;

    return (
      <Grid container className={ classes.root }>
        { loading && <PageLoader /> }
        <Grid item xs={12}>
          <Typography className={ classes.heading }>
            Swap Currencies
          </Typography>
        </Grid>
        { page === 0 && (
          <Selection
            swapType={swapType}
            onSwapTypeChanged={(swapType) => this.setState({ swapType })}
            onCreateAccount={this.navigateToBNBAccountCreation}
            onNext={(address) => {
              this.setState({ address });
              // Wait for state to refresh correctly
              setImmediate(() => this.onNext());
            }}
            loading={loading}
          />
        )}
        { page === 1 && (
          <DepositInfo
            swapType={swapType}
            swapInfo={swapInfo}
            onNext={this.onNext}
            loading={loading}
          />
        )}
        { page === 2 && (
          <Transactions
            swapType={swapType}
            swapInfo={swapInfo}
            transactions={transactions}
            onDone={this.onNext}
            loading={loading}
          />
        )}
      </Grid>
    );
  };
}

Swap.propTypes = {
  classes: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default withRouter(withStyles(styles)(Swap));
