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

const textClasses = {
  warning: 'blackText',
};

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function StyledSnackbar(props) {
  const { classes, className, message, onClose, variant, open } = props;
  const Icon = variantIcon[variant];

  const text = textClasses[variant] || 'primaryText';
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
        <span id="message-id" className={clsx(classes.message, classes[text])}>
          <Icon className={clsx(classes.icon, classes.iconVariant)} />
          {message && capitalize(message.toString())}
        </span>
      }
      action={[
        <IconButton key="close" aria-label="Close" color="inherit" onClick={onClose}>
          <CloseIcon className={clsx(classes.icon, classes[text])} />
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
