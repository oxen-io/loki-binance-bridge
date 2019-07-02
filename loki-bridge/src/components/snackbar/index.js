import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Snackbar, IconButton } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import {
  Close as CloseIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@material-ui/icons';
import styles from './styles';

// Got this from https://material-ui.com/components/snackbars/#snackbars

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

function StyledSnackbar(props) {
  const { classes, className, message, onClose, variant, open } = props;
  const Icon = variantIcon[variant];

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      open={open}
      autoHideDuration={6000}
      disableWindowBlurListener
      onClose={onClose}
      ContentProps={{
        'aria-describedby': 'message-id',
        className: clsx(classes[variant], className)
      }}
      message={
        <span id="message-id" className={classes.message}>
          <Icon className={clsx(classes.icon, classes.iconVariant)} />
          {message && message.toString()}
        </span>
      }
      action={[
        <IconButton key="close" aria-label="Close" color="inherit" onClick={onClose}>
          <CloseIcon className={classes.icon} />
        </IconButton>,
      ]}
    />
  );
}

StyledSnackbar.propTypes = {
  classes: PropTypes.any.isRequired,
  open: PropTypes.bool.isRequired,
  message: PropTypes.any,
  onClose: PropTypes.func,
  variant: PropTypes.oneOf(['success', 'warning', 'error', 'info']).isRequired,
};

export default withStyles(styles)(StyledSnackbar);
