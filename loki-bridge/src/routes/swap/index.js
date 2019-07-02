import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';
import { store, dispatcher, Actions, Events } from '@store';
import { SWAP_TYPE } from '@constants';
import { PageLoader } from '@components';
import { Selection, SwapInfo } from './pages';
import styles from './styles';

class Swap extends Component {
  state = {
    loading: false,
    page: 0,
    swapType: SWAP_TYPE.LOKI_TO_BLOKI,
    address: '',
    swapInfo: {}
  };

  navigateToBNBAccountCreation = () => {
    this.props.history.push('/createWallet');
  }

  componentWillMount() {
    store.on(Events.ERROR, this.onError);
    store.on(Events.FETCHED_SWAPS, this.onSwapsFetched);
    store.on(Events.TOKEN_SWAPPED, this.onTokenSwapped);
    store.on(Events.TOKEN_SWAP_FINALIZED, this.onTokenSwapFinalized);
  }

  componentDidMount() {
    dispatcher.dispatch({ type: Actions.GET_WITHDRAWAL_FEES });
  }

  componentWillUnmount() {
    store.removeListener(Events.ERROR, this.onError);
    store.removeListener(Events.FETCHED_SWAPS, this.onSwapsFetched);
    store.removeListener(Events.TOKEN_SWAPPED, this.onTokenSwapped);
    store.removeListener(Events.TOKEN_SWAP_FINALIZED, this.onTokenSwapFinalized);
  }

  onError = (error) => {
    this.props.showMessage(error, 'error');
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
    this.setState({ loading: false });
    const message = transactions.length === 1 ? 'Added 1 new swap' : `Added ${transactions.length} new swaps`;
    this.props.showMessage(message, 'success');

    setImmediate(() => this.getSwaps());
  }

  onNext = () => {
    switch (this.state.page) {
      case 0:
        this.swapToken();
        break;
      case 1:
        this.finalizeSwap();
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

    const { page, loading, swapType, swapInfo } = this.state;

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
  showMessage: PropTypes.func.isRequired
};

export default withRouter(withStyles(styles)(Swap));
