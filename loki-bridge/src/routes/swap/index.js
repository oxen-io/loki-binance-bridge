import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';
import { store, dispatcher, Actions, Events } from '../../store';
import { SWAP_TYPE } from '../../utils/constants';
import { PageLoader } from '../../components';
import { Selection, SwapInfo, Transactions } from './pages';
import styles from './styles';

/*
uuid: swap.uuid,
        type: swap.type,
        lokiAddress,
        bnbAddress,
        amount: swap.amount,
        txHash: swap.deposit_transaction_hash,
        transferTxHashes: transactionHashArray,
        created: swap.created,
        */

class Swap extends Component {
  state = {
    loading: false,
    page: 1,
    swapType: SWAP_TYPE.LOKI_TO_BLOKI,
    address: '',
    swapInfo: {
      bnbAddress: 'tbnb19rem68yzsjgdcmrjk4lv9jv9gd37d9gtmwfcul',
      lokiAddress: 'TRrPPz1eru2WpJa1KiAb2ZhDfnJYzuFVDLJKUrJGdy1HEfFrxfdGgfRYbbdvkQHDQMM2a3BYo3tFsU5omwtDqxuW1ggv7hWDX',
      userAddressType: 'bnb',
      uuid: '5c6ca27e-b347-7c31-614f-fb06db725302',
      swaps: [{
        uuid: '5c6ca27e-b347-7c31-614f-fb06db725302',
        amount: 10000000,
        txHash: 'test',
        transferTxHashes: [],
        created: Date.now(),
        type: SWAP_TYPE.LOKI_TO_BLOKI,
      },
      {
        uuid: '5c6ca27e-b347-7c31-614f-fb06db725303',
        amount: 2000000000000,
        txHash: 'test',
        transferTxHashes: ['hash1'],
        created: Date.now(),
        type: SWAP_TYPE.LOKI_TO_BLOKI,
      }]
    },
    transactions: [],
  };

  navigateToBNBAccountCreation = () => {
    this.props.history.push('/createAccount');
  }

  componentWillMount() {
    store.on(Events.ERROR, this.onError);
    store.on(Events.FETCHED_SWAPS, this.onSwapsFetched);
    store.on(Events.TOKEN_SWAPPED, this.onTokenSwapped);
    store.on(Events.TOKEN_SWAP_FINALIZED, this.onTokenSwapFinalized);
  }

  componentWillUnmount() {
    store.removeListener(Events.ERROR, this.onError);
    store.removeListener(Events.FETCHED_SWAPS, this.onSwapsFetched);
    store.removeListener(Events.TOKEN_SWAPPED, this.onTokenSwapped);
    store.removeListener(Events.TOKEN_SWAP_FINALIZED, this.onTokenSwapFinalized);
  }

  onError = (error) => {
    this.props.showError(error);
    this.setState({ loading: false });
  }

  onSwapsFetched = (swaps) => {
    const swapInfo = {
      ...this.state.swapInfo,
      swaps,
    };
    this.setState({ swapInfo, loading: false });
  }

  onTokenSwapped = (swapInfo) => {
    this.setState({ swapInfo, page: 1 });
    setImmediate(() => this.getSwaps());
  }

  onTokenSwapFinalized = (transactions) => {
    this.setState({ transactions, loading: false });
    this.getSwaps();
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

  getSwaps = () => {
    const { swapInfo } = this.state;
    dispatcher.dispatch({
      type: Actions.GET_SWAPS,
      content: {
        uuid: swapInfo.uuid
      }
    });
    this.setState({ loading: true });
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
          <SwapInfo
            swapType={swapType}
            swapInfo={swapInfo}
            onRefresh={this.finalizeSwap}
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
