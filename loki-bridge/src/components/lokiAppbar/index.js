import React from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { AppBar, Toolbar, Typography, Link } from '@material-ui/core';
import styles from './styles';

function LokiAppBar(props) {
  const { classes } = props;
  return (
    <AppBar position="static" className={classes.root}>
      <Toolbar>
        <Typography variant="h5" className={classes.title}>
          Loki Bridge
        </Typography>
        <Typography>
          <Link component={RouterLink} to='/' color="textPrimary" className={classes.link}>
            Home
          </Link>
        </Typography>
        <Typography>
          <Link component={RouterLink} to='/createWallet' color="textPrimary" className={classes.link}>
            Create BNB Wallet
          </Link>
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

LokiAppBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(LokiAppBar);
