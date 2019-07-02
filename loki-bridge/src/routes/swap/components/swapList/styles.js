import { orange, green } from '@material-ui/core/colors';

const styles = theme => ({
  root: {
    margin: theme.spacing(2, 0),
  },
  container: {
    padding: theme.spacing(1, 2)
  },
  info: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  rowCenter: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pending: {
    color: orange[500]
  },
  completed: {
    color: green.A400
  },
  time: {
    fontSize: '1em'
  },
  timeSeperator: {
    margin: '0 4px'
  },
  divider: {
    margin: '8px 0'
  },
  hashTitle: {
    fontWeight: '600',
    fontSize: '1em',
    marginRight: '4px'
  },
  hash: {
    fontStyle: 'italic',
    overflowWrap: 'break-word'
  },
  amount: {
    fontSize: '1.25em',
    fontWeight: '700'
  }
});

export default styles;
