import React from 'react';
import PropTypes from 'prop-types';
import { Snackbar, IconButton } from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';

export default function ErrorSnackbar(props) {
  const { open, onClose, error } = props;

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      open={ open }
      autoHideDuration={6000}
      onClose={ onClose }
      ContentProps={{
        'aria-describedby': 'message-id',
      }}
      message={<span id="message-id">{ error.toString() }</span>}
      action={[
        <IconButton
          key="close"
          aria-label="Close"
          color="inherit"
          onClick={ onClose }
        >
          <CloseIcon />
        </IconButton>
      ]}
    />
  );
}

ErrorSnackbar.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  error: PropTypes.object,
};
