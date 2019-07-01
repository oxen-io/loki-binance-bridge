import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography, Paper } from '@material-ui/core';
import { Button } from '../../../components';
import styles from '../styles';

class MnemonicConfirm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mnemonicWords: props.mnemonicWords || [],
      validateEnabled: false,
      enteredWords: [],
      wordError: false,
    };
  }

  addWord = (word) => {
    const { mnemonic } = this.props;
    const { mnemonicWords, enteredWords } = this.state;

    const goal = mnemonic;

    var tmpMnemonicWords = Array.from(mnemonicWords);

    for(let i = 0; i < tmpMnemonicWords.length; i++) {
      if(tmpMnemonicWords[i] === word) {
        tmpMnemonicWords.splice(i, 1);
        break;
      }
    }

    enteredWords.push(word);

    //validate the click
    const joinedWords = enteredWords.join(' ');
    if(joinedWords === goal.substring(0, joinedWords.length)) {
      this.setState({
        mnemonicWords: tmpMnemonicWords,
        enteredWords,
        wordError: false
      });
    } else {
      enteredWords.pop();
      this.setState({
        enteredWords,
        wordError: true
      });
    }

    this.setState({
      validateEnabled: joinedWords === goal
    });
  };

  renderWords = () => {
    const { classes } = this.props;

    return this.state.mnemonicWords.map((word) => {
      return (
        <Paper className={ classes.wordPaper } onClick={ (e) => { this.addWord(word); } } key={word}>
          <Typography>
            { word }
          </Typography>
        </Paper>
      );
    });
  };

  render() {
    const { classes, onNext, onBack } = this.props;
    const {
      enteredWords,
      wordError,
      loading,
      validateEnabled
    } = this.state;

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.instruction }>
          <Typography>
            Please select the Mnemonic Phrase in the correct order to ensure that your copy is correct.
          </Typography>
        </Grid>
        <Grid item xs={ 12 }>
          <div className={ classes.bordered }>
            <Typography className={ classes.mnemonic }>
              { enteredWords.join(' ') }
            </Typography>
          </div>
        </Grid>
        <Grid item xs={ 12 }>
          <div className={ wordError ? classes.borderedError : classes.bordered }>
            { this.renderWords() }
          </div>
        </Grid>
        <Grid item xs={ 6 } align='left' className={ classes.button }>
          <Button
            fullWidth
            secondary
            label="Back"
            disabled={ loading }
            onClick={ onBack }
          />
        </Grid>
        <Grid item xs={ 6 } align='right' className={ classes.button }>
          <Button
            fullWidth
            label="Validate"
            disabled={ loading || !validateEnabled }
            onClick={ onNext }
          />
        </Grid>
      </React.Fragment>
    );
  }
}

MnemonicConfirm.propTypes = {
  classes: PropTypes.object.isRequired,
  mnemonic: PropTypes.string.isRequired,
  mnemonicWords: PropTypes.array.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

MnemonicConfirm.defaultProps = {
  loading: false,
};

export default withStyles(styles)(MnemonicConfirm);
