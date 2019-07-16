import { orange, green } from '@material-ui/core/colors';

const styles = theme => ({
  root: {
    margin: theme.spacing(2, 0),
  },
  item: {
    padding: theme.spacing(1, 2)
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
  },
  emptyTitle: {
    padding: theme.spacing(1, 0),
    color: '#c8c8c8'
  }
});

export default styles;
