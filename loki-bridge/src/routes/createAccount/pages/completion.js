import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography, IconButton } from '@material-ui/core';
import { FileCopyOutlined as CopyIcon } from '@material-ui/icons';
import { Button } from '../../../components';
import styles from '../styles';

class Completion extends Component {
  onCopy = () => {
    var elm = document.getElementById('accountAddress');
    let range;
    // for Internet Explorer

    if (document.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(elm);
      range.select();
      document.execCommand('Copy');
    } else if (window.getSelection) {
      // other browsers
      var selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(elm);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('Copy');
    }
  };

  render() {
    const { classes, onNext, address } = this.props;

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.instruction }>
          <Typography>
          Your account number is:
          </Typography>
          <Typography className={ classes.accountAddress } id={ 'accountAddress' }>
            { address }
            <IconButton
              style={{
                verticalAlign: 'top',
                marginRight: '-5px'
              }}
              onClick={this.onCopy}
            >
              <CopyIcon/>
            </IconButton>
          </Typography>
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth={true}
            label="Done"
            onClick={ onNext }
          />
        </Grid>
      </React.Fragment>
    );
  }
}

Completion.propTypes = {
  classes: PropTypes.object.isRequired,
  address: PropTypes.string.isRequired,
  onNext: PropTypes.func.isRequired,
};

export default withStyles(styles)(Completion);
