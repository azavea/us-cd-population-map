import * as Constants from '../constants'

const st = {
  id:null,
  label:null,
  st:null,
}

const initSelectCd = {
  p: st,
  n: st
}


const initialState: State = {
  hoverCd: initSelectCd,
  highlightCd: initSelectCd,
  selectCd: initSelectCd,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case Constants.SET_HIGHLIGHT_CD:
      return {
        ...state,
        highlightCd: {
          n: action.option,
          p: state.highlightCd.n
        }
      };
    case Constants.SET_HOVER_CD:
      return {
        ...state,
        hoverCd: {
          n: action.option,
          p: state.hoverCd.n
        }
      };
    case Constants.SET_SELECT_CD:
      return {
        ...state,
        selectCd: {
          n: action.option,
          p: state.selectCd.n
        }
      };
    default:
      return state;
  }
}

export { reducer, initialState };
